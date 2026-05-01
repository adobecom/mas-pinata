export default class ImportVariationsPage {
    constructor(page) {
        this.page = page;

        // Side nav entry
        this.sideNavItem = page.locator('mas-side-nav-item[label="Import Variations"]');

        // Root page element
        this.importPage = page.locator('mas-import-variations');
        this.pageRoot = page.locator('mas-import-variations .import-variations-page');
        this.pageHeading = page.locator('mas-import-variations h1', { hasText: 'Import Variations' });
        this.pageDescription = page.locator('mas-import-variations .import-variations-page > p').first();

        // Step 1 — pick base
        this.basePicker = page.locator('mas-import-base-picker');
        this.basePickerSearch = page.locator('mas-import-base-picker sp-search');
        this.basePickerResults = page.locator('mas-import-base-picker ul.import-base-picker__results');
        this.basePickerResultItems = page.locator('mas-import-base-picker ul.import-base-picker__results li button');
        this.basePickerErrorMessage = page.locator('mas-import-base-picker .error-message');
        this.stepOneHeading = page.locator('mas-import-variations h2', { hasText: 'Step 1' });

        // Step 2 — upload / paste
        this.stepTwoHeading = page.locator('mas-import-variations h2', { hasText: 'Step 2' });
        this.uploadGrid = page.locator('mas-import-variations .import-upload-grid');
        this.downloadTemplateButton = page.locator('mas-import-variations sp-button', { hasText: 'Download template' });
        this.fileInput = page.locator('mas-import-variations input[type="file"]');
        this.pasteTextfield = page.locator('mas-import-variations sp-textfield[multiline]');
        this.parsePastedButton = page.locator('mas-import-variations sp-button', { hasText: 'Parse pasted data' });
        this.changeBaseButton = page.locator('mas-import-variations sp-button', { hasText: 'Change' });

        // Step 3 — preview
        this.stepThreeHeading = page.locator('mas-import-variations h2', { hasText: 'Step 3' });
        this.previewTable = page.locator('mas-import-variations sp-table');
        this.previewRows = page.locator('mas-import-variations sp-table sp-table-row');
        this.invalidRows = page.locator('mas-import-variations sp-table sp-table-row.invalid');
        this.duplicateRows = page.locator('mas-import-variations sp-table sp-table-row.duplicate');
        this.formatErrorBanner = page.locator('mas-import-variations .format-error');
        this.formatErrorDownloadButton = page.locator('mas-import-variations .format-error sp-button', { hasText: 'Download template' });
        this.importButton = page.locator('mas-import-variations sp-button[variant="cta"]');
        this.backButton = page.locator('mas-import-variations sp-button', { hasText: 'Back' });

        // Step 4 — importing
        this.importingHeading = page.locator('mas-import-variations h2', { hasText: 'Importing variations' });
        this.progressIndicator = page.locator('mas-import-variations sp-progress-circle');

        // Step 5 — summary
        this.summaryHeading = page.locator('mas-import-variations h2', { hasText: 'Import complete' });
        this.summarySections = page.locator('mas-import-variations section');
        this.summaryCreatedSection = page.locator('mas-import-variations section', { has: page.locator('h3', { hasText: 'Created' }) });
        this.summarySkippedSection = page.locator('mas-import-variations section', { has: page.locator('h3', { hasText: 'Skipped' }) });
        this.summaryFailedSection = page.locator('mas-import-variations section', { has: page.locator('h3', { hasText: 'Failed' }) });
        this.summaryCreatedItems = this.summaryCreatedSection.locator('ul li');
        this.summarySkippedItems = this.summarySkippedSection.locator('ul li');
        this.summaryFailedItems = this.summaryFailedSection.locator('ul li');
        this.doneButton = page.locator('mas-import-variations sp-button[variant="cta"]', { hasText: 'Done' });
    }

    async waitForPage() {
        await this.importPage.waitFor({ timeout: 10000 });
        await this.pageHeading.waitFor({ timeout: 10000 });
    }

    async waitForBasePicker() {
        await this.basePicker.waitFor({ timeout: 10000 });
        await this.basePickerSearch.waitFor({ timeout: 10000 });
    }

    async searchBaseCard(query) {
        const inputEl = this.basePickerSearch.locator('input').first();
        await inputEl.fill(query);
        await this.page.waitForTimeout(500);
    }
}
