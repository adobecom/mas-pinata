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
});
