/**
 * Page-context placeholder contract for dynamic merch-card content.
 *
 * MEP (Milo Experience Platform) — or any page-level integrator — populates a
 * structured context object on `window.masPageContext` *before* (or shortly
 * after) merch-cards begin hydration. Cards then substitute `{{key}}` tokens
 * found in any text field (title, subtitle, description, etc.) at hydration
 * time.
 *
 * Required shape:
 *   window.masPageContext = {
 *       product_name: 'Photoshop',
 *       // open for extension — any author-typed `{{key}}` looks up context[key]
 *   }
 *
 *   - keys: snake_case strings
 *   - values: strings (non-string values are coerced via `String()`)
 *   - `product_name` is the seed key; `product_family`, `features`, etc. may
 *     follow without any code change here.
 *
 * Required event:
 *   Callers that set `window.masPageContext` *after* page load **must** also
 *   dispatch `new CustomEvent('mas:page-context:ready')` on `document` so cards
 *   waiting for context can resolve early. Setting the global before any
 *   `<merch-card>` connects is also supported (cards detect a pre-set global
 *   and skip the wait).
 *
 *   Cards only wait for the context when at least one interpolatable field
 *   actually contains `{{` — token-free cards never block on this contract.
 *
 * Fallback contract:
 *   - Missing context (no global set within the timeout) → `{{token}}` resolves
 *     to empty string.
 *   - Missing key (global set but key absent) → empty string.
 *   - Never the raw `{{token}}` — visitors should not see it.
 */

export const PAGE_CONTEXT_GLOBAL = 'masPageContext';
export const EVENT_MAS_PAGE_CONTEXT_READY = 'mas:page-context:ready';
export const PAGE_CONTEXT_TIMEOUT_MS = 1500;

const TOKEN_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Returns the current page-context object, or `null` when unset.
 * @returns {Record<string, string> | null}
 */
export function getPageContext() {
    return window[PAGE_CONTEXT_GLOBAL] ?? null;
}

/**
 * Resolves when `window.masPageContext` is set — either because it was set
 * before this call (fast path), because the `mas:page-context:ready` event
 * fires on `document`, or because the timeout elapses. Never rejects.
 *
 * @param {number} [timeoutMs]
 * @returns {Promise<Record<string, string> | null>}
 */
export function whenPageContextReady(timeoutMs = PAGE_CONTEXT_TIMEOUT_MS) {
    if (window[PAGE_CONTEXT_GLOBAL]) {
        return Promise.resolve(getPageContext());
    }
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            document.removeEventListener(
                EVENT_MAS_PAGE_CONTEXT_READY,
                finish,
            );
            clearTimeout(timer);
            resolve(getPageContext());
        };
        const timer = setTimeout(finish, timeoutMs);
        document.addEventListener(EVENT_MAS_PAGE_CONTEXT_READY, finish, {
            once: true,
        });
    });
}

/**
 * Substitutes `{{key}}` tokens in a string with `context[key]`. Missing keys
 * and missing context resolve to empty string. Returns the original value
 * unchanged for non-strings or strings without `{{`.
 *
 * @param {*} value
 * @param {Record<string, string> | null | undefined} context
 * @returns {*}
 */
export function interpolateTokens(value, context) {
    if (typeof value !== 'string') return value;
    if (value.indexOf('{{') === -1) return value;
    return value.replace(TOKEN_RE, (_, key) => {
        const replacement = context?.[key];
        return replacement == null ? '' : String(replacement);
    });
}

/**
 * Applies `interpolateTokens` to each named field on `fields`, mutating in
 * place. String fields are substituted; arrays of strings are mapped; any
 * other value (number, object, undefined) is left untouched.
 *
 * @param {Record<string, any>} fields
 * @param {Record<string, string> | null | undefined} context
 * @param {string[]} fieldNames
 */
export function interpolateFields(fields, context, fieldNames) {
    if (!fields || !fieldNames?.length) return;
    for (const name of fieldNames) {
        const value = fields[name];
        if (typeof value === 'string') {
            fields[name] = interpolateTokens(value, context);
        } else if (Array.isArray(value)) {
            fields[name] = value.map((item) =>
                interpolateTokens(item, context),
            );
        }
    }
}
