export default class MasPro {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();
    }
}
