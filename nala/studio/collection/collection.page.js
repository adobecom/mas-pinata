export default class CollectionEditorPage {
    constructor(page) {
        this.page = page;

        // Collection editor host element
        this.collectionEditor = page.locator('merch-card-collection-editor');

        // Cards container + items
        this.cardsContainer = this.collectionEditor.locator('.cards-container');
        this.cardItems = this.cardsContainer.locator('mas-fragment-item');

        // Add card row UI
        this.addCardRow = this.collectionEditor.locator('.add-card-row');
        this.addCardButton = this.addCardRow.locator('sp-action-button.add-card-button');
        this.addCardInput = this.addCardRow.locator('sp-textfield.add-card-input');
        this.addCardInputField = this.addCardInput.locator('input');
        this.addCardError = this.addCardRow.locator('.add-card-error');

        // Toast (rendered at document level, not inside the editor shadow root)
        this.toast = page.locator('sp-toast');
        this.toastPositive = page.locator('sp-toast[variant="positive"]');
        this.toastNegative = page.locator('sp-toast[variant="negative"]');
    }

    /**
     * Set the value on the sp-textfield and dispatch a `change` event without
     * blurring the field. Mirrors a real paste resolve path: the implementation
     * listens for `@change` on the sp-textfield and leaves the input expanded
     * on error states so the author can correct.
     */
    async submitCardLink(value) {
        await this.addCardInput.evaluate((el, val) => {
            el.value = val;
            const inner = el.shadowRoot?.querySelector('input');
            if (inner) inner.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }, value);
    }
}
