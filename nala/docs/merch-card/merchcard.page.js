export default class MasMerchCard {
    constructor(page) {
        this.page = page;
    }

    getStaticCard() {
        return this.page.locator('merch-card#static');
    }

    getBadge(card) {
        return card.locator('div[class$="-badge"]').first();
    }

    getHeading(card) {
        return card.locator('h4[slot="heading-xs"]').first();
    }

    getBody(card) {
        return card.locator('div[slot="body-xs"]').first();
    }
}
