import { LitElement, html, nothing } from 'lit';
import { showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { parsePastedText, parseSpreadsheetFile } from './import-spreadsheet-parser.js';
import { validateIntroRow, validateRegionalRow } from './import-row-validator.js';
import { downloadTemplate } from './import-template.js';
import './mas-import-base-picker.js';

const STEPS = {
    PICK_BASE: 'pick-base',
    UPLOAD: 'upload',
    PREVIEW: 'preview',
    IMPORTING: 'importing',
    SUMMARY: 'summary',
};

/**
 * Main page for the Import Variations flow. Owns flow state locally — the
 * import does not need to survive navigation, so adding a Store slice would
 * pollute global state without benefit.
 */
export class MasImportVariations extends LitElement {
    static properties = {
        step: { state: true },
        baseFragment: { state: true },
        pasteValue: { state: true },
        validatedRows: { state: true },
        formatError: { state: true },
        progress: { state: true },
        result: { state: true },
        parsing: { state: true },
        existingOsiSet: { state: true },
        existingPromoSet: { state: true },
    };

    constructor() {
        super();
        this.step = STEPS.PICK_BASE;
        this.baseFragment = null;
        this.pasteValue = '';
        this.validatedRows = [];
        this.formatError = null;
        this.progress = { done: 0, total: 0, currentLabel: '' };
        this.result = null;
        this.parsing = false;
        this.existingOsiSet = new Set();
        this.existingPromoSet = new Set();
    }

    createRenderRoot() {
        return this;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    reset() {
        this.step = STEPS.PICK_BASE;
        this.baseFragment = null;
        this.pasteValue = '';
        this.validatedRows = [];
        this.formatError = null;
        this.progress = { done: 0, total: 0, currentLabel: '' };
        this.result = null;
        this.existingOsiSet = new Set();
        this.existingPromoSet = new Set();
    }

    onBaseSelected(event) {
        const fragment = event.detail?.fragment;
        if (!fragment) return;
        this.baseFragment = fragment;
        this.collectExistingIdentifiers(fragment);
        this.step = STEPS.UPLOAD;
    }

    /**
     * Walks the base fragment's variations field, fetches each one, and
     * collects existing OSI / promoCode values. Used to flag duplicates
     * up-front so authors can adjust before clicking Import.
     */
    async collectExistingIdentifiers(parentFragment) {
        const variationsField = parentFragment.fields?.find((f) => f.name === 'variations');
        const variationPaths = variationsField?.values || [];

        const osiSet = new Set();
        const promoSet = new Set();

        const aem = this.repository?.aem;
        if (!aem) {
            this.existingOsiSet = osiSet;
            this.existingPromoSet = promoSet;
            return;
        }

        await Promise.all(
            variationPaths.map(async (path) => {
                try {
                    const variation = await aem.sites.cf.fragments.getByPath(path).catch(() => null);
                    if (!variation) return;
                    const osi = variation.fields?.find((f) => f.name === 'osi')?.values?.[0];
                    const promo = variation.fields?.find((f) => f.name === 'promoCode')?.values?.[0];
                    if (osi) osiSet.add(String(osi).trim());
                    if (promo) promoSet.add(String(promo).trim());
                } catch (err) {
                    console.warn('Failed to inspect variation for duplicate detection:', err);
                }
            }),
        );

        this.existingOsiSet = osiSet;
        this.existingPromoSet = promoSet;
    }

    async onFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        this.parsing = true;
        try {
            const parsed = await parseSpreadsheetFile(file);
            this.applyParsed(parsed);
        } catch (err) {
            this.formatError = err?.message || 'Failed to parse spreadsheet';
            this.validatedRows = [];
            this.step = STEPS.PREVIEW;
        } finally {
            this.parsing = false;
            event.target.value = '';
        }
    }

    onPasteParse() {
        if (!this.pasteValue?.trim()) {
            showToast('Paste some rows before parsing.', 'info');
            return;
        }
        const parsed = parsePastedText(this.pasteValue);
        this.applyParsed(parsed);
    }

    applyParsed({ regionalRows, introRows, formatError }) {
        this.formatError = formatError;
        const validated = [];
        for (const row of regionalRows) {
            const result = validateRegionalRow(row, { existingOsiSet: this.existingOsiSet });
            validated.push({
                row,
                type: 'regional',
                ...result,
            });
        }
        for (const row of introRows) {
            const result = validateIntroRow(row, { existingPromoSet: this.existingPromoSet });
            validated.push({
                row,
                type: 'intro',
                ...result,
            });
        }
        this.validatedRows = validated;
        this.step = STEPS.PREVIEW;
    }

    get counts() {
        const valid = this.validatedRows.filter((r) => r.valid).length;
        const alreadyExists = this.validatedRows.filter((r) => !r.valid && r.alreadyExists).length;
        const invalid = this.validatedRows.filter((r) => !r.valid && !r.alreadyExists).length;
        return { valid, invalid, alreadyExists };
    }

    async onImportClick() {
        if (!this.repository) {
            showToast('Repository not available', 'negative');
            return;
        }
        const validRegional = this.validatedRows.filter((r) => r.valid && r.type === 'regional').map((r) => r.row);
        const validIntro = this.validatedRows.filter((r) => r.valid && r.type === 'intro').map((r) => r.row);

        if (!validRegional.length && !validIntro.length) {
            showToast('No valid rows to import.', 'info');
            return;
        }

        this.step = STEPS.IMPORTING;
        this.progress = { done: 0, total: validRegional.length + validIntro.length, currentLabel: '' };

        try {
            const result = await this.repository.bulkCreateVariationsFromRows({
                baseFragmentId: this.baseFragment.id,
                regionalRows: validRegional,
                introRows: validIntro,
                onProgress: (p) => {
                    this.progress = { ...this.progress, ...p };
                },
            });
            this.result = result;
            this.step = STEPS.SUMMARY;
        } catch (err) {
            showToast(err?.message || 'Import failed', 'negative');
            this.step = STEPS.PREVIEW;
        }
    }

    renderPickBase() {
        return html`
            <h2>Step 1 — Choose a base card</h2>
            <p>Search for the merch card whose fields every new variation should inherit.</p>
            <mas-import-base-picker @base-fragment-selected=${this.onBaseSelected.bind(this)}></mas-import-base-picker>
        `;
    }

    renderUpload() {
        const isGroupedSource = Fragment.isGroupedVariationPath(this.baseFragment?.path);
        return html`
            <h2>Step 2 — Provide variations data</h2>
            <p>
                Base card: <strong>${this.baseFragment?.title || this.baseFragment?.name}</strong>
                <sp-button variant="secondary" treatment="outline" size="s" @click=${() => this.reset()}>Change</sp-button>
            </p>
            ${isGroupedSource
                ? html`<sp-help-text>
                      The selected fragment is a grouped variation. The import will use its parent card as the template — that's
                      the card every new variation will inherit from.
                  </sp-help-text>`
                : nothing}
            <div class="import-upload-grid">
                <section>
                    <h3>Upload an XLSX</h3>
                    <p>The workbook must contain tabs named "Regional Pricing" and/or "Intro Pricing".</p>
                    <sp-button variant="secondary" treatment="outline" @click=${() => downloadTemplate()}>
                        Download template
                    </sp-button>
                    <input
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        @change=${this.onFileChange.bind(this)}
                        ?disabled=${this.parsing}
                    />
                    ${this.parsing ? html`<sp-progress-circle indeterminate size="s"></sp-progress-circle>` : nothing}
                </section>
                <section>
                    <h3>Or paste rows</h3>
                    <sp-help-text>
                        Paste tab-separated rows from your spreadsheet. Use a blank line to separate Regional Pricing from Intro
                        Pricing blocks. A single block is treated as Regional.
                    </sp-help-text>
                    <sp-textfield
                        multiline
                        rows="8"
                        placeholder="Countries	Price Point	Regional Price Offer ID&#10;FR	commercial	abc123"
                        .value=${this.pasteValue}
                        @input=${(e) => (this.pasteValue = e.target.value)}
                    ></sp-textfield>
                    <sp-button variant="secondary" @click=${this.onPasteParse.bind(this)}>Parse pasted data</sp-button>
                </section>
            </div>
        `;
    }

    renderPreviewRow(entry, index) {
        const { row, type, valid, alreadyExists, reason } = entry;
        const identifier = type === 'regional' ? row['Regional Price Offer ID'] : row['Promo Vanity Code'];
        const status = valid ? 'Ready' : alreadyExists ? 'Already exists' : 'Invalid';
        const className = !valid && !alreadyExists ? 'invalid' : alreadyExists ? 'duplicate' : '';
        return html`
            <sp-table-row class=${className}>
                <sp-table-cell>${index + 1}</sp-table-cell>
                <sp-table-cell>${type === 'regional' ? 'Regional' : 'Intro'}</sp-table-cell>
                <sp-table-cell>${row['Countries'] || ''}</sp-table-cell>
                <sp-table-cell>${row['Price Point'] || ''}</sp-table-cell>
                <sp-table-cell>${identifier || ''}</sp-table-cell>
                <sp-table-cell>${status}${reason ? html` — ${reason}` : nothing}</sp-table-cell>
            </sp-table-row>
        `;
    }

    renderPreview() {
        const { valid, invalid, alreadyExists } = this.counts;
        const rows = this.validatedRows;
        return html`
            <h2>Step 3 — Review and confirm</h2>
            ${this.formatError
                ? html`<div class="format-error">
                      <p>${this.formatError}</p>
                      <sp-button variant="secondary" treatment="outline" @click=${() => downloadTemplate()}>
                          Download template
                      </sp-button>
                  </div>`
                : nothing}
            <p>${valid} valid · ${invalid} invalid · ${alreadyExists} already exist</p>
            ${rows.length
                ? html`
                      <sp-table size="m" scroller>
                          <sp-table-head>
                              <sp-table-head-cell>#</sp-table-head-cell>
                              <sp-table-head-cell>Tab</sp-table-head-cell>
                              <sp-table-head-cell>Countries</sp-table-head-cell>
                              <sp-table-head-cell>Price Point</sp-table-head-cell>
                              <sp-table-head-cell>OSI / Promo Code</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body> ${rows.map((entry, index) => this.renderPreviewRow(entry, index))} </sp-table-body>
                      </sp-table>
                  `
                : nothing}
            <div class="import-actions">
                <sp-button variant="secondary" treatment="outline" @click=${() => (this.step = STEPS.UPLOAD)}> Back </sp-button>
                <sp-button variant="cta" ?disabled=${valid === 0} @click=${this.onImportClick.bind(this)}>
                    Import ${valid} variation${valid === 1 ? '' : 's'}
                </sp-button>
            </div>
        `;
    }

    renderImporting() {
        const { done, total, currentLabel } = this.progress;
        return html`
            <h2>Importing variations…</h2>
            <p>${done} of ${total}${currentLabel ? html` — ${currentLabel}` : nothing}</p>
            <sp-progress-circle indeterminate size="l"></sp-progress-circle>
        `;
    }

    renderSummary() {
        const { created = [], skipped = [], failed = [] } = this.result || {};
        const renderList = (items, labelFor) => html`
            <ul>
                ${items.map((item) => html`<li>${labelFor(item)}</li>`)}
            </ul>
        `;
        return html`
            <h2>Import complete</h2>
            <p>${created.length} created · ${skipped.length} skipped · ${failed.length} failed</p>
            <section>
                <h3>Created (${created.length})</h3>
                ${created.length ? renderList(created, (c) => html`${c.path || c.id}`) : html`<p>None.</p>`}
            </section>
            <section>
                <h3>Skipped (${skipped.length})</h3>
                ${skipped.length
                    ? renderList(skipped, (s) => html`${s.identifier || ''}${s.reason ? html` — ${s.reason}` : nothing}`)
                    : html`<p>None.</p>`}
            </section>
            <section>
                <h3>Failed (${failed.length})</h3>
                ${failed.length ? renderList(failed, (f) => html`${f.identifier || ''} — ${f.error}`) : html`<p>None.</p>`}
            </section>
            <div class="import-actions">
                <sp-button variant="cta" @click=${() => this.reset()}>Done</sp-button>
            </div>
        `;
    }

    renderStep() {
        switch (this.step) {
            case STEPS.PICK_BASE:
                return this.renderPickBase();
            case STEPS.UPLOAD:
                return this.renderUpload();
            case STEPS.PREVIEW:
                return this.renderPreview();
            case STEPS.IMPORTING:
                return this.renderImporting();
            case STEPS.SUMMARY:
                return this.renderSummary();
            default:
                return nothing;
        }
    }

    render() {
        return html`
            <div class="import-variations-page">
                <h1>Import Variations</h1>
                <p>
                    Bulk-create regional and intro pricing variations under a base merch card from a spreadsheet. Existing
                    variations are never modified — duplicates are reported as "already exists" in the summary.
                </p>
                ${this.renderStep()}
            </div>
        `;
    }
}

customElements.define('mas-import-variations', MasImportVariations);
