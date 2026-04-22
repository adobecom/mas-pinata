export default class BadgePage {
    constructor(page) {
        this.page = page;

        // Card + badge row locators — pierce open shadow DOM of merch-card
        this.getCard = (id) => this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();

        this.getBadgeRow = (id) => this.getCard(id).locator('.badge-row');

        this.getLegacyBadge = (id) => this.getBadgeRow(id).locator('#badge');

        this.getSlottedBadge = (id) => this.getCard(id).locator('[slot="badge"]');

        this.getHeading = (id) => this.getCard(id).locator('h3, [slot^="heading-"]').first();

        // CSS properties expected on the badge row — block-level, full-width, non-absolute
        this.cssProp = {
            badgeRow: {
                display: 'block',
                width: /.+/,
            },
        };
    }
}
