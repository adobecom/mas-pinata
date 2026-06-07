export default class FragmentSearchPage {
    constructor(page) {
        this.page = page;

        this.searchInput = page.locator('#actions sp-search input');
        this.renderView = page.locator('#render');
        this.cards = this.renderView.locator('merch-card');
    }

    /** Type a query into the Fragments search box and submit it. */
    async search(term) {
        await this.searchInput.fill(term);
        await this.page.keyboard.press('Enter');
    }

    /** Clear the search box and submit, restoring the full browse list. */
    async clearSearch() {
        await this.searchInput.fill('');
        await this.page.keyboard.press('Enter');
    }
}
