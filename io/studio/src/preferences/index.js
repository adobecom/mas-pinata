/**
 * This action persists user-scoped Studio preferences (currently: saved views).
 * - GET: return { savedViews: [] } for the authenticated user (empty when unset)
 * - POST: replace the user's saved-views list with the provided array
 *
 * Auth is enforced in the handler via IMS token validation so the bearer token
 * reaches user code. The state-store key is derived from the validated IMS
 * user_id so users can only read/write their own preferences.
 */

const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs } = require('../../utils');
const { init } = require('@adobe/aio-lib-state');
const { Ims } = require('@adobe/aio-lib-ims');

const TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year
const MAX_VIEWS = 20;
const MAX_NAME_LENGTH = 60;
const MAX_BODY_BYTES = 32 * 1024; // 32 KB bound on serialized state-store value

function keyForUser(imsUserId) {
    return `mas-prefs-${imsUserId}`;
}

function isValidView(view) {
    if (!view || typeof view !== 'object') return false;
    if (typeof view.id !== 'string' || !view.id) return false;
    if (typeof view.name !== 'string') return false;
    const trimmed = view.name.trim();
    if (!trimmed || trimmed.length > MAX_NAME_LENGTH) return false;
    if (!view.payload || typeof view.payload !== 'object') return false;
    return true;
}

async function main(params) {
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        logger.info('Calling the preferences action');

        const requiredHeaders = ['Authorization'];
        const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authHeader = params.__ow_headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Missing or invalid Authorization header');
            return errorResponse(401, 'Unauthorized: Bearer token is missing or invalid', logger);
        }

        const token = authHeader.slice(7);
        let imsUserId;
        try {
            const ims = new Ims('prod');
            const imsValidation = await ims.validateToken(token, 'mas-studio');
            if (!imsValidation || !imsValidation.valid) {
                logger.warn('IMS token validation failed');
                return errorResponse(401, 'Unauthorized: Invalid IMS token', logger);
            }
            imsUserId = imsValidation.token?.user_id;
            if (!imsUserId) {
                logger.warn('IMS token missing user_id');
                return errorResponse(401, 'Unauthorized: Missing user id', logger);
            }
        } catch (error) {
            logger.error('IMS Token validation failed with error:', error);
            return errorResponse(401, 'Unauthorized: Token validation error', logger);
        }

        const method = (params.__ow_method || 'GET').toUpperCase();
        const state = await init();
        const cacheKey = keyForUser(imsUserId);

        logger.info(`Method: ${method}`);

        if (method === 'GET') {
            const cached = await state.get(cacheKey);
            if (!cached || !cached.value) {
                return { statusCode: 200, body: { savedViews: [] } };
            }
            let parsed;
            try {
                parsed = JSON.parse(cached.value);
            } catch (e) {
                logger.error('Failed to parse cached preferences', e);
                return { statusCode: 200, body: { savedViews: [] } };
            }
            const savedViews = Array.isArray(parsed?.savedViews) ? parsed.savedViews : [];
            return { statusCode: 200, body: { savedViews } };
        }

        if (method === 'POST') {
            const savedViews = params.savedViews;
            if (!Array.isArray(savedViews)) {
                return errorResponse(400, 'Invalid input: savedViews must be an array', logger);
            }
            if (savedViews.length > MAX_VIEWS) {
                return errorResponse(400, `max ${MAX_VIEWS} saved views`, logger);
            }
            for (const view of savedViews) {
                if (!isValidView(view)) {
                    return errorResponse(
                        400,
                        'Invalid saved view: each view must have id, name (1-60 chars), and payload object',
                        logger,
                    );
                }
            }
            const serialized = JSON.stringify({ savedViews });
            if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
                return errorResponse(400, 'Saved views payload too large', logger);
            }
            await state.put(cacheKey, serialized, { ttl: TTL_SECONDS });
            return { statusCode: 200, body: { savedViews } };
        }

        return errorResponse(405, `Method ${method} not allowed. Use GET or POST.`, logger);
    } catch (error) {
        logger.error(error);
        return errorResponse(500, 'server error', logger);
    }
}

exports.main = main;
