import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import QuantityMinimumSpec from '../specs/quantity_minimum.spec.js';

const { features } = QuantityMinimumSpec;

test.describe('M@S Studio Quantity Minimum Validation test suite', () => {
    // @studio-fragment-editor-quantity-minimum-validation - Validate inline warning when minimum > start quantity
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Ensure quantity selector is enabled', async () => {
            await expect(await editor.quantitySelectorCheckbox).toBeVisible();
            const checked = await editor.quantitySelectorCheckbox.isChecked();
            if (!checked) {
                await editor.quantitySelectorCheckbox.click();
            }
            await expect(await editor.quantitySelectorMinimum).toBeVisible();
            await expect(await editor.quantitySelectorStart).toBeVisible();
        });

        await test.step('step-3: No warning is shown on initial load', async () => {
            await expect(await editor.quantitySelectorMinimumWarning).not.toBeVisible();
            await expect(await editor.quantitySelectorStartWarning).not.toBeVisible();
        });

        await test.step('step-4: Enter conflicting values (Minimum > Start) and blur Minimum', async () => {
            await editor.quantitySelectorStart.fill(data.conflictingStart);
            await editor.quantitySelectorMinimum.fill(data.conflictingMinimum);
            await editor.quantitySelectorMinimum.blur();
        });

        await test.step('step-5: Inline warning is visible under Minimum, not Start', async () => {
            await expect(await editor.quantitySelectorMinimumWarning).toBeVisible();
            await expect(await editor.quantitySelectorStartWarning).not.toBeVisible();
        });

        await test.step('step-6: Save button remains enabled (warning is non-blocking)', async () => {
            await expect(await studio.saveCardButton).toBeEnabled();
        });

        await test.step('step-7: Correct Minimum to satisfy rule and warning clears', async () => {
            await editor.quantitySelectorMinimum.fill(data.correctedMinimum);
            await editor.quantitySelectorMinimum.blur();
            await expect(await editor.quantitySelectorMinimumWarning).not.toBeVisible();
            await expect(await editor.quantitySelectorStartWarning).not.toBeVisible();
        });

        await test.step('step-8: Re-enter conflict and clear Start to dismiss warning', async () => {
            await editor.quantitySelectorMinimum.fill(data.conflictingMinimum);
            await editor.quantitySelectorMinimum.blur();
            await expect(await editor.quantitySelectorMinimumWarning).toBeVisible();

            await editor.quantitySelectorStart.fill('');
            await expect(await editor.quantitySelectorMinimumWarning).not.toBeVisible();
            await expect(await editor.quantitySelectorStartWarning).not.toBeVisible();
        });
    });
});
