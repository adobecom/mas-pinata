export default class MasPro {
    constructor(page) {
        this.page = page;
        // Light theme values from web-components/src/variants/pro.css.js
        this.cssProp = {
            card: {
                'background-color': 'rgb(248, 248, 248)',
                'border-radius': '16px',
            },
            topCard: {
                'background-color': 'rgb(255, 255, 255)',
                'border-radius': '12px',
                padding: '24px',
            },
            title: {
                color: 'rgb(0, 0, 0)',
                'font-weight': '900',
            },
        };
    }

    getSectionCards(sectionPrefix) {
        return this.page.locator(`merch-card[id^="${sectionPrefix}-"]`);
    }

    getCard(id) {
        return this.page.locator(`merch-card[id="${id}"]`);
    }

    getCardTitle(id) {
        return this.getCard(id).locator('h3[slot="heading-xs"]');
    }

    getCardPrice(id) {
        return this.getCard(id).locator('p[slot="heading-m"]');
    }

    getCardCTA(id) {
        return this.getCard(id).locator('div[slot="footer"] a[is="checkout-link"]').first();
    }

    getCardTopCard(id) {
        return this.getCard(id).locator('.top-card');
    }

    getCardWhatsIncluded(id) {
        return this.getCard(id).locator('div[slot="whats-included"]');
    }

    getCardWhatsIncludedToggle(id) {
        return this.getCard(id).locator('button.whats-included-toggle');
    }

    getCardFeaturesZone(id) {
        return this.getCard(id).locator('.features-zone');
    }

    getCardQuantitySelector(id) {
        return this.getCard(id).locator('merch-quantity-select');
    }
}
