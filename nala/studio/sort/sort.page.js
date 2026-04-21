export default class SortPage {
    constructor(page) {
        this.page = page;

        // Table containers on the content page
        this.table = page.locator('#content sp-table');
        this.tableHead = this.table.locator('sp-table-head').first();
        this.tableBody = this.table.locator('sp-table-body').first();
        this.tableRows = this.table.locator('sp-table-row');

        // Sortable header cells (driven by the new updateContentSort click handler)
        this.titleHeader = this.tableHead.locator('sp-table-head-cell.title');
        this.lastModifiedHeader = this.tableHead.locator('sp-table-head-cell.last-modified');

        // Row-level cells that participate in sorting
        this.titleCells = this.table.locator('sp-table-row sp-table-cell.title');
        this.lastModifiedCells = this.table.locator('sp-table-row sp-table-cell.last-modified');
        this.lastModifiedByCells = this.table.locator('sp-table-row sp-table-cell.last-modified-by');

        // Header cells in rendered order (used to assert column ordering)
        this.allHeadCells = this.tableHead.locator('sp-table-head-cell');
        this.offerTypeHeader = this.tableHead.locator('sp-table-head-cell.offer-type');
        this.lastModifiedByHeader = this.tableHead.locator('sp-table-head-cell.last-modified-by');

        // Useful attributes and selectors
        this.attr = {
            sortable: 'sortable',
            sortDirection: 'sort-direction',
        };

        this.sortDirectionValues = {
            asc: 'asc',
            desc: 'desc',
        };
    }

    firstRowTitleCell() {
        return this.titleCells.first();
    }

    firstRowLastModifiedCell() {
        return this.lastModifiedCells.first();
    }

    async headerClassesInOrder() {
        const count = await this.allHeadCells.count();
        const classes = [];
        for (let i = 0; i < count; i += 1) {
            const className = await this.allHeadCells.nth(i).getAttribute('class');
            classes.push(className || '');
        }
        return classes;
    }
}
