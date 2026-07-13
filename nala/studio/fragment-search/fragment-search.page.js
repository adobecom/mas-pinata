export default class FragmentSearchPage {
    constructor(page) {
        this.page = page;

        this.searchInput = page.locator('#actions sp-search input');
        this.searchIcon = page.locator('#actions sp-search[placeholder="Search"] sp-icon-search');
        this.renderView = page.locator('#render');
        this.cards = this.renderView.locator('merch-card');
    }
}
