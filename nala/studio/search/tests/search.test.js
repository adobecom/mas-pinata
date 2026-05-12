import { test, expect, studio, webUtil, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SearchSpec from '../specs/search.spec.js';

const { features } = SearchSpec;

test.describe('M@S Studio Search feature test suite', () => {
    // @studio-search-card-title — Single-word search matches card via client-side field filtering
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.searchTerm}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio with search query in URL', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search returns cards matching the term', async () => {
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(0);
        });

        await test.step('step-3: Validate expected card is in results', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });
    });

    // @studio-search-partial-match — Partial text matches via client-side filtering
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.searchTerm}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio with partial search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate partial match returns expected card', async () => {
            await studio.waitForCardsLoaded();
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });
    });

    // @studio-search-translation-card-title — Translation section search matches content fields
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio translations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Search for card by term in translation section', async () => {
            const searchInput = page.locator('mas-search-and-filters sp-search input');
            await expect(searchInput).toBeVisible({ timeout: 15000 });
            await searchInput.fill(data.searchTerm);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate search results include matching rows', async () => {
            const tableRows = page.locator('mas-translation sp-table sp-table-row');
            expect(await tableRows.count()).toBeGreaterThan(0);
        });
    });
});
