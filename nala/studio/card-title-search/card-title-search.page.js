export default class CardTitleSearchPage {
    constructor(page) {
        this.page = page;
        this.searchInput = page.locator('#actions sp-search input');
        this.renderView = page.locator('#render');
        this.cards = this.renderView.locator('merch-card');
    }
}
