import { test, expect, studio, search, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SearchSpec from '../specs/search.spec.js';

const { features } = SearchSpec;

test.describe('M@S Studio Fragment Search test suite', () => {
    // @studio-search-substring - Mid-word substring of a fragment title returns the fragment
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.searchInput).toBeVisible();
            await studio.waitForCardsLoaded(2);
        });

        await test.step('step-2: Search a mid-word substring of the fragment title', async () => {
            await search.search(data.query);
            await search.waitForCardsLoaded();
        });

        await test.step('step-3: Validate the matching fragment is returned', async () => {
            await expect(await search.cardByFragmentId(data.cardid)).toBeVisible();
        });
    });

    // @studio-search-case-insensitive - Substring matching is case-insensitive
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.searchInput).toBeVisible();
            await studio.waitForCardsLoaded(2);
        });

        await test.step('step-2: Search the substring in a different case', async () => {
            await search.search(data.query);
            await search.waitForCardsLoaded();
        });

        await test.step('step-3: Validate the matching fragment is still returned', async () => {
            await expect(await search.cardByFragmentId(data.cardid)).toBeVisible();
        });
    });

    // @studio-search-min-length - 1-2 char queries do not trigger substring matching (3-char guard)
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.searchInput).toBeVisible();
            await studio.waitForCardsLoaded(2);
        });

        await test.step('step-2: Search a 2-char mid-word substring (below the 3-char guard)', async () => {
            await search.search(data.shortQuery);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-3: Validate the substring-only fragment is NOT surfaced by a short query', async () => {
            await expect(await search.cardByFragmentId(data.cardid)).toHaveCount(0);
        });
    });
});
