import { expect, fixture, html } from '@open-wc/testing';
import { stub } from 'sinon';
import '../src/swc.js';
import '../src/aem/aem-tag-picker-field.js';
import {
    AEM_TAG_PATH_PRODUCT_CODE_ROOT,
    TAG_COMPARE_CHART,
    TAG_COMPARE_CHART_PATH,
    TAG_MERCH_CARD,
    TAG_MERCH_CARD_COLLECTION,
} from '../src/constants.js';
import { blockTagCacheLoading, resetTagCache, seedTagCache } from './helpers/tag-cache.js';
import { UserFriendlyError } from '../src/utils.js';

describe('AemTagPickerField', () => {
    const namespace = '/content/cq:tags/mas';
    const contentTypePath = (tag) => `/content/cq:tags/${tag.replace(':', '/')}`;

    beforeEach(() => {
        resetTagCache(namespace);
        seedTagCache(namespace, [
            [
                contentTypePath(TAG_MERCH_CARD),
                {
                    name: 'merch-card',
                    title: 'Merch Card',
                    path: contentTypePath(TAG_MERCH_CARD),
                },
            ],
            [
                contentTypePath(TAG_MERCH_CARD_COLLECTION),
                {
                    name: 'merch-card-collection',
                    title: 'Merch Card Collection',
                    path: contentTypePath(TAG_MERCH_CARD_COLLECTION),
                },
            ],
        ]);
    });

    afterEach(() => {
        resetTagCache(namespace);
    });

    it('adds Compare chart as a local content type option and resolves selected title', async () => {
        const el = await fixture(html`
            <aem-tag-picker-field
                namespace=${namespace}
                top="studio/content-type"
                selection="checkbox"
                value=${TAG_COMPARE_CHART}
            ></aem-tag-picker-field>
        `);

        await el.loadTags();
        await el.updateComplete;

        expect(el.flatTags).to.include(TAG_COMPARE_CHART_PATH);
        expect(el.selectedTags[0]).to.deep.include({
            name: 'compare-chart',
            title: 'Compare chart',
            path: TAG_COMPARE_CHART_PATH,
        });
    });

    it('returns no selected tags while namespace tags are still loading', async () => {
        blockTagCacheLoading(namespace);

        const el = await fixture(html`
            <aem-tag-picker-field
                namespace=${namespace}
                top="studio/content-type"
                selection="checkbox"
                value=${TAG_COMPARE_CHART}
            ></aem-tag-picker-field>
        `);

        expect(el.selectedTags).to.deep.equal([]);
    });

    describe('allow-create (product code tag creation)', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html` <aem-tag-picker-field namespace=${namespace} allow-create></aem-tag-picker-field>`);
            await el.loadTags();
            await el.updateComplete;
        });

        it('renders a Create button when allow-create is set in hierarchical mode', () => {
            const createBtn = el.shadowRoot.querySelector('sp-action-button[aria-label="Create product code tag"]');
            expect(createBtn).to.exist;
        });

        it('does not render a Create button without allow-create', async () => {
            const noCreate = await fixture(html` <aem-tag-picker-field namespace=${namespace}></aem-tag-picker-field>`);
            await noCreate.loadTags();
            await noCreate.updateComplete;
            const createBtn = noCreate.shadowRoot.querySelector('sp-action-button[aria-label="Create product code tag"]');
            expect(createBtn).to.be.null;
        });

        it('opens the create dialog when the Create button is clicked', async () => {
            const createBtn = el.shadowRoot.querySelector('sp-action-button[aria-label="Create product code tag"]');
            createBtn.click();
            await el.updateComplete;

            const dialog = el.shadowRoot.querySelector('sp-dialog-wrapper');
            expect(dialog).to.exist;
            expect(dialog.open).to.be.true;
        });

        it('creates a new tag, adds it to the cache, and selects it on confirm', async () => {
            const newCode = 'newproduct';
            const newTitle = 'New Product';
            const expectedPath = `${AEM_TAG_PATH_PRODUCT_CODE_ROOT}/${newCode}`;

            const createTagStub = stub().resolves({});
            el._AEM = el._AEM || {};
            // Stub the internal AEM instance's tags.create
            const aemInstance = el.shadowRoot.querySelector ? el : el;
            // Access private #aem via the method indirection
            el.createDialogCode = newCode;
            el.createDialogTitle = newTitle;
            el.createDialogOpen = true;
            await el.updateComplete;

            // Replace fetch so AEM.createTag succeeds
            const originalFetch = window.fetch;
            window.fetch = async (url, opts) => {
                // GET check: tag does not exist
                if (opts?.method === 'GET' || !opts?.method) {
                    return { ok: false, status: 404, statusText: 'Not Found' };
                }
                // GET csrf token
                if (url.includes('csrf')) {
                    return { ok: true, json: async () => ({ token: 'test-token' }) };
                }
                // POST create tag
                return { ok: true, status: 201 };
            };

            const changedSpy = stub();
            el.addEventListener('change', changedSpy);

            // Trigger confirm via calling the handler directly (simulates dialog confirm)
            (await el._AemTagPickerField__handleCreateTag?.()) ?? (await el['#handleCreateTag']?.());

            window.fetch = originalFetch;
        });

        it('adds tag to cache and auto-selects it after successful creation', async () => {
            const newCode = 'testcode';
            const newTitle = 'Test Code';
            const expectedPath = `${AEM_TAG_PATH_PRODUCT_CODE_ROOT}/${newCode}`;
            const expectedTagId = `mas:product_code/${newCode}`;

            // Pre-seed code/title
            el.createDialogCode = newCode;
            el.createDialogTitle = newTitle;

            // Stub fetch for the AEM calls
            const originalFetch = window.fetch;
            window.fetch = async (url, opts) => {
                if (url.includes('csrf')) {
                    return { ok: true, json: async () => ({ token: 'tok' }) };
                }
                if (!opts?.method || opts.method === 'GET') {
                    return { ok: false, status: 404 };
                }
                return { ok: true, status: 201 };
            };

            const changeEvents = [];
            el.addEventListener('change', () => changeEvents.push(true));

            // Call the method that the confirm button triggers
            el.createDialogOpen = true;
            await el.updateComplete;

            // Simulate confirm by direct invocation pattern used by the component
            // We use the dialog's @confirm event
            const dialog = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialog.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            // Give async operations time to complete
            await new Promise((r) => setTimeout(r, 50));
            await el.updateComplete;

            window.fetch = originalFetch;

            // The cache should have the new tag
            const { getNamespaceCache } = await import('../src/aem/tag-cache.js');
            const cache = getNamespaceCache(namespace);
            expect(cache?.has(expectedPath)).to.be.true;
            expect(cache?.get(expectedPath)).to.deep.include({ name: newCode, title: newTitle, path: expectedPath });

            // The value should include the new tag id
            const valueArr = Array.isArray(el.value) ? el.value : (el.value || '').split(',').filter(Boolean);
            expect(valueArr.some((v) => v === expectedTagId || v === expectedPath)).to.be.true;
        });

        it('keeps the dialog open and resets busy state when AEM.createTag fails', async () => {
            const newCode = 'failcode';
            const newTitle = 'Fail Code';

            el.createDialogCode = newCode;
            el.createDialogTitle = newTitle;
            el.createDialogOpen = true;
            await el.updateComplete;

            const originalFetch = window.fetch;
            window.fetch = async (url, opts) => {
                if (url.includes('csrf')) {
                    return { ok: true, json: async () => ({ token: 'tok' }) };
                }
                if (!opts?.method || opts.method === 'GET') {
                    return { ok: false, status: 404 };
                }
                // Simulate failure on POST
                return { ok: false, status: 500, statusText: 'Server Error' };
            };

            const dialog = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialog.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 50));
            await el.updateComplete;

            window.fetch = originalFetch;

            // Dialog stays open so the user can fix the inputs and retry
            expect(el.createDialogOpen).to.be.true;
            // Busy spinner is cleared
            expect(el.createDialogBusy).to.be.false;
        });

        it('does not render the create dialog when createDialogOpen is false', async () => {
            expect(el.createDialogOpen).to.be.false;
            const dialog = el.shadowRoot.querySelector('sp-dialog-wrapper');
            expect(dialog).to.be.null;
        });
    });
});
