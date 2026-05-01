import { test, expect, importVariations, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import ImportVariationsSpec from '../specs/import-variations.spec.js';

const { features } = ImportVariationsSpec;

test.describe('M@S Studio Import Variations Test Suite', () => {
    // Test 0: @studio-import-variations-page-load — page renders heading, description, and base picker
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate page root and heading are visible', async () => {
            await importVariations.waitForPage();
            await expect(importVariations.importPage).toBeVisible();
            await expect(importVariations.pageHeading).toBeVisible();
            await expect(importVariations.pageHeading).toHaveText('Import Variations');
            await expect(importVariations.pageDescription).toBeVisible();
        });

        await test.step('step-3: Validate Step 1 (pick base) renders by default', async () => {
            await expect(importVariations.stepOneHeading).toBeVisible();
            await expect(importVariations.stepOneHeading).toContainText('Step 1');
            await importVariations.waitForBasePicker();
            await expect(importVariations.basePicker).toBeVisible();
            await expect(importVariations.basePickerSearch).toBeVisible();
        });
    });

    // Test 1: @studio-import-variations-side-nav-entry — page reachable from side nav as a top-level entry
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Studio welcome page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate Import Variations side nav item is visible', async () => {
            await expect(importVariations.sideNavItem).toBeVisible();
            await expect(importVariations.sideNavItem).toHaveAttribute('label', 'Import Variations');
        });

        await test.step('step-3: Click side nav item and confirm Import Variations page loads', async () => {
            await importVariations.sideNavItem.click();
            await importVariations.waitForPage();
            await expect(importVariations.pageHeading).toBeVisible();
            await expect(importVariations.stepOneHeading).toContainText('Step 1');
        });
    });

    // Test 2: @studio-import-variations-base-picker — search-driven picker is rendered with a search input
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate base picker exposes the search input', async () => {
            await importVariations.waitForBasePicker();
            await expect(importVariations.basePickerSearch).toBeVisible();
            await expect(importVariations.basePickerSearch).toHaveAttribute('placeholder', /merch cards/i);
        });

        await test.step('step-3: No results list is shown before any query', async () => {
            await expect(importVariations.basePickerResults).toBeHidden();
        });
    });

    // Test 3: @studio-import-variations-paste-preview — paste flow lands on preview with rows
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await importVariations.waitForPage();
        });

        await test.step('step-2: Stub a base fragment and advance to upload step', async () => {
            await page.evaluate(() => {
                const el = document.querySelector('mas-import-variations');
                el.baseFragment = { id: 'stub', title: 'Stub Base', name: 'stub', path: '/stub', fields: [] };
                el.existingOsiSet = new Set();
                el.existingPromoSet = new Set();
                el.step = 'upload';
            });
            await expect(importVariations.stepTwoHeading).toBeVisible();
        });

        await test.step('step-3: Type pasted rows and click Parse pasted data', async () => {
            const pasted = 'Countries\tPrice Point\tRegional Price Offer ID\nFR\tcommercial\tabc123\nDE\tcommercial\tdef456';
            await page.evaluate((value) => {
                const el = document.querySelector('mas-import-variations');
                el.pasteValue = value;
            }, pasted);
            await importVariations.parsePastedButton.click();
        });

        await test.step('step-4: Preview step shows two rows', async () => {
            await expect(importVariations.stepThreeHeading).toBeVisible();
            await expect(importVariations.previewTable).toBeVisible();
            await expect(importVariations.previewRows).toHaveCount(2);
            await expect(importVariations.importButton).toBeEnabled();
        });
    });

    // Test 4: @studio-import-variations-format-error-banner — format error renders banner + download template
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await importVariations.waitForPage();
        });

        await test.step('step-2: Force a format error on the preview step', async () => {
            await page.evaluate(() => {
                const el = document.querySelector('mas-import-variations');
                el.baseFragment = { id: 'stub', title: 'Stub Base', name: 'stub', path: '/stub', fields: [] };
                el.applyParsed({
                    regionalRows: [],
                    introRows: [],
                    formatError: 'No matching tabs found. The workbook must contain "Regional Pricing" and/or "Intro Pricing".',
                });
            });
        });

        await test.step('step-3: Format error banner with Download template button is visible', async () => {
            await expect(importVariations.stepThreeHeading).toBeVisible();
            await expect(importVariations.formatErrorBanner).toBeVisible();
            await expect(importVariations.formatErrorBanner).toContainText('No matching tabs found');
            await expect(importVariations.formatErrorDownloadButton).toBeVisible();
        });
    });

    // Test 5: @studio-import-variations-import-button-disabled — Import button disabled when no rows are valid
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await importVariations.waitForPage();
        });

        await test.step('step-2: Land on preview with only invalid rows', async () => {
            await page.evaluate(() => {
                const el = document.querySelector('mas-import-variations');
                el.baseFragment = { id: 'stub', title: 'Stub Base', name: 'stub', path: '/stub', fields: [] };
                el.applyParsed({
                    regionalRows: [{ Countries: 'FR', 'Price Point': '', 'Regional Price Offer ID': '' }],
                    introRows: [],
                    formatError: null,
                });
            });
        });

        await test.step('step-3: Preview shows invalid row and Import button is disabled', async () => {
            await expect(importVariations.stepThreeHeading).toBeVisible();
            await expect(importVariations.previewRows).toHaveCount(1);
            await expect(importVariations.invalidRows).toHaveCount(1);
            await expect(importVariations.importButton).toBeDisabled();
        });
    });

    // Test 6: @studio-import-variations-summary-sections — summary renders Created/Skipped/Failed sections with counts
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Import Variations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await importVariations.waitForPage();
        });

        await test.step('step-2: Force the summary step with sample result', async () => {
            await page.evaluate(() => {
                const el = document.querySelector('mas-import-variations');
                el.baseFragment = { id: 'stub', title: 'Stub Base', name: 'stub', path: '/stub', fields: [] };
                el.result = {
                    created: [{ id: 'c1', path: '/p/c1' }, { id: 'c2', path: '/p/c2' }],
                    skipped: [{ identifier: 'abc123', reason: 'already exists' }],
                    failed: [{ identifier: 'def456', error: 'create failed' }],
                };
                el.step = 'summary';
            });
        });

        await test.step('step-3: Summary heading and three sections render with correct items', async () => {
            await expect(importVariations.summaryHeading).toBeVisible();
            await expect(importVariations.summaryCreatedSection).toBeVisible();
            await expect(importVariations.summarySkippedSection).toBeVisible();
            await expect(importVariations.summaryFailedSection).toBeVisible();
            await expect(importVariations.summaryCreatedItems).toHaveCount(2);
            await expect(importVariations.summarySkippedItems).toHaveCount(1);
            await expect(importVariations.summaryFailedItems).toHaveCount(1);
            await expect(importVariations.doneButton).toBeVisible();
        });
    });
});
