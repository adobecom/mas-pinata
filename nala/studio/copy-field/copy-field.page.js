import { expect } from '@playwright/test';

export default class CopyFieldPage {
    constructor(page) {
        this.page = page;

        this.sideNav = page.locator('mas-side-nav');
        this.copyFieldButton = this.sideNav.locator('mas-side-nav-item[label="Copy Field"]');
        this.copyFieldPopover = page.locator('sp-popover[direction="right"]');
        this.copyFieldMenu = this.copyFieldPopover.locator('sp-menu');
        this.copyFieldMenuItems = this.copyFieldMenu.locator('sp-menu-item:not([disabled])');
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');

        this.previewCard = page.locator('mas-fragment-editor merch-card').first();
        this.previewInlinePrice = this.previewCard.locator('span[is="inline-price"]').first();
    }

    fieldEntry(fieldDisplayName) {
        return this.copyFieldMenu.locator(`sp-menu-item:has(.field-label:text-is("${fieldDisplayName}"))`);
    }

    fieldValueText(fieldDisplayName) {
        return this.fieldEntry(fieldDisplayName).locator('.field-value');
    }

    async openCopyFieldPopover() {
        await this.copyFieldButton.click();
        await expect(this.copyFieldPopover).toBeVisible({ timeout: 10000 });
        await expect(this.copyFieldMenuItems.first()).toBeVisible();
    }

    async getNormalizedPreviewPriceText() {
        const text = await this.previewInlinePrice.innerText();
        return text.replace(/\s+/g, ' ').trim();
    }

    async getNormalizedFieldValueText(fieldDisplayName) {
        const text = await this.fieldValueText(fieldDisplayName).innerText();
        return text.replace(/\s+/g, ' ').trim();
    }
}
