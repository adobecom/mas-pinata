export default class MasLingo {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    getCardTitle(id) {
        const card = this.getCard(id);
        return card.locator('h3[slot="heading-xs"]');
    }

    getCardDescription(id) {
        const card = this.getCard(id);
        return card.locator('div[slot="body-xs"]');
    }

    getCardPrice(id) {
        const card = this.getCard(id);
        return card.locator('p[slot="heading-m"]');
    }

    getCardCTA(id) {
        const card = this.getCard(id);
        return card.locator('div[slot="footer"] > a[is="checkout-link"]');
    }

    getCardIcon(id) {
        const card = this.getCard(id);
        return card.locator('merch-icon');
    }

    getCardBadge(id) {
        const card = this.getCard(id);
        return card.locator('merch-badge');
    }
}
