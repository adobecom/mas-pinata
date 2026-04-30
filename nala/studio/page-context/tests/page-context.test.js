import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import PageContextPage from '../page-context.page.js';
import PageContextSpec from '../specs/page-context.spec.js';

const { features } = PageContextSpec;

test.describe('M@S Studio Page Context Placeholder Contract test suite', () => {
    let pageContextPage;

    // @studio-page-context-smoke
    // window.masPageContext seeded before page load is preserved through hydration
    // and a card that does not author any `{{token}}` renders normally — the
    // contract is a no-op for token-free cards.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        pageContextPage = new PageContextPage(page);

        await test.step('step-1: Seed window.masPageContext before page load', async () => {
            await pageContextPage.seedPageContextBeforeLoad({
                [data.contextKey]: data.contextValue,
            });
        });

        await test.step('step-2: Navigate to studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-3: Card hydrates without errors', async () => {
            await studio.waitForCardsLoaded();
            const card = pageContextPage.cardWith(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-4: window.masPageContext survives hydration unmodified', async () => {
            const ctx = await pageContextPage.readPageContextGlobal();
            expect(ctx).not.toBeNull();
            expect(ctx[data.contextKey]).toBe(data.contextValue);
        });

        await test.step('step-5: Card text never shows the raw {{token}}', async () => {
            const containsRaw = await pageContextPage.cardTextContainsRawToken(data.cardid, data.rawToken);
            expect(containsRaw).toBe(false);
        });
    });

    // @studio-page-context-fallback
    // No window.masPageContext set — cards still render normally and no raw
    // `{{token}}` leaks into the DOM. Validates the contract is non-breaking
    // on non-product pages.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        pageContextPage = new PageContextPage(page);

        await test.step('step-1: Navigate without seeding window.masPageContext', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Card hydrates normally with no context set', async () => {
            await studio.waitForCardsLoaded();
            const card = pageContextPage.cardWith(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-3: window.masPageContext was never written', async () => {
            const ctx = await pageContextPage.readPageContextGlobal();
            expect(ctx).toBeNull();
        });

        await test.step('step-4: Card text never shows the raw {{token}}', async () => {
            const containsRaw = await pageContextPage.cardTextContainsRawToken(data.cardid, data.rawToken);
            expect(containsRaw).toBe(false);
        });
    });

    // @studio-page-context-late-ready
    // After page load, set window.masPageContext and dispatch the
    // `mas:page-context:ready` event. Verify the documented event flows on
    // `document` so MEP integrators can rely on it post-load.
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        pageContextPage = new PageContextPage(page);

        await test.step('step-1: Install ready-event listener before navigation', async () => {
            await pageContextPage.installReadyEventCounterBeforeLoad();
        });

        await test.step('step-2: Navigate to studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-3: Wait for card to render', async () => {
            await studio.waitForCardsLoaded();
            const card = pageContextPage.cardWith(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-4: Event listener has not fired yet', async () => {
            const count = await pageContextPage.readReadyEventCount();
            expect(count).toBe(0);
        });

        await test.step('step-5: Set context and dispatch ready event after load', async () => {
            await pageContextPage.setPageContextAndDispatchReady({
                [data.contextKey]: data.contextValue,
            });
        });

        await test.step('step-6: Ready event observed on document and global is set', async () => {
            const count = await pageContextPage.readReadyEventCount();
            expect(count).toBeGreaterThanOrEqual(1);
            const ctx = await pageContextPage.readPageContextGlobal();
            expect(ctx).not.toBeNull();
            expect(ctx[data.contextKey]).toBe(data.contextValue);
        });

        await test.step('step-7: Card remains visible after late context is set', async () => {
            const card = pageContextPage.cardWith(data.cardid);
            await expect(card).toBeVisible();
        });
    });
});
