export default class MasPro {
    constructor(page) {
        this.page = page;

        // Pro card CSS properties (light theme), same values as the Studio Pro suite:
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
                'font-size': '24px',
                'font-weight': '900',
                'line-height': '24px',
            },
            description: {
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '18px',
            },
            price: {
                color: 'rgb(0, 0, 0)',
                'font-size': '18px',
                'font-weight': '900',
                'line-height': '21px',
            },
        };
    }

    getSection(sectionId) {
        return this.page.locator(`#${sectionId}`);
    }

    getCards(sectionId) {
        return this.getSection(sectionId).locator('merch-card[variant="pro"]');
    }

    getCard(sectionId, index = 0) {
        return this.getCards(sectionId).nth(index);
    }

    // Slotted (light DOM) elements, relative to a card.
    getCardTitle(card) {
        return card.locator('h3[slot="heading-xs"]');
    }

    getCardDescription(card) {
        return card.locator('div[slot="body-xs"]');
    }

    getCardPrice(card) {
        return card.locator('p[slot="heading-m"]');
    }

    getCardCTA(card) {
        return card.locator('div[slot="footer"] > a[is="checkout-link"]').first();
    }

    getCardQuantitySelector(card) {
        return card.locator('merch-quantity-select');
    }

    getCardWhatsIncluded(card) {
        return card.locator('div[slot="whats-included"]');
    }

    // Shadow DOM elements (Playwright locators pierce shadow roots).
    getCardTopCard(card) {
        return card.locator('.top-card');
    }

    getCardWhatsIncludedToggle(card) {
        return card.locator('button.whats-included-toggle');
    }

    getCardFeaturesZone(card) {
        return card.locator('.features-zone');
    }
}
