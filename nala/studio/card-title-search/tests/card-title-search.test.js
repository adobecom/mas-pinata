import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import CardTitleSearchSpec from '../specs/card-title-search.spec.js';

const { features } = CardTitleSearchSpec;

test.describe('M@S Studio Card Title Search', () => {
    // @studio-card-title-search-smoke — Search by cardTitle field returns matching card via URL query
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.searchTerm}`;
        setTestPage(testPage);

        await test.step('step-1: Go to test page with cardTitle search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card matching cardTitle is visible', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Validate search results contain matching cards', async () => {
            const cards = studio.renderView.locator('merch-card');
            const count = await cards.count();
            expect(count).toBeGreaterThanOrEqual(1);
        });
    });

    // @studio-card-title-search-partial — Partial text matches cardTitle field
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.searchTerm}`;
        setTestPage(testPage);

        await test.step('step-1: Go to test page with partial cardTitle query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card with partial title match is visible', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });
    });

    // @studio-card-title-search-case-insensitive — Case-insensitive search matches cardTitle
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.searchTerm}`;
        setTestPage(testPage);

        await test.step('step-1: Go to test page with lowercase query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate case-insensitive match returns card', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });
    });

    // @studio-card-title-search-field-input — Search via input field finds card by cardTitle
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Enter cardTitle text in search field', async () => {
            await studio.waitForCardsLoaded();
            await expect(studio.searchInput).toBeVisible();
            await studio.searchInput.fill(data.searchTerm);
            await page.keyboard.press('Enter');
        });

        await test.step('step-3: Validate card matching cardTitle is in results', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            const cards = studio.renderView.locator('merch-card');
            const count = await cards.count();
            expect(count).toBeGreaterThanOrEqual(1);
        });
    });
});
