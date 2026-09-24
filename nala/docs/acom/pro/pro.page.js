export default class MasPro {
    constructor(page) {
        this.page = page;

        // Pro light theme card properties (values as in the studio Pro page object):
        this.cssProp = {
            card: {
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

    // The gallery renders the same fragment in several sections, so a card is
    // addressed by fragment id within the section (h2 id) that holds it.
    getCard(id, section) {
        return this.page.locator(`#${section} + .four-merch-cards merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    getCardTitle(id, section) {
        return this.getCard(id, section).locator('h3[slot="heading-xs"]');
    }

    getCardDescription(id, section) {
        return this.getCard(id, section).locator('div[slot="body-xs"]');
    }

    getCardPrice(id, section) {
        return this.getCard(id, section).locator('p[slot="heading-m"]');
    }

    getCardCTA(id, section) {
        return this.getCard(id, section).locator('div[slot="footer"] > a[is="checkout-link"]');
    }

    getCardQS(id, section) {
        return this.getCard(id, section).locator('merch-quantity-select');
    }

    // Shadow DOM elements (Playwright locators pierce shadow roots)
    getCardTopCard(id, section) {
        return this.getCard(id, section).locator('.top-card');
    }

    getWhatsIncludedToggle(id, section) {
        return this.getCard(id, section).locator('button.whats-included-toggle');
    }

    getFeaturesZone(id, section) {
        return this.getCard(id, section).locator('.features-zone');
    }

    getWhatsIncludedSection(id, section) {
        return this.getCard(id, section).locator('div[slot="whats-included"] .section');
    }
}
