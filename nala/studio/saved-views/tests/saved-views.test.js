import { test, expect, studio, savedViews, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SavedViewsSpec from '../specs/saved-views.spec.js';

const { features } = SavedViewsSpec;

/**
 * Set up a Playwright route that mocks the AIO preferences endpoint.
 * The returned `getStoredViews()` reflects the last POST body so each step
 * can assert that the server-side persistence call actually happened.
 */
async function mockPreferencesEndpoint(page) {
    let stored = [];
    await page.route('**/preferences', async (route) => {
        const request = route.request();
        const method = request.method();
        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ savedViews: stored }),
            });
            return;
        }
        if (method === 'POST') {
            try {
                const body = JSON.parse(request.postData() || '{}');
                stored = Array.isArray(body.savedViews) ? body.savedViews : [];
            } catch (e) {
                stored = [];
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ savedViews: stored }),
            });
            return;
        }
        await route.continue();
    });
    return {
        getStoredViews: () => stored,
    };
}

test.describe('M@S Studio Saved Views test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL, browser }) => {
        const { data } = features[0];
        const initialUrl = `${baseURL}${features[0].path}${miloLibs}${data.browserParamsContent}`;
        setTestPage(initialUrl);

        const prefs = await mockPreferencesEndpoint(page);

        await test.step('step-1: Navigate to MAS Studio with filters applied via hash', async () => {
            await page.goto(initialUrl);
            await page.waitForLoadState('domcontentloaded');
            await expect(savedViews.picker).toBeVisible();
        });

        await test.step('step-2: Save the current view with a name', async () => {
            await savedViews.saveViewAs(data.viewName);
            await expect(savedViews.saveDialog).toBeHidden();
            await expect.poll(() => prefs.getStoredViews().length).toBeGreaterThan(0);
            const stored = prefs.getStoredViews();
            expect(stored.some((v) => v.name === data.viewName)).toBeTruthy();
        });

        await test.step('step-3: Assert the named entry appears in the picker', async () => {
            await savedViews.openPicker();
            await expect(savedViews.rowByName(data.viewName)).toBeVisible();
            // Close picker
            await page.keyboard.press('Escape');
        });

        await test.step('step-4: Change filters, apply the saved view, and assert URL hash restored', async () => {
            await page.goto(`${baseURL}${features[0].path}${miloLibs}${data.browserParamsReset}`);
            await page.waitForLoadState('domcontentloaded');
            await savedViews.applyView(data.viewName);
            // Router hash updates are debounced ~50ms.
            await page.waitForTimeout(200);
            for (const key of data.expectedHashKeys) {
                expect(page.url()).toContain(key);
            }
        });

        await test.step('step-5: Open the shareable URL in a new context and assert restored state', async () => {
            const sharedUrl = page.url();
            const context = await browser.newContext();
            const newPage = await context.newPage();
            await mockPreferencesEndpoint(newPage);
            await newPage.goto(sharedUrl);
            await newPage.waitForLoadState('domcontentloaded');

            const newSavedViews = new (savedViews.constructor)(newPage);
            await expect(newSavedViews.picker).toBeVisible();
            await expect(newSavedViews.filterBadge).toHaveText(data.expectedFilterCount);

            for (const key of data.expectedHashKeys) {
                expect(newPage.url()).toContain(key);
            }
            await context.close();
        });

        await test.step('step-6: Delete the view and assert it is gone', async () => {
            // Confirm the deletion prompt automatically.
            page.once('dialog', (dialog) => dialog.accept());
            await savedViews.deleteView(data.viewName);
            await page.waitForTimeout(200);
            expect(prefs.getStoredViews().some((v) => v.name === data.viewName)).toBeFalsy();
            await savedViews.openPicker();
            await expect(savedViews.rowByName(data.viewName)).toHaveCount(0);
        });
    });
});
