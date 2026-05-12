import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SearchCardTitleSpec from '../specs/search-card-title.spec.js';

const { features } = SearchCardTitleSpec;

test.describe('M@S Studio Search Card Title test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.searchTitle}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio with title search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card is returned when searching by full title', async () => {
            await studio.waitForCardsLoaded();
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-3: Validate no duplicate results for the matched card', async () => {
            const cards = studio.renderView.locator(`merch-card:has(aem-fragment[fragment="${data.cardid}"])`);
            await expect(cards).toHaveCount(1);
        });
    });

    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.searchTitle}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio with partial title search query', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate partial title search returns the card', async () => {
            await studio.waitForCardsLoaded();
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });
    });
});
