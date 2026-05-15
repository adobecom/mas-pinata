import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import FragmentSearchSpec from '../specs/fragment-search.spec.js';

const { features } = FragmentSearchSpec;

test.describe('M@S Studio Fragment Search Title test suite', () => {
    // @studio-fragment-search-title-match - Typing a title substring (3+ chars) returns fragments matching jcr:title
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${encodeURIComponent(data.query)}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio search page with title query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search results contain title-matched fragment', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });
    });

    // @studio-fragment-search-short-query-no-title - Queries shorter than 3 chars bypass title search
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.query}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio search page with short query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search completes without error', async () => {
            await expect(studio.renderView).toBeVisible();
        });
    });

    // @studio-fragment-search-dedup - Results are deduplicated when fragment matches both fullText and title
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${encodeURIComponent(data.query)}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio search page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate no duplicate cards in results', async () => {
            await studio.waitForCardsLoaded();
            const cardElements = studio.renderView.locator(`merch-card:has(aem-fragment[fragment="${data.cardid}"])`);
            await expect(cardElements).toHaveCount(1);
        });
    });
});
