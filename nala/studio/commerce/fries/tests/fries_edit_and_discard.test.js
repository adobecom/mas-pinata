import { test, expect, studio, editor, fries, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesSpec from '../specs/fries_edit_and_discard.spec.js';

const { features } = COMFriesSpec;

/*
 * Fries is the intentional Nala canary for the gradient-border feature class
 * covering Fries, Special Offers, Mini Compare Chart (desktop + MWEB), and Catalog.
 * All five variants share the same editor wiring (#updateAvailableColors /
 * #renderColorPicker in studio/src/editors/merch-card-editor.js) and the same
 * runtime logic (processBorderColor in web-components/src/hydrate.js plus the
 * var(--gradient-*) tokens in web-components/src/global.css.js), so a regression
 * in the shared path surfaces on the Fries fragment first.
 * Original feature plan: .pinata/specs/issue-260-pnt-caede5f4-sdlc_planner-gradient-border-color-options.md
 * Any divergence from the shared wiring (e.g. a variant-specific CSS rule
 * overriding --consonant-merch-card-border-color) must add its own Nala test
 * next to that variant's page object.
 */
test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-edit-discard-trial-badge - Validate edit trial badge for fries card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Remove badge field', async () => {
            await expect(await editor.trialBadge).toBeVisible();
            await expect(await editor.trialBadge).toHaveText(data.trialBadge.original);
            await editor.trialBadge.click();
            await page.waitForTimeout(500);
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(1000);
            await expect(await editor.trialBadge).toHaveText('');
        });

        await test.step('step-3: Validate badge field is removed', async () => {
            await expect(await editor.trialBadge).toHaveText('');
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).not.toBeVisible();
        });

        await test.step('step-4: Enter new value in the badge field', async () => {
            await editor.trialBadge.fill(data.trialBadge.updated);
        });

        await test.step('step-5: Validate badge field updated', async () => {
            await expect(await editor.trialBadge).toHaveText(data.trialBadge.updated);
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).toHaveText(data.trialBadge.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).toHaveText(data.trialBadge.original);
        });
    });

    // @studio-fries-edit-discard-trial-badge-color - Validate edit trial badge color for fries card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const friesCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Edit badge color field', async () => {
            await expect(await editor.trialBadgeColor).toBeVisible();
            await expect(await editor.trialBadgeColor).toContainText(data.color.original);
            await editor.trialBadgeColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeColor.click();
            await expect(await editor.trialBadgeColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate badge color field updated', async () => {
            await expect(await editor.trialBadgeColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    color: data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify badge color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    color: data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-fries-edit-discard-trial-badge-border-color - Validate edit trial badge border color for fries card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const friesCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Edit badge border color field', async () => {
            await expect(await editor.trialBadgeBorderColor).toBeVisible();
            await expect(await editor.trialBadgeBorderColor).toContainText(data.color.original);
            await editor.trialBadgeBorderColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeBorderColor.click();
            await expect(await editor.trialBadgeBorderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate badge border color field updated', async () => {
            await expect(await editor.trialBadgeBorderColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    'border-color': data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify badge border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    'border-color': data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-fries-edit-discard-gradient-border - Validate gradient border color options for fries card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const friesCard = await studio.getCard(data.cardid);
        const originalBorderColor = await friesCard.getAttribute('border-color');
        const originalGradientBorder = await friesCard.getAttribute('gradient-border');

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await friesCard).toBeVisible();
            await expect(await friesCard).toHaveAttribute('variant', 'fries');
        });

        await test.step('step-2: Select Gradient Purple Blue border color', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.waitForSelector(`sp-menu-item[value="${data.purpleBlue.value}"]`, { state: 'visible' });
            await page.locator(`sp-menu-item[value="${data.purpleBlue.value}"]`).first().click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate Gradient Purple Blue applied to card', async () => {
            await expect(await editor.borderColor).toContainText(data.purpleBlue.label);
            await expect(friesCard).toHaveAttribute('border-color', data.purpleBlue.value);
            await expect(friesCard).toHaveAttribute('gradient-border', 'true');
            const purpleBlueBg = await friesCard.evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(purpleBlueBg).toContain('linear-gradient');
            for (const stop of data.purpleBlue.cssStops) {
                expect(purpleBlueBg).toContain(stop);
            }
        });

        await test.step('step-4: Switch to Gradient Firefly Spectrum border color', async () => {
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.waitForSelector(`sp-menu-item[value="${data.fireflySpectrum.value}"]`, { state: 'visible' });
            await page.locator(`sp-menu-item[value="${data.fireflySpectrum.value}"]`).first().click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Validate Gradient Firefly Spectrum applied to card', async () => {
            await expect(await editor.borderColor).toContainText(data.fireflySpectrum.label);
            await expect(friesCard).toHaveAttribute('border-color', data.fireflySpectrum.value);
            await expect(friesCard).toHaveAttribute('gradient-border', 'true');
            const fireflyBg = await friesCard.evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(fireflyBg).toContain('linear-gradient');
            for (const stop of data.fireflySpectrum.cssStops) {
                expect(fireflyBg).toContain(stop);
            }
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify border color reverted', async () => {
            if (originalBorderColor === null) {
                await expect(friesCard).not.toHaveAttribute('border-color', data.purpleBlue.value);
                await expect(friesCard).not.toHaveAttribute('border-color', data.fireflySpectrum.value);
            } else {
                await expect(friesCard).toHaveAttribute('border-color', originalBorderColor);
            }
            if (originalGradientBorder === null) {
                await expect(friesCard).not.toHaveAttribute('gradient-border', 'true');
            } else {
                await expect(friesCard).toHaveAttribute('gradient-border', originalGradientBorder);
            }
        });
    });
});
