export default class SelectionPanelPage {
    constructor(page) {
        this.page = page;

        this.selectionPanel = page.locator('mas-selection-panel sp-action-bar');
        this.copyCodeButton = this.selectionPanel.locator('sp-action-button[label="Copy code"]');
        this.deleteButton = this.selectionPanel.locator('sp-action-button[label="Delete"]');
        this.publishButton = this.selectionPanel.locator('sp-action-button[label="Publish"]');
        this.unpublishButton = this.selectionPanel.locator('sp-action-button[label="Unpublish"]');

        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
    }

    /**
     * Read the system clipboard back into the test process.
     * Resolves to `{ html, plain }` strings (empty string when a MIME type
     * is not present on the clipboard).
     *
     * Requires `clipboard-read` and `clipboard-write` permissions to be
     * granted to the browser context before this is called.
     */
    async readClipboard() {
        return this.page.evaluate(async () => {
            const items = await navigator.clipboard.read();
            let html = '';
            let plain = '';
            for (const item of items) {
                if (item.types.includes('text/html')) {
                    const blob = await item.getType('text/html');
                    html = await blob.text();
                }
                if (item.types.includes('text/plain')) {
                    const blob = await item.getType('text/plain');
                    plain = await blob.text();
                }
            }
            return { html, plain };
        });
    }
}
