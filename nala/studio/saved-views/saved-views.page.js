export default class SavedViewsPage {
    constructor(page) {
        this.page = page;

        this.toolbar = page.locator('mas-toolbar');
        this.filterBadge = this.toolbar.locator('.filters-badge');
        this.picker = this.toolbar.locator('sp-picker[label="Saved views"]');
        this.saveOption = this.picker.locator('sp-menu-item[value="__save__"]');

        this.saveDialog = this.toolbar.locator('.saved-view-dialog');
        this.nameInput = this.saveDialog.locator('sp-textfield#saved-view-name');
        this.nameError = this.saveDialog.locator('.saved-view-name-error');
        this.saveButton = this.saveDialog.locator('sp-button[variant="accent"]');
        this.cancelButton = this.saveDialog.locator('sp-button[variant="secondary"]');
    }

    /**
     * Row menu-item for a saved view by display name.
     * Skips the synthetic "Save current view" row (it has value="__save__").
     */
    rowByName(name) {
        return this.picker
            .locator('sp-menu-item:not([value="__save__"])')
            .filter({ has: this.page.locator(`.saved-view-name:has-text("${name}")`) });
    }

    deleteButtonFor(name) {
        return this.rowByName(name).locator('.saved-view-delete');
    }

    async openPicker() {
        await this.picker.click();
    }

    async openSaveDialog() {
        await this.openPicker();
        await this.saveOption.click();
    }

    async saveViewAs(name) {
        await this.openSaveDialog();
        await this.nameInput.click();
        await this.nameInput.fill(name);
        await this.saveButton.click();
    }

    async applyView(name) {
        await this.openPicker();
        await this.rowByName(name).click();
    }

    async deleteView(name) {
        await this.openPicker();
        await this.deleteButtonFor(name).click();
    }
}
