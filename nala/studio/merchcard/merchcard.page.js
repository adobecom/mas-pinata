export default class MerchcardPage {
    constructor(page) {
        this.page = page;

        this.card = page.locator('merch-card');
        this.cardBadge = page.locator('merch-card div[id="badge"]');
        this.slottedBadge = page.locator('merch-card merch-badge, merch-card [slot="badge"]');
        this.cardTitleXs = page.locator('merch-card [slot="heading-xs"]');
        this.cardTitleM = page.locator('merch-card [slot="heading-m"]');

        this.cssProp = {
            badgeHeightFallback: '32px',
            spacingXsFallback: '16px',
        };
    }

    getCardById(id) {
        return this.page.locator('merch-card').filter({ has: this.page.locator(`aem-fragment[fragment="${id}"]`) });
    }

    async getCssVariable(cardLocator, name) {
        return cardLocator.evaluate((el, varName) => el.style.getPropertyValue(varName).trim(), name);
    }

    async getBadgeRenderedHeight(cardLocator) {
        return cardLocator.evaluate((el) => {
            const badgeEl = el.shadowRoot?.getElementById('badge') || el.querySelector('merch-badge, [slot="badge"]');
            if (!badgeEl) return 0;
            return Math.ceil(badgeEl.getBoundingClientRect().height);
        });
    }

    async getTitlePaddingBlockStart(cardLocator, slotName) {
        return cardLocator.evaluate((el, slot) => {
            const titleEl = el.querySelector(`[slot="${slot}"]`);
            if (!titleEl) return null;
            return window.getComputedStyle(titleEl).paddingBlockStart;
        }, slotName);
    }

    async removeBadgeAttribute(cardLocator) {
        await cardLocator.evaluate((el) => el.removeAttribute('badge-text'));
    }
}
