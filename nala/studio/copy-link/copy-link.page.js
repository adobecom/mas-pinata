export default class CopyLinkPage {
    constructor(page) {
        this.page = page;

        // Toast surfaced by mas-fragment-table.handleCopyLink
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
    }

    /**
     * Locator for the row's actions menu trigger inside <mas-fragment-table>.
     * Works for both top-level rows and expanded variation rows.
     * @param {string} fragmentId
     */
    rowActionsMenu(fragmentId) {
        return this.page.locator(
            `mas-fragment-table[data-id="${fragmentId}"] sp-table-row[value="${fragmentId}"] sp-table-cell.actions sp-action-menu`,
        );
    }

    /**
     * Locator for the "Copy link" item in an opened action menu.
     * @param {string} fragmentId
     */
    copyLinkMenuItem(fragmentId) {
        return this.rowActionsMenu(fragmentId).locator('sp-menu-item:has-text("Copy link")');
    }

    /**
     * Open the action menu for a row and click "Copy link".
     * @param {string} fragmentId
     */
    async copyLinkForRow(fragmentId) {
        const menu = this.rowActionsMenu(fragmentId);
        await menu.scrollIntoViewIfNeeded();
        await menu.click();
        await this.copyLinkMenuItem(fragmentId).click();
    }

    /**
     * Read the current clipboard contents via page.evaluate.
     * Test setup must grant clipboard-read / clipboard-write permissions.
     */
    async readClipboard() {
        return this.page.evaluate(() => navigator.clipboard.readText());
    }
}
