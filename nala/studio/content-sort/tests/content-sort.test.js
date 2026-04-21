import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import ContentSortSpec from '../specs/content-sort.spec.js';
import ContentSortPage from '../content-sort.page.js';

const { features } = ContentSortSpec;

test.describe('M@S Studio Content Sort feature test suite', () => {
    // @studio-content-sort-smoke — sortable Title + new Last Modified column render correctly in the content table
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);
        const contentSort = new ContentSortPage(page);

        await test.step('step-1: Go to MAS Studio content page and switch to table view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
        });

        await test.step('step-2: Fragment Title header is sortable with sort-key="title"', async () => {
            await expect(contentSort.titleHeader).toBeVisible();
            await expect(contentSort.titleHeader).toHaveAttribute('sortable', '');
            await expect(contentSort.titleHeader).toHaveAttribute('sort-key', 'title');
        });

        await test.step('step-3: Last Modified header is sortable with sort-key="modified"', async () => {
            await expect(contentSort.lastModifiedByHeader).toBeVisible();
            await expect(contentSort.lastModifiedHeader).toBeVisible();
            await expect(contentSort.priceHeader).toBeVisible();
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sortable', '');
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sort-key', 'modified');
        });

        await test.step('step-4: Last Modified header sits between Last Modified By and Price in column order', async () => {
            const classes = await contentSort.allHeaderCells.evaluateAll((nodes) =>
                nodes.map((n) => n.className.trim().split(/\s+/).filter(Boolean)[0] || ''),
            );
            const lmByIdx = classes.indexOf('last-modified-by');
            const lmIdx = classes.indexOf('last-modified');
            const priceIdx = classes.indexOf('price');
            expect(lmByIdx).toBeGreaterThan(-1);
            expect(lmIdx).toBeGreaterThan(-1);
            expect(priceIdx).toBeGreaterThan(-1);
            expect(lmIdx).toBe(lmByIdx + 1);
            expect(priceIdx).toBe(lmIdx + 1);
        });

        await test.step('step-5: Default sort indicator points to Last Modified desc; inactive Title shows default asc', async () => {
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sort-direction', 'desc');
            await expect(contentSort.titleHeader).toHaveAttribute('sort-direction', 'asc');
        });

        await test.step('step-6: Non-sortable headers do not carry the sortable attribute', async () => {
            await expect(contentSort.nameHeader).not.toHaveAttribute('sortable', '');
            await expect(contentSort.offerIdHeader).not.toHaveAttribute('sortable', '');
            await expect(contentSort.offerTypeHeader).not.toHaveAttribute('sortable', '');
            await expect(contentSort.lastModifiedByHeader).not.toHaveAttribute('sortable', '');
            await expect(contentSort.priceHeader).not.toHaveAttribute('sortable', '');
            await expect(contentSort.statusHeader).not.toHaveAttribute('sortable', '');
        });

        await test.step('step-7: Row renders the Last Modified cell with a formatted date or an em-dash fallback', async () => {
            await expect(contentSort.firstRow).toBeVisible({ timeout: 30000 });
            const cell = contentSort.lastModifiedCell(contentSort.firstRow);
            await expect(cell).toBeVisible();
            const text = ((await cell.textContent()) || '').trim();
            expect(text).toBeTruthy();
            const isFormattedDate = contentSort.formattedDateRegex.test(text);
            const isEmpty = text === contentSort.emptyDateDash;
            expect(isFormattedDate || isEmpty).toBe(true);
        });
    });

    // @studio-content-sort-title-toggle — Clicking Fragment Title toggles the sort-direction indicator
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);
        const contentSort = new ContentSortPage(page);

        await test.step('step-1: Go to MAS Studio content page in table view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
        });

        await test.step('step-2: Initial Title direction is the inactive default (asc)', async () => {
            await expect(contentSort.titleHeader).toHaveAttribute('sort-direction', 'asc');
        });

        await test.step('step-3: First click on Fragment Title flips the indicator (asc → desc) and activates Title sorting', async () => {
            await contentSort.titleHeader.click();
            await page.waitForTimeout(2000);
            await expect(contentSort.titleHeader).toHaveAttribute('sort-direction', 'desc');
        });

        await test.step('step-4: Second click on Fragment Title toggles back to asc (A→Z)', async () => {
            await contentSort.titleHeader.click();
            await page.waitForTimeout(2000);
            await expect(contentSort.titleHeader).toHaveAttribute('sort-direction', 'asc');
        });
    });

    // @studio-content-sort-modified-toggle — Clicking Last Modified toggles desc/asc
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        const contentSort = new ContentSortPage(page);

        await test.step('step-1: Go to MAS Studio content page in table view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
        });

        await test.step('step-2: Default Last Modified sort-direction is desc (newest first)', async () => {
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sort-direction', 'desc');
        });

        await test.step('step-3: First click on Last Modified flips the indicator (desc → asc, oldest first)', async () => {
            await contentSort.lastModifiedHeader.click();
            await page.waitForTimeout(2000);
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sort-direction', 'asc');
        });

        await test.step('step-4: Second click on Last Modified toggles back to desc (newest first)', async () => {
            await contentSort.lastModifiedHeader.click();
            await page.waitForTimeout(2000);
            await expect(contentSort.lastModifiedHeader).toHaveAttribute('sort-direction', 'desc');
        });

        await test.step('step-5: After returning to Last Modified default, inactive Title falls back to its asc default indicator', async () => {
            await expect(contentSort.titleHeader).toHaveAttribute('sort-direction', 'asc');
        });
    });
});
