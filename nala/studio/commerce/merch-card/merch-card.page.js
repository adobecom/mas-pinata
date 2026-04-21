export default class MerchCardPage {
    constructor(page) {
        this.page = page;

        // Core card locators
        this.card = page.locator('merch-card');
        this.cardBody = page.locator('merch-card').locator('.body').first();
        this.cardTopSection = page.locator('merch-card').locator('.top-section').first();

        // Badge locators — both paths covered (slotted merch-badge + legacy div)
        this.slottedBadge = page.locator('merch-card [slot="badge"]');
        this.legacyBadge = page.locator('merch-card div[class$="-badge"]');

        // Heading locators commonly used across variants
        this.headingXs = page.locator('merch-card h3[slot="heading-xs"]');
        this.headingM = page.locator('merch-card h3[slot="heading-m"]');

        // Expected CSS for the legacy badge div after the fix
        this.cssProp = {
            legacyBadge: {
                position: 'absolute',
                'max-width': '180px',
                'white-space': 'normal',
                'text-align': 'center',
            },
        };

        // CSS custom property name that the ResizeObserver writes to the host
        this.badgeHeightVar = '--consonant-merch-card-badge-height';
    }

    async getBadgeHeightVar(cardLocator) {
        return cardLocator.evaluate((el, name) => el.style.getPropertyValue(name).trim(), this.badgeHeightVar);
    }

    async getBodyPaddingBlockStart(cardLocator) {
        return cardLocator
            .locator('.body')
            .first()
            .evaluate((el) => getComputedStyle(el).paddingBlockStart);
    }
}
