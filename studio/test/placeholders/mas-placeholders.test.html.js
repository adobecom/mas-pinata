import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { elementUpdated } from '@open-wc/testing-helpers';

// Import Store first - component imports it directly
import Store from '../../src/store.js';
// Import the component being tested
import '../../src/placeholders/mas-placeholders.js';
// Import necessary dependencies potentially used by the component or tests
import '../../src/mas-repository.js';
import '../../src/rte/rte-field.js';
import '../../src/mas-fragment-status.js';
import { PAGE_NAMES } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Placeholder } from '../../src/aem/placeholder.js';
import Events from '../../src/events.js';

function makePlaceholderStore({ key, path, value = 'Some value' }) {
    return new FragmentStore(
        new Placeholder({
            id: key,
            path,
            status: 'DRAFT',
            fields: [
                { name: 'key', values: [key] },
                { name: 'value', values: [value] },
                { name: 'richTextValue', values: [] },
            ],
            modified: { by: 'tester', at: Date.now() },
        }),
    );
}

runTests(async () => {
    describe('mas-placeholders component - UI Tests', () => {
        let element;
        let fetchStub;
        let parent;

        beforeEach(async function () {
            // Ensure clean DOM
            const existing = document.body.querySelector('mas-placeholders');
            if (existing) existing.remove();
            const repoExisting = document.body.querySelector('mas-repository');
            if (repoExisting) repoExisting.remove();

            // Mock fetch used by dependencies with realistic responses
            fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
                const urlStr = typeof url === 'string' ? url : '';
                // AEM QueryBuilder call used by listFolders
                if (urlStr.includes('/bin/querybuilder.json') && urlStr.includes('type=sling:Folder')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            hits: [
                                { name: 'images', title: 'Images' },
                                { name: 'test-folder', title: 'Test Folder' },
                            ],
                        }),
                        text: async () => '',
                    });
                }
                // CSRF token endpoint (in case code touches it)
                if (urlStr.includes('/libs/granite/csrf/token.json')) {
                    return Promise.resolve({ ok: true, json: async () => ({ token: 'fake-token' }), text: async () => '' });
                }
                // Default response for any other calls used in these UI tests
                return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '' });
            });
            // Keep repository search side effects out of this component-only suite.
            Store.profile.set(null);
            Store.search.set({ path: 'test-folder' });
            Store.filters.set({ locale: 'en_US' });
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
            Store.folders.data.set(['test-folder']);
            Store.folders.loaded.set(true);
            Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
            Store.placeholders.list.data.set([]);
            Store.placeholders.list.loading.set(false);
            Store.placeholders.selection.set([]);
            Store.placeholders.search.set('');
            Store.placeholders.index.set(null);

            // Create element manually for more control
            parent = document.createElement('div');
            element = document.createElement('mas-placeholders');
            parent.appendChild(element);
            document.body.appendChild(parent);
            await new Promise((r) => setTimeout(r, 10));
        });

        afterEach(function () {
            sinon.restore(); // Restore all stubs/spies
            parent?.remove();
        });

        // Basic render test
        it('should render correctly with initial data', async function () {
            expect(element).to.exist;
            expect(element.shadowRoot).to.exist;
        });

        it('should display skeleton rows when loading', async function () {
            Store.placeholders.list.loading.set(true);
            await elementUpdated(element);
            await new Promise((r) => setTimeout(r, 50));
            const skeletonRows = element.shadowRoot.querySelectorAll('.skeleton-row');
            expect(skeletonRows.length).to.be.greaterThan(0);

            Store.placeholders.list.loading.set(false);
            await elementUpdated(element);
            await new Promise((r) => setTimeout(r, 50));
            const skeletonAfter = element.shadowRoot.querySelectorAll('.skeleton-row');
            expect(skeletonAfter.length).to.equal(0);
        });

        // Error display test
        it('should display error message when error property is set', async function () {
            element.error = 'Test Error';
            await elementUpdated(element);
            // Check for error message
            const errorElement = element.shadowRoot.querySelector('.error-message');

            expect(errorElement).to.exist;
            expect(errorElement.textContent).to.include('Test Error');
        });

        // Test search functionality
        it('should update search query on input', async function () {
            // Find search input
            const searchInput = element.shadowRoot.querySelector('sp-search');
            // Set value and dispatch event
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await elementUpdated(element);

            // Check Store was updated
            expect(Store.placeholders.search.get()).to.equal('test');
        });

        // Save placeholder use case: open creation modal
        it('should open creation modal when Create New Placeholder is clicked', async function () {
            expect(element.shadowRoot.querySelector('mas-placeholders-creation-modal')).to.not.exist;

            const createButton = element.shadowRoot.querySelector('.create-button');
            expect(createButton).to.exist;
            createButton.click();
            await elementUpdated(element);

            const modal = element.shadowRoot.querySelector('mas-placeholders-creation-modal');
            expect(modal).to.exist;
        });

        // Save placeholder use case: onSave runs (clearCaches + refresh) when modal dispatches save
        it('should run onSave and refresh when modal dispatches save event', async function () {
            const refreshSpy = sinon.spy(element, 'refresh');

            const createButton = element.shadowRoot.querySelector('.create-button');
            createButton.click();
            await elementUpdated(element);

            const modal = element.shadowRoot.querySelector('mas-placeholders-creation-modal');
            expect(modal).to.exist;
            modal.dispatchEvent(new CustomEvent('save'));
            await elementUpdated(element);

            expect(refreshSpy.calledOnce).to.be.true;
        });

        // Save placeholder use case: onSave() clears caches and refreshes list
        it('should refresh when onSave is called', async function () {
            const refreshSpy = sinon.spy(element, 'refresh');
            element.onSave();
            await elementUpdated(element);
            expect(refreshSpy.calledOnce).to.be.true;
        });

        describe('Copy Code', () => {
            let clipboardStub;
            let toastStub;

            beforeEach(async function () {
                clipboardStub = { writeText: sinon.stub().resolves() };
                Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
                toastStub = sinon.stub(Events.toast, 'emit');

                // Keys are ordered so ascending key sort (this suite's default) matches insertion order.
                Store.placeholders.list.data.set([
                    makePlaceholderStore({
                        key: 'addon-demo-test-1',
                        path: '/content/dam/mas/sandbox/en_US/dictionary/addon-demo-test-1',
                    }),
                    makePlaceholderStore({
                        key: 'addon-demo-test-2',
                        path: '/content/dam/mas/sandbox/en_US/dictionary/addon-demo-test-2',
                    }),
                ]);
                await elementUpdated(element);
                await new Promise((r) => setTimeout(r, 10));
            });

            const expectedUrl = (key) =>
                `${window.location.origin}/studio.html#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=${key}`;

            it('copies the deep link and shows a toast when Copy Code is clicked on a row', async function () {
                const item = element.shadowRoot.querySelector('mas-placeholders-item');
                expect(item).to.exist;

                const menuButton = item.querySelector('.action-menu-button');
                menuButton.click();
                await elementUpdated(element);
                await elementUpdated(item);

                const copyItem = [...item.querySelectorAll('.dropdown-item')].find((el) =>
                    el.textContent.includes('Copy Code'),
                );
                expect(copyItem).to.exist;
                copyItem.click();
                await new Promise((r) => setTimeout(r, 10));

                expect(clipboardStub.writeText.calledOnceWith(expectedUrl('addon-demo-test-1'))).to.be.true;
                expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
                expect(toastStub.calledWith(sinon.match({ content: 'Link copied to clipboard.' }))).to.be.true;
            });

            it('leaves Publish and Delete menu items unchanged', async function () {
                const item = element.shadowRoot.querySelector('mas-placeholders-item');
                item.querySelector('.action-menu-button').click();
                await elementUpdated(element);
                await elementUpdated(item);

                const labels = [...item.querySelectorAll('.dropdown-item span')].map((el) => el.textContent);
                expect(labels).to.deep.equal(['Publish', 'Copy Code', 'Delete']);
            });

            it('copies one URL when bulk Copy Code runs with a single selection', async function () {
                await element.onBulkCopyCode(['addon-demo-test-1']);

                expect(clipboardStub.writeText.calledOnceWith(expectedUrl('addon-demo-test-1'))).to.be.true;
                expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
                expect(toastStub.calledWith(sinon.match({ content: '1 link copied to clipboard.' }))).to.be.true;
            });

            it('copies newline-separated URLs when bulk Copy Code runs with multiple selections', async function () {
                await element.onBulkCopyCode(['addon-demo-test-1', 'addon-demo-test-2']);

                const [copied] = clipboardStub.writeText.firstCall.args;
                const urls = copied.split('\n');
                expect(urls).to.have.length(2);
                expect(urls[0]).to.equal(expectedUrl('addon-demo-test-1'));
                expect(urls[1]).to.equal(expectedUrl('addon-demo-test-2'));
                expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
                expect(toastStub.calledWith(sinon.match({ content: '2 links copied to clipboard.' }))).to.be.true;
            });
        });
    });
});
