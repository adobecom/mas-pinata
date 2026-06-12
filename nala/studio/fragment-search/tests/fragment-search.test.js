import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import FragmentSearchSpec from '../specs/fragment-search.spec.js';

const { features } = FragmentSearchSpec;

test.describe('Fragment Search Title feature test suite', () => {
    // @studio-fragment-search-title — Typing a title substring returns matching fragments
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are loaded', async () => {
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
        });

        await test.step('step-3: Search by title substring returns results', async () => {
            await studio.searchInput.fill(data.searchTerm);
            await page.keyboard.press('Enter');
            await studio.waitForCardsLoaded();

            const searchResults = studio.renderView.locator('merch-card');
            expect(await searchResults.count()).toBeGreaterThan(0);
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });
    });

    // @studio-fragment-search-empty-query — Empty query returns all fragments
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate empty query returns multiple fragments', async () => {
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
        });
    });
});
