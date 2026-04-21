import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SortSpec from '../specs/sort.spec.js';
import SortPage from '../sort.page.js';

const { features } = SortSpec;

test.describe('M@S Studio Content Sort feature test suite', () => {
    // @studio-sort-title-toggle — Fragment Title header toggles sort-direction between asc and desc
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);
        const sortPage = new SortPage(page);

        await test.step('step-1: Go to Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for table to render', async () => {
            await expect(sortPage.table).toBeVisible();
            await expect(sortPage.titleHeader).toBeVisible();
        });

        await test.step('step-3: Fragment Title header is sortable', async () => {
            await expect(sortPage.titleHeader).toHaveAttribute('sortable', '');
        });

        await test.step('step-4: First click sets sort-direction to asc', async () => {
            await sortPage.titleHeader.click();
            await expect(sortPage.titleHeader).toHaveAttribute('sort-direction', 'asc');
        });

        await test.step('step-5: Second click toggles sort-direction to desc', async () => {
            await sortPage.titleHeader.click();
            await expect(sortPage.titleHeader).toHaveAttribute('sort-direction', 'desc');
        });
    });

    // @studio-sort-last-modified-toggle — Last Modified header toggles sort-direction
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);
        const sortPage = new SortPage(page);

        await test.step('step-1: Go to Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Last Modified header is present and sortable', async () => {
            await expect(sortPage.lastModifiedHeader).toBeVisible();
            await expect(sortPage.lastModifiedHeader).toHaveAttribute('sortable', '');
        });

        await test.step('step-3: Clicking Last Modified toggles the sort-direction attribute', async () => {
            await sortPage.lastModifiedHeader.click();
            const firstDirection = await sortPage.lastModifiedHeader.getAttribute('sort-direction');
            expect(['asc', 'desc']).toContain(firstDirection);

            await sortPage.lastModifiedHeader.click();
            const secondDirection = await sortPage.lastModifiedHeader.getAttribute('sort-direction');
            expect(['asc', 'desc']).toContain(secondDirection);
            expect(secondDirection).not.toBe(firstDirection);
        });
    });

    // @studio-sort-last-modified-column-visible — New Last Modified column renders in header and rows
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        const sortPage = new SortPage(page);

        await test.step('step-1: Go to Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Table renders and exposes the last-modified column', async () => {
            await expect(sortPage.table).toBeVisible();
            await expect(sortPage.lastModifiedHeader).toBeVisible();
            await expect(sortPage.lastModifiedHeader).toContainText('Last Modified');
        });

        await test.step('step-3: Last Modified column sits between offer-type and last-modified-by', async () => {
            const classes = await sortPage.headerClassesInOrder();
            const offerTypeIndex = classes.findIndex((c) => c.split(/\s+/).includes('offer-type'));
            const lastModifiedIndex = classes.findIndex((c) => c.split(/\s+/).includes('last-modified'));
            const lastModifiedByIndex = classes.findIndex((c) => c.split(/\s+/).includes('last-modified-by'));
            expect(offerTypeIndex).toBeGreaterThanOrEqual(0);
            expect(lastModifiedIndex).toBeGreaterThan(offerTypeIndex);
            expect(lastModifiedByIndex).toBeGreaterThan(lastModifiedIndex);
        });

        await test.step('step-4: At least one row exposes a last-modified cell', async () => {
            await sortPage.tableRows.first().waitFor({ state: 'visible', timeout: 15000 });
            await expect(sortPage.lastModifiedCells.first()).toBeVisible();
        });
    });

    // @studio-sort-not-persisted-in-hash — Sort state is not surfaced into window.location.hash
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);
        const sortPage = new SortPage(page);

        await test.step('step-1: Go to Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Studio shell is loaded', async () => {
            await expect(studio.topnav).toBeVisible();
            await expect(sortPage.titleHeader).toBeVisible();
        });

        await test.step('step-3: Clicking a sortable header does not write sortBy into the hash', async () => {
            await sortPage.titleHeader.click();
            await expect(sortPage.titleHeader).toHaveAttribute('sort-direction', /asc|desc/);
            const hash = await page.evaluate(() => window.location.hash);
            expect(hash).not.toContain('sortBy');
            expect(hash).not.toContain('sortDirection');
        });
    });
});
