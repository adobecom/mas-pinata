import { test as base } from '@playwright/test';
import { createTimeoutExtender, install429HandlerOnContext, wrapApiRequestContext } from './rate-limit-429.js';

/**
 * Plain Playwright `test` whose browser context and `request` fixture pause and retry on HTTP 429 (see
 * rate-limit-429.js). Used by tests that do not need the masTest page objects.
 */
export const test = base.extend({
    context: async ({ context }, use, testInfo) => {
        await install429HandlerOnContext(context, { onWait: createTimeoutExtender(() => testInfo) });
        await use(context);
    },
    request: async ({ request, baseURL }, use, testInfo) => {
        await use(wrapApiRequestContext(request, { baseURL, onWait: createTimeoutExtender(() => testInfo) }));
    },
});

export { expect } from '@playwright/test';
