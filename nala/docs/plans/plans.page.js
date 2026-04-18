export default class MasPlans {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();
    }

    getGalleryFooterCtas() {
        return this.page.locator('.four-merch-cards.plans merch-card div[slot="footer"] :is(a, button)');
    }
}
