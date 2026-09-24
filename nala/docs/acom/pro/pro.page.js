export default class MasPro {
    constructor(page) {
        this.page = page;

        // Pro light card properties (same tokens as the studio Pro page object):
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
            whatsIncludedToggle: {
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '18px',
                cursor: 'pointer',
            },
        };
    }

    // The gallery repeats one fragment, so cards are scoped to their row.
    getRow(rowId) {
        return this.page.locator(`#${rowId}`);
    }

    getCard(rowId, id, index = 0) {
        return this.getRow(rowId).locator(`merch-card:has(aem-fragment[fragment="${id}"])`).nth(index);
    }

    getCardTitle(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('h3[slot="heading-xs"]');
    }

    getCardDescription(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('div[slot="body-xs"]');
    }

    getCardPrice(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('p[slot="heading-m"]');
    }

    getCardWhatsIncluded(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('div[slot="whats-included"]');
    }

    getCardQuantitySelect(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('merch-quantity-select');
    }

    getCardCTA(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('div[slot="footer"] > a[is="checkout-link"]').first();
    }

    // Shadow DOM parts (Playwright locators pierce shadow roots).
    getCardTopCard(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('.top-card');
    }

    getCardLicenseSelectTrigger(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('.license-select-trigger');
    }

    getCardWhatsIncludedToggle(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('button.whats-included-toggle');
    }

    getCardWhatsIncludedToggleLabel(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('.whats-included-toggle-label');
    }

    getCardFeaturesZone(rowId, id, index = 0) {
        return this.getCard(rowId, id, index).locator('.features-zone');
    }
}
