import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { elementUpdated } from '@open-wc/testing-helpers';

// Import Store first - component imports it directly
import Store from '../../src/store.js';
import Events from '../../src/events.js';
// Import the component being tested
import '../../src/placeholders/mas-placeholders.js';
// Import necessary dependencies potentially used by the component or tests
import '../../src/mas-repository.js';
import '../../src/rte/rte-field.js';
import '../../src/mas-fragment-status.js';
import { PAGE_NAMES } from '../../src/constants.js';

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
    });

    describe('mas-placeholders copy code', () => {
        let element;
        let writeStub;
        let toastStub;

        const readBlobs = async () => {
            const [item] = writeStub.firstCall.args[0];
            const plain = await (await item.getType('text/plain')).text();
            const htmlText = await (await item.getType('text/html')).text();
            return { plain, htmlText };
        };

        beforeEach(async () => {
            Store.search.set({ path: 'test-folder' });
            Store.filters.set({ locale: 'en_US' });
            Store.placeholders.list.data.set(['alpha', 'beta'].map((key) => ({ get: () => ({ key }) })));
            writeStub = sinon.stub(navigator.clipboard, 'write').resolves();
            toastStub = sinon.stub(Events.toast, 'emit');
            element = document.createElement('mas-placeholders');
        });

        afterEach(() => sinon.restore());

        it('copies one deep link and shows a positive toast', async () => {
            await element.handleCopyPlaceholderUrls(['alpha']);
            const { plain } = await readBlobs();
            expect(plain).to.match(/#content-type=placeholder&page=placeholders&path=test-folder&locale=en_US&search=alpha$/);
            expect(toastStub.calledWithMatch({ variant: 'positive' })).to.be.true;
        });

        it('copies newline-separated links for multiple selections', async () => {
            await element.handleCopyPlaceholderUrls(['alpha', 'beta']);
            const { plain, htmlText } = await readBlobs();
            expect(plain.split('\n')).to.have.length(2);
            expect(htmlText.split('<br>')).to.have.length(2);
        });

        it('emits a negative toast when the clipboard write fails', async () => {
            writeStub.rejects(new Error('denied'));
            await element.handleCopyPlaceholderUrls(['alpha']);
            expect(toastStub.calledWithMatch({ variant: 'negative' })).to.be.true;
            expect(toastStub.calledWithMatch({ variant: 'positive' })).to.be.false;
        });

        it('skips keys that are not in the list', async () => {
            await element.handleCopyPlaceholderUrls(['missing', 'beta']);
            const { plain } = await readBlobs();
            expect(plain.split('\n')).to.have.length(1);
            expect(plain).to.include('search=beta');

            writeStub.resetHistory();
            await element.handleCopyPlaceholderUrls(['missing']);
            expect(writeStub.called).to.be.false;
        });
    });
});
