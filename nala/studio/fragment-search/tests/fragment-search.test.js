import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import FragmentSearchSpec from '../specs/fragment-search.spec.js';

const { features } = FragmentSearchSpec;

test.describe('M@S Studio Fragment Search by Title test suite', () => {
    // @studio-fragment-search-title-smoke — Search by query returns matching fragments (fullText + title filter)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to Studio content page with search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search results contain the matching fragment', async () => {
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            await expect(cards.first()).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Validate search input reflects the query', async () => {
            await expect(studio.searchInput).toBeVisible();
            await expect(studio.searchInput).toHaveValue(data.cardid);
        });
    });

    // @studio-fragment-search-title-empty-query — Empty query returns all fragments (no title filter applied)
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to Studio content page without search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate multiple cards are shown (no filter applied)', async () => {
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
        });

        await test.step('step-3: Validate search field is empty and available', async () => {
            await expect(studio.searchInput).toBeVisible();
            await expect(studio.searchIcon).toBeVisible();
        });

        await test.step('step-4: Type a query and verify results are filtered', async () => {
            await studio.searchInput.fill('48a759ce-3c9a-4158-9bc3-b21ffa07e8e4');
            await page.keyboard.press('Enter');
            await studio.waitForCardsLoaded();
            const filteredCards = studio.renderView.locator('merch-card');
            await expect(filteredCards).toHaveCount(1);
        });
    });
});
