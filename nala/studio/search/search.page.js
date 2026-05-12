export default class SearchPage {
    constructor(page) {
        this.page = page;

        this.searchInput = page.locator('#actions sp-search input');
        this.searchIcon = page.locator('#actions sp-search sp-icon-search');
        this.renderView = page.locator('#render');
        this.tableView = page.locator('sp-table');
        this.cards = this.renderView.locator('merch-card');
        this.tableRows = this.tableView.locator('sp-table-row');

        this.surfacePicker = page.locator('mas-nav-folder-picker sp-action-menu');
        this.filterPanel = page.locator('mas-filter-panel');

        this.translationSearchInput = page.locator('mas-search-and-filters sp-search input');
        this.translationTable = page.locator('mas-translation sp-table');
        this.translationTableRows = page.locator('mas-translation sp-table sp-table-row');
    }
}
