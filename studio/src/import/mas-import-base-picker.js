import { LitElement, html, nothing } from 'lit';
import { TAG_MODEL_ID_MAPPING } from '../constants.js';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;
const MERCH_CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];

/**
 * Search-driven picker for the base fragment that the import flow will use as
 * the template for every new variation. Emits `base-fragment-selected` once
 * the author confirms a result so the parent page can advance.
 */
export class MasImportBasePicker extends LitElement {
    static properties = {
        query: { state: true },
        results: { state: true },
        loading: { state: true },
        error: { state: true },
        selected: { state: true },
    };

    constructor() {
        super();
        this.query = '';
        this.results = [];
        this.loading = false;
        this.error = null;
        this.selected = null;
        this.repository = null;
        this.#searchToken = 0;
        this.#debounceHandle = null;
    }

    #searchToken;
    #debounceHandle;

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.repository = document.querySelector('mas-repository');
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#debounceHandle) {
            clearTimeout(this.#debounceHandle);
            this.#debounceHandle = null;
        }
    }

    onInput(event) {
        this.query = event.target.value || '';
        if (this.#debounceHandle) clearTimeout(this.#debounceHandle);
        this.#debounceHandle = setTimeout(() => this.search(), SEARCH_DEBOUNCE_MS);
    }

    async search() {
        const query = this.query.trim();
        const token = ++this.#searchToken;
        if (!query) {
            this.results = [];
            this.loading = false;
            return;
        }

        if (!this.repository?.aem) {
            this.error = 'Repository not available';
            return;
        }

        this.loading = true;
        this.error = null;
        try {
            const iterator = this.repository.aem.sites.cf.fragments.search(
                {
                    query,
                    modelIds: [MERCH_CARD_MODEL_ID],
                },
                PAGE_SIZE,
            );
            const { value: items = [] } = await iterator.next();
            if (token !== this.#searchToken) return;
            this.results = items;
        } catch (err) {
            if (token !== this.#searchToken) return;
            this.error = err?.message || 'Search failed';
            this.results = [];
        } finally {
            if (token === this.#searchToken) this.loading = false;
        }
    }

    async pick(item) {
        if (!this.repository?.aem) return;
        try {
            this.loading = true;
            const fragment = await this.repository.aem.sites.cf.fragments.getById(item.id);
            this.selected = fragment;
            this.dispatchEvent(
                new CustomEvent('base-fragment-selected', {
                    detail: { fragment },
                    bubbles: true,
                    composed: true,
                }),
            );
        } catch (err) {
            this.error = err?.message || 'Failed to load fragment';
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
            <div class="import-base-picker">
                <sp-search
                    placeholder="Search merch cards by title…"
                    value=${this.query}
                    @input=${this.onInput.bind(this)}
                    @submit=${(e) => {
                        e.preventDefault();
                        this.search();
                    }}
                ></sp-search>
                ${this.loading ? html`<p>Searching…</p>` : nothing}
                ${this.error ? html`<p class="error-message">${this.error}</p>` : nothing}
                ${this.results.length
                    ? html`
                          <ul class="import-base-picker__results">
                              ${this.results.map(
                                  (item) => html`
                                      <li>
                                          <button type="button" @click=${() => this.pick(item)}>
                                              <strong>${item.title || item.name}</strong>
                                              <span class="path">${item.path}</span>
                                          </button>
                                      </li>
                                  `,
                              )}
                          </ul>
                      `
                    : nothing}
                ${!this.loading && this.query.trim() && !this.results.length && !this.error
                    ? html`<p>No results.</p>`
                    : nothing}
            </div>
        `;
    }
}

customElements.define('mas-import-base-picker', MasImportBasePicker);
