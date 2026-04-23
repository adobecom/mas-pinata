import {
    test,
    expect,
    studio,
    editor,
    fries,
    setClonedCardID,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import COMFriesIncludedIconsSpec from '../specs/fries_included_icons.spec.js';

const { features } = COMFriesIncludedIconsSpec;

test.describe('M@S Studio Commerce Fries included icons test suite', () => {
    // @studio-fries-included-icons-save - Validate included products icon picker renders a horizontal row on Fries card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Verify Included products section is visible', async () => {
            const includedIconsGroup = page.locator('#includedIcons');
            await includedIconsGroup.scrollIntoViewIfNeeded();
            await expect(includedIconsGroup).toBeVisible();
            await expect(includedIconsGroup.locator('.section-title')).toHaveText('Included products');
        });

        await test.step('step-4: Add two product icons via the picker', async () => {
            const includedIconsGroup = page.locator('#includedIcons');
            const addButton = includedIconsGroup.getByRole('button', { name: 'Add product icon' });

            for (let i = 0; i < data.expectedIconCount; i += 1) {
                await addButton.click();
                const pickerField = includedIconsGroup.locator('mas-icon-picker-field').nth(i);
                await pickerField.scrollIntoViewIfNeeded();
                await pickerField.click();
                const firstOption = page.locator('mas-icon-picker-field-panel [role="listitem"], sp-menu-item').first();
                await expect(firstOption).toBeVisible();
                await firstOption.click();
                await expect(firstOption).toBeHidden();
                await expect(pickerField.locator('img, svg').first()).toBeVisible();
            }
        });

        await test.step('step-5: Save card with included icons', async () => {
            await studio.saveCard();
        });

        await test.step('step-6: Validate icons render as horizontal row on Fries card', async () => {
            await expect(clonedCard.locator(fries.includedIcon)).toHaveCount(data.expectedIconCount);
            const row = clonedCard.locator(fries.includedIconsRow).first();
            await expect(row).toBeVisible();
        });
    });
});
