import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import Events from './events.js';
import { saveSavedViews } from './saved-views.js';
import './mas-folder-picker.js';
import './aem/mas-filter-panel.js';
import './mas-selection-panel.js';
import './mas-create-dialog.js';
import './mas-copy-dialog.js';
// Requires sp-picker / sp-menu-item / sp-menu-divider (loaded via ./swc.js)

const renderModes = [
    {
        value: 'render',
        label: 'Render view',
        icon: html`<sp-icon-view-grid-fluid slot="icon"></sp-icon-view-grid-fluid>`,
    },
    {
        value: 'table',
        label: 'Table view',
        icon: html`<sp-icon-table slot="icon"></sp-icon-table>`,
    },
];

const contentTypes = [
    {
        value: 'merch-card',
        label: 'Merch Card',
    },
    {
        value: 'merch-card-collection',
        label: 'Merch Card Collection',
    },
];

const MAX_SAVED_VIEWS = 20;
const MAX_VIEW_NAME_LENGTH = 60;
const SAVE_SENTINEL = '__save__';
const SHAREABLE_HASH_LIMIT = 2000;

class MasToolbar extends LitElement {
    static properties = {
        createDialogOpen: { state: true },
        selectedContentType: { state: true },
        filterCount: { state: true },
        copyDialogOpen: { state: true },
        fragmentToCopy: { state: true },
        savedViewDialogOpen: { state: true },
        savedViewNameDraft: { state: true },
        savedViewNameError: { state: true },
        savedViewSaving: { state: true },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            margin-top: 24px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }

        #toolbar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        #actions {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }

        #read,
        #write {
            display: flex;
            gap: 10px;
        }

        #read {
            flex-grow: 1;
        }

        #write {
            margin-left: auto;
        }

        sp-button {
            white-space: nowrap;
        }

        .filters-button {
            border: none;
            font-weight: bold;
            cursor: default;
        }

        .filters-button:not(.shown) {
            background-color: #fff;
            color: var(--spectrum-gray-700);
        }

        .filters-button.shown {
            background-color: var(--spectrum-blue-100);
            color: var(--spectrum-accent-color-1000);
        }

        .filters-button.shown:hover {
            background-color: var(--spectrum-blue-200);
        }

        .filters-button:not(.shown):hover {
            background-color: var(--spectrum-actionbutton-background-color-hover);
        }

        .filters-badge {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--spectrum-accent-color-1000);
            color: var(--spectrum-white);
            border-radius: 2px;
        }

        sp-search {
            flex-grow: 1;
            max-width: 400px;
        }

        #search-results-label {
            color: var(--spectrum-gray-700);
        }

        .saved-views-picker {
            min-width: 180px;
        }

        .saved-view-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .saved-view-row .saved-view-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .saved-view-delete {
            flex-shrink: 0;
        }

        .saved-view-dialog-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .saved-view-dialog {
            background: var(--spectrum-white);
            border-radius: 8px;
            padding: 24px;
            min-width: 360px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .saved-view-dialog-header {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .saved-view-dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
        }

        .saved-view-dialog sp-textfield {
            width: 100%;
        }

        .saved-view-name-error {
            color: var(--spectrum-red-700, #b60000);
            font-size: 12px;
            margin-top: 8px;
        }
    `;

    constructor() {
        super();
        this.createDialogOpen = false;
        this.selectedContentType = 'merch-card';
        this.filterCount = 0;
        this.copyDialogOpen = false;
        this.fragmentToCopy = null;
        this.savedViewDialogOpen = false;
        this.savedViewNameDraft = '';
        this.savedViewNameError = '';
        this.savedViewSaving = false;

        this.handleCopyToFolder = this.handleCopyToFolder.bind(this);
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    renderMode = new StoreController(this, Store.renderMode);
    selecting = new StoreController(this, Store.selecting);
    loading = new StoreController(this, Store.fragments.list.loading);
    savedViews = new StoreController(this, Store.savedViews);

    connectedCallback() {
        super.connectedCallback();

        this.updateFilterCount();

        this.filtersSubscription = Store.filters.subscribe(() => {
            this.updateFilterCount();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.filtersSubscription) {
            this.filtersSubscription.unsubscribe();
        }
    }

    update() {
        super.update();
    }

    updateFilterCount() {
        const filters = Store.filters.get();
        if (!filters || !filters.tags) {
            this.filterCount = 0;
            return;
        }

        if (typeof filters.tags === 'string') {
            this.filterCount = filters.tags.split(',').filter(Boolean).length;
        } else if (Array.isArray(filters.tags)) {
            this.filterCount = filters.tags.filter(Boolean).length;
        } else {
            this.filterCount = 0;
        }
        if (Store.createdByUsers.value.length > 0) {
            this.filterCount += 1;
        }
    }

    handleRenderModeChange(ev) {
        localStorage.setItem('mas-render-mode', ev.target.value);
        Store.renderMode.set(ev.target.value);
    }

    clearUuidResolutionState() {
        Store.search.removeMeta('uuid-query');
        Store.search.removeMeta('uuid-path');
        Store.filters.removeMeta('uuid-query');
        Store.filters.removeMeta('uuid-locale');
    }

    updateQuery(value) {
        Store.search.set((prev) => ({ ...prev, query: value }));
    }

    get popover() {
        return this.shadowRoot.querySelector('sp-popover');
    }

    selectContentType(type) {
        this.selectedContentType = type;
        this.popover.open = false;
        this.openCreateDialog();
    }

    openCreateDialog() {
        this.createDialogOpen = true;
    }

    handleSearchSubmit(ev) {
        ev.preventDefault();
        this.clearUuidResolutionState();
        this.updateQuery(ev.target.value);
    }

    handleChange(ev) {
        if (ev.target.value === '') {
            this.clearUuidResolutionState();
            this.updateQuery('');
        }
    }

    get searchAndFilterControls() {
        return html`<div id="read">
            <sp-action-button toggles label="Filter" class="filters-button ${this.filterCount > 0 ? 'shown' : ''}">
                ${!this.filterCount > 0
                    ? html`<sp-icon-filter slot="icon"></sp-icon-filter>`
                    : html`<div slot="icon" class="filters-badge">${this.filterCount}</div>`}
                Filter</sp-action-button
            >
            ${this.savedViewsPicker}
            <sp-search
                label="Search"
                placeholder="Search"
                @submit="${this.handleSearchSubmit}"
                @change=${this.handleChange}
                value=${this.search.value.query}
                size="m"
            ></sp-search>
        </div>`;
    }

    get savedViewsPicker() {
        const views = this.savedViews.value || [];
        return html`<sp-picker
            class="saved-views-picker"
            label="Saved views"
            placeholder="Saved views"
            .value=${''}
            size="m"
            @change=${this.handleSavedViewPickerChange}
        >
            <sp-menu-item value="${SAVE_SENTINEL}">
                <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                Save current view
            </sp-menu-item>
            ${views.length > 0 ? html`<sp-menu-divider></sp-menu-divider>` : nothing}
            ${views.map(
                (view) => html`<sp-menu-item value="${view.id}">
                    <div class="saved-view-row">
                        <span class="saved-view-name" title=${view.name}>${view.name}</span>
                        <sp-action-button
                            quiet
                            size="s"
                            class="saved-view-delete"
                            label="Delete view ${view.name}"
                            @click=${(e) => this.handleDeleteSavedView(e, view)}
                            @pointerdown=${(e) => e.stopPropagation()}
                        >
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>
                </sp-menu-item>`,
            )}
        </sp-picker>`;
    }

    handleSavedViewPickerChange(event) {
        const target = event.target;
        const value = target.value;
        if (!value) return;
        if (value === SAVE_SENTINEL) {
            this.openSavedViewDialog();
        } else {
            this.applySavedView(value);
        }
        // Reset selection so the same view can be chosen again.
        if (target) target.value = '';
    }

    openSavedViewDialog() {
        this.savedViewNameDraft = '';
        this.savedViewNameError = '';
        this.savedViewSaving = false;
        this.savedViewDialogOpen = true;
    }

    closeSavedViewDialog() {
        this.savedViewDialogOpen = false;
        this.savedViewNameDraft = '';
        this.savedViewNameError = '';
        this.savedViewSaving = false;
    }

    buildCurrentViewPayload() {
        const filters = Store.filters.value || {};
        const sort = Store.sort.value || {};
        const search = Store.search.value || {};
        return {
            filters: {
                locale: filters.locale,
                tags: filters.tags,
                personalizationFilterEnabled: !!filters.personalizationFilterEnabled,
            },
            createdByUsers: (Store.createdByUsers.value || []).map((u) => ({
                displayName: u.displayName,
                userPrincipalName: u.userPrincipalName,
            })),
            searchPath: search.path || '',
            sort: {
                sortBy: sort.sortBy,
                sortDirection: sort.sortDirection,
            },
        };
    }

    generateViewId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `view-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async handleSaveSavedViewConfirm() {
        const name = (this.savedViewNameDraft || '').trim();
        if (!name) {
            this.savedViewNameError = 'Name is required';
            return;
        }
        if (name.length > MAX_VIEW_NAME_LENGTH) {
            this.savedViewNameError = `Name must be ${MAX_VIEW_NAME_LENGTH} characters or fewer`;
            return;
        }

        const current = Store.savedViews.value || [];
        const existing = current.find((v) => v.name.toLowerCase() === name.toLowerCase());
        if (!existing && current.length >= MAX_SAVED_VIEWS) {
            Events.toast.emit({
                variant: 'negative',
                content: `Maximum of ${MAX_SAVED_VIEWS} saved views reached. Delete one to save a new view.`,
            });
            this.closeSavedViewDialog();
            return;
        }

        if (existing) {
            const confirmed = window.confirm(`Overwrite existing view "${existing.name}"?`);
            if (!confirmed) return;
        }

        const payload = this.buildCurrentViewPayload();
        let next;
        if (existing) {
            next = current.map((v) =>
                v.id === existing.id
                    ? { ...existing, name, payload, createdAt: new Date().toISOString() }
                    : v,
            );
        } else {
            next = [
                ...current,
                {
                    id: this.generateViewId(),
                    name,
                    createdAt: new Date().toISOString(),
                    payload,
                },
            ];
        }

        const previous = current;
        this.savedViewSaving = true;
        Store.savedViews.set(next);
        try {
            const persisted = await saveSavedViews(next);
            Store.savedViews.set(Array.isArray(persisted) ? persisted : next);
            Events.toast.emit({ variant: 'positive', content: 'View saved' });
            this.closeSavedViewDialog();
        } catch (e) {
            console.error('Failed to save view', e);
            Store.savedViews.set(previous);
            this.savedViewSaving = false;
            Events.toast.emit({ variant: 'negative', content: 'Could not save view. Try again.' });
        }
    }

    applySavedView(id) {
        const view = (Store.savedViews.value || []).find((v) => v.id === id);
        if (!view || !view.payload) return;
        const { payload } = view;

        Store.search.set((prev) => ({
            ...prev,
            region: undefined,
            path: payload.searchPath || '',
        }));
        Store.filters.set(() => ({
            locale: payload.filters?.locale || 'en_US',
            tags: payload.filters?.tags,
            personalizationFilterEnabled: !!payload.filters?.personalizationFilterEnabled,
        }));
        if (payload.sort) {
            Store.sort.set({
                sortBy: payload.sort.sortBy,
                sortDirection: payload.sort.sortDirection,
            });
        }
        Store.createdByUsers.set(Array.isArray(payload.createdByUsers) ? payload.createdByUsers : []);

        // Missing-folder warning
        const folders = Store.folders.data.value || [];
        if (
            payload.searchPath &&
            Store.folders.loaded.value &&
            !folders.includes(payload.searchPath)
        ) {
            Events.toast.emit({
                variant: 'negative',
                content: `Saved folder path not found: ${payload.searchPath}`,
            });
        }

        // Hash length warning (debounced writer runs at ~50ms).
        setTimeout(() => {
            if ((window.location.hash || '').length > SHAREABLE_HASH_LIMIT) {
                Events.toast.emit({
                    variant: 'info',
                    content: 'View applied, but the URL is too long to share.',
                });
            }
        }, 100);
    }

    async handleDeleteSavedView(event, view) {
        event.stopPropagation();
        event.preventDefault();
        const confirmed = window.confirm(`Delete saved view "${view.name}"?`);
        if (!confirmed) return;
        const current = Store.savedViews.value || [];
        const next = current.filter((v) => v.id !== view.id);
        Store.savedViews.set(next);
        try {
            const persisted = await saveSavedViews(next);
            Store.savedViews.set(Array.isArray(persisted) ? persisted : next);
        } catch (e) {
            console.error('Failed to delete view', e);
            Store.savedViews.set(current);
            Events.toast.emit({ variant: 'negative', content: 'Could not delete view. Try again.' });
        }
    }

    get savedViewDialog() {
        if (!this.savedViewDialogOpen) return nothing;
        return html`<div class="saved-view-dialog-backdrop" @click=${(e) => {
            if (e.target === e.currentTarget && !this.savedViewSaving) this.closeSavedViewDialog();
        }}>
            <div class="saved-view-dialog" @click=${(e) => e.stopPropagation()}>
                <div class="saved-view-dialog-header">Save current view</div>
                <sp-field-label for="saved-view-name">View name</sp-field-label>
                <sp-textfield
                    id="saved-view-name"
                    placeholder="e.g. ACOM FR plans"
                    maxlength="${MAX_VIEW_NAME_LENGTH}"
                    value=${this.savedViewNameDraft}
                    ?disabled=${this.savedViewSaving}
                    @input=${(e) => {
                        this.savedViewNameDraft = e.target.value;
                        this.savedViewNameError = '';
                    }}
                    @keydown=${(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.handleSaveSavedViewConfirm();
                        }
                    }}
                ></sp-textfield>
                ${this.savedViewNameError
                    ? html`<div class="saved-view-name-error">${this.savedViewNameError}</div>`
                    : nothing}
                <div class="saved-view-dialog-footer">
                    <sp-button
                        variant="secondary"
                        ?disabled=${this.savedViewSaving}
                        @click=${() => this.closeSavedViewDialog()}
                    >
                        Cancel
                    </sp-button>
                    <sp-button
                        variant="accent"
                        ?disabled=${this.savedViewSaving}
                        @click=${() => this.handleSaveSavedViewConfirm()}
                    >
                        Save
                    </sp-button>
                </div>
            </div>
        </div>`;
    }

    get createButton() {
        return html`<overlay-trigger id="trigger" placement="bottom" offset="6">
            <sp-button variant="accent" slot="trigger">
                <sp-icon-add slot="icon"></sp-icon-add>
                Create
            </sp-button>
            <sp-popover slot="click-content" direction="bottom" tip>
                <sp-menu>
                    ${contentTypes.map(
                        ({ value, label }) => html`
                            <sp-menu-item @click=${() => this.selectContentType(value)}>
                                ${label}
                                <sp-icon-add slot="icon"></sp-icon-add>
                            </sp-menu-item>
                        `,
                    )}
                </sp-menu>
            </sp-popover>
        </overlay-trigger> `;
    }

    get contentManagementControls() {
        if (this.selecting.value) return nothing;
        return html`<div id="write">
            ${this.createButton}
            <sp-button @click=${() => Store.selecting.set(true)}>
                <sp-icon-select-multi slot="icon"></sp-icon-select-multi>
                Select
            </sp-button>
            <sp-action-menu
                selects="single"
                value="${this.renderMode.value}"
                placement="bottom"
                @change=${this.handleRenderModeChange}
            >
                ${renderModes.map(
                    ({ value, label, icon }) => html`<sp-menu-item value="${value}">${icon} ${label}</sp-menu-item>`,
                )}
            </sp-action-menu>
        </div>`;
    }

    get filtersPanel() {
        return html`<mas-filter-panel></mas-filter-panel>`;
    }

    get searchResultsLabel() {
        if (this.loading.value || !this.search.value.query) return nothing;
        return html`<span id="search-results-label">Search results for "${this.search.value.query}"</span>`;
    }

    handleSelectionPanelClose() {
        Store.selecting.set(false);
    }

    handleCopyToFolder(fragmentOrSelection) {
        const item = Array.isArray(fragmentOrSelection) ? fragmentOrSelection[0] : fragmentOrSelection;

        if (!item) return;

        const fragment = item?.id
            ? item
            : Store.fragments.list.data
                  .get()
                  .find((store) => store.get().id === item)
                  ?.get();

        if (!fragment) {
            console.error('Could not find fragment:', item);
            return;
        }

        this.fragmentToCopy = fragment;
        this.copyDialogOpen = true;
    }

    handleFragmentCopied() {
        this.copyDialogOpen = false;
        this.fragmentToCopy = null;
        Store.selection.set([]);
        Store.selecting.set(false);
    }

    render() {
        return html`<div id="toolbar">
                <div id="actions">${this.searchAndFilterControls} ${this.contentManagementControls} ${this.selectionPanel}</div>
                ${this.filtersPanel}${this.searchResultsLabel}
            </div>
            <mas-selection-panel
                ?open=${this.selecting.value}
                .selectionStore=${Store.selection}
                .repository=${this.repository}
                .onCopyToFolder=${this.handleCopyToFolder}
                @close=${this.handleSelectionPanelClose}
            ></mas-selection-panel>
            ${this.createDialogOpen
                ? html`<mas-create-dialog
                      type=${this.selectedContentType}
                      @close=${() => (this.createDialogOpen = false)}
                  ></mas-create-dialog>`
                : nothing}
            ${this.copyDialogOpen && this.fragmentToCopy
                ? html`<mas-copy-dialog
                      .fragment=${this.fragmentToCopy}
                      @fragment-copied=${this.handleFragmentCopied}
                      @cancel=${() => {
                          this.copyDialogOpen = false;
                          this.fragmentToCopy = null;
                      }}
                  ></mas-copy-dialog>`
                : nothing}
            ${this.savedViewDialog}`;
    }
}

customElements.define('mas-toolbar', MasToolbar);
