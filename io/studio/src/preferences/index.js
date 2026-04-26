/**
 * This action serves as a target endpoint for retrieving and updating per-user
 * Studio preferences (e.g. saved views).
 * - GET: Returns the user's preferences blob (or { savedViews: [] } when none)
 * - PUT: Replaces the user's preferences blob wholesale
 */

const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs } = require('../../utils');
const { init } = require('@adobe/aio-lib-state');
const { Ims } = require('@adobe/aio-lib-ims');

const CACHE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateSavedViews(savedViews) {
    if (!Array.isArray(savedViews)) return 'savedViews must be an array';
    let defaultCount = 0;
    for (const view of savedViews) {
        if (!isPlainObject(view)) return 'each saved view must be an object';
        if (typeof view.id !== 'string' || view.id === '') return 'each saved view requires an id (string)';
        if (typeof view.name !== 'string' || view.name.trim() === '') return 'each saved view requires a non-empty name';
        if (!isPlainObject(view.filters)) return `view "${view.name}" requires filters (object)`;
        if (!isPlainObject(view.sort)) return `view "${view.name}" requires sort (object)`;
        if (typeof view.viewMode !== 'string') return `view "${view.name}" requires viewMode (string)`;
        if (typeof view.isDefault !== 'boolean') return `view "${view.name}" requires isDefault (boolean)`;
        if (view.isDefault === true) defaultCount += 1;
    }
    if (defaultCount > 1) return 'only one saved view may have isDefault: true';
    return null;
}

async function main(params) {
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        logger.info('Calling the main action');

        const requiredHeaders = ['Authorization'];
        const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authHeader = params.__ow_headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.warn('Missing or invalid Authorization header');
            return errorResponse(401, 'Unauthorized: Bearer token is missing or invalid', logger);
        }

        const token = authHeader.slice(7);
        let imsValidation;
        try {
            const ims = new Ims('prod');
            imsValidation = await ims.validateToken(token, 'mas-studio');
            if (!imsValidation || !imsValidation.valid) {
                logger.warn('IMS token validation failed');
                return errorResponse(401, 'Unauthorized: Invalid IMS token', logger);
            }
            logger.info('IMS token validated successfully');
        } catch (error) {
            logger.error('IMS Token validation failed with error:', error);
            return errorResponse(401, 'Unauthorized: Token validation error', logger);
        }

        const userId = imsValidation.token?.user_id || imsValidation.user_id || imsValidation.userId;
        if (!userId) {
            logger.warn('Validated IMS token missing user_id claim');
            return errorResponse(401, 'Unauthorized: Token missing user identity', logger);
        }

        const CACHE_KEY = `mas-prefs:${userId}`;
        const method = (params.__ow_method || 'GET').toUpperCase();
        const state = await init();

        logger.info(`Method: ${method}`);

        if (method === 'GET') {
            const cached = await state.get(CACHE_KEY);
            if (!cached || !cached.value) {
                return {
                    statusCode: 200,
                    body: { savedViews: [] },
                };
            }
            try {
                const parsed = JSON.parse(cached.value);
                if (!Array.isArray(parsed?.savedViews)) {
                    return { statusCode: 200, body: { savedViews: [] } };
                }
                return { statusCode: 200, body: parsed };
            } catch (e) {
                logger.error('Failed to parse cached preferences blob', e);
                return { statusCode: 200, body: { savedViews: [] } };
            }
        }

        if (method === 'PUT') {
            const savedViews = params.savedViews;
            const validationError = validateSavedViews(savedViews);
            if (validationError) {
                return errorResponse(400, `Invalid input: ${validationError}`, logger);
            }
            await state.put(CACHE_KEY, JSON.stringify({ savedViews }), {
                ttl: CACHE_MAX_AGE_S,
            });
            return {
                statusCode: 200,
                body: {
                    message: 'Successfully stored preferences',
                    count: savedViews.length,
                },
            };
        }

        return errorResponse(405, `Method ${method} not allowed. Use GET or PUT.`, logger);
    } catch (error) {
        logger.error(error);
        return errorResponse(500, 'server error', logger);
    }
}

exports.main = main;
