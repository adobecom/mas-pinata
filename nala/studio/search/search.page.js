export default class SearchPage {
    constructor(page) {
        this.page = page;

        // Fragments search box (lives in the Studio top actions bar)
        this.searchInput = page.locator('#actions sp-search  input');
        this.searchIcon = page.locator('#actions sp-search[placeholder="Search"] sp-icon-search');

        // Results surface
        this.renderView = page.locator('#render:not(.next-page-skeletons)');
        this.cards = this.renderView.locator('merch-card');
        // A rendered card is identified by the fragment id on its <aem-fragment>
        this.cardByFragmentId = (id) => this.renderView.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    /**
     * Type a query into the Fragments search box and submit it.
     * @param {string} query - The substring to search for.
     */
    async search(query) {
        await this.searchInput.fill(query);
        await this.page.keyboard.press('Enter');
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Wait for at least one rendered card to be visible.
     */
    async waitForCardsLoaded() {
        await this.cards.first().waitFor({ state: 'visible', timeout: 30000 });
    }

    /**
     * Return the number of cards currently rendered in the results view.
     */
    async getVisibleCardCount() {
        return this.cards.count();
    }
}
