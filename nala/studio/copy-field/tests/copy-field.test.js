import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import CopyFieldPage from '../copy-field.page.js';
import CopyFieldSpec from '../specs/copy-field.spec.js';

const { features } = CopyFieldSpec;

test.describe('M@S Studio Side-Nav Copy Field test suite', () => {
    // @studio-copy-field-prices-match-preview — Copy Field's Prices preview value mirrors the rendered card price text (en_US default locale, no tax label)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const copyField = new CopyFieldPage(page);

        await test.step('step-1: Go to MAS Studio fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for editor and rendered preview price', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(copyField.previewInlinePrice).toBeVisible({ timeout: 15000 });
            await expect(copyField.previewInlinePrice).not.toBeEmpty({ timeout: 15000 });
        });

        await test.step('step-3: Open Copy Field popover', async () => {
            await copyField.openCopyFieldPopover();
            await expect(copyField.fieldEntry(data.fieldDisplayName)).toBeVisible();
        });

        await test.step('step-4: Verify Prices preview value matches rendered card text and omits tax label', async () => {
            const previewText = await copyField.getNormalizedPreviewPriceText();
            expect(previewText).not.toMatch(data.taxLabelPattern);
            const fieldValueText = await copyField.getNormalizedFieldValueText(data.fieldDisplayName);
            expect(fieldValueText).toContain(previewText);
            expect(fieldValueText).not.toMatch(data.taxLabelPattern);
        });

        await test.step('step-5: Click the Prices field entry and verify positive copy toast', async () => {
            await copyField.fieldEntry(data.fieldDisplayName).click();
            await expect(copyField.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(copyField.toastPositive).toContainText(/Copied .* field link/);
        });
    });

    // @studio-copy-field-prices-match-preview-vat-locale — VAT locale (fr_FR): Copy Field's Prices value mirrors rendered preview, including any auto-resolved tax label
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const copyField = new CopyFieldPage(page);

        await test.step('step-1: Go to MAS Studio fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for editor to render', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Switch locale to FR', async () => {
            await expect(studio.localePicker).toBeVisible();
            await studio.selectLocale(data.localePicker);
            await expect(studio.localePicker).toHaveAttribute('value', data.locale);
        });

        await test.step('step-4: Wait for preview price to render in selected locale', async () => {
            await expect(copyField.previewInlinePrice).toBeVisible({ timeout: 15000 });
            await expect(copyField.previewInlinePrice).not.toBeEmpty({ timeout: 15000 });
        });

        await test.step('step-5: Open Copy Field popover', async () => {
            await copyField.openCopyFieldPopover();
            await expect(copyField.fieldEntry(data.fieldDisplayName)).toBeVisible();
        });

        await test.step('step-6: Verify Prices preview value matches rendered card text including any tax label', async () => {
            const previewText = await copyField.getNormalizedPreviewPriceText();
            const fieldValueText = await copyField.getNormalizedFieldValueText(data.fieldDisplayName);
            // Core fix: Copy Field always uses the rendered preview text, so whatever
            // the card shows (with or without tax label) must appear in the copied field.
            expect(fieldValueText).toContain(previewText);
            // If the card preview includes the locale-resolved tax label, the copied field must include it too.
            if (data.taxLabelPattern.test(previewText)) {
                expect(fieldValueText).toMatch(data.taxLabelPattern);
            }
        });
    });
});
