export default class ContentSortPage {
    constructor(page) {
        this.page = page;

        // Table root — Studio Content page table view
        this.tableView = page.locator('#content sp-table');
        this.tableHead = this.tableView.locator('sp-table-head');

        // Header cells (sortable targets from mas-content.js)
        this.titleHeader = this.tableHead.locator('sp-table-head-cell.title');
        this.lastModifiedHeader = this.tableHead.locator('sp-table-head-cell.last-modified');
        this.lastModifiedByHeader = this.tableHead.locator('sp-table-head-cell.last-modified-by');
        this.priceHeader = this.tableHead.locator('sp-table-head-cell.price');

        // Non-sortable headers — these must NOT carry the `sortable` attribute
        this.nameHeader = this.tableHead.locator('sp-table-head-cell.name');
        this.offerIdHeader = this.tableHead.locator('sp-table-head-cell.offer-id');
        this.offerTypeHeader = this.tableHead.locator('sp-table-head-cell.offer-type');
        this.statusHeader = this.tableHead.locator('sp-table-head-cell.status');

        // All header cells in DOM order — used to verify column positioning
        this.allHeaderCells = this.tableHead.locator('sp-table-head-cell');

        // Row cells — only real fragment rows carry a `value` attribute
        this.fragmentRows = this.tableView.locator('sp-table-row[value]');
        this.firstRow = this.fragmentRows.first();
        this.lastModifiedCell = (row) => row.locator('sp-table-cell.last-modified');
        this.titleCell = (row) => row.locator('sp-table-cell.title');

        // Date format — e.g. "Apr 18, 2026 at 2:34 PM"
        this.formattedDateRegex = /^[A-Z][a-z]{2} \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)$/;
        this.emptyDateDash = '—';
    }
}
