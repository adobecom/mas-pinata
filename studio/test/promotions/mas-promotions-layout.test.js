import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions.js';

const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
];

describe('MasPromotions layout', () => {
    let sandbox;
    let originalFilter;
    let originalFilterOptions;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalFilter = Store.promotions.list.filter.get();
        originalFilterOptions = Store.promotions.list.filterOptions.get();
        Store.promotions.list.filter.set('active');
        Store.promotions.list.filterOptions.set(FILTER_OPTIONS);

        const repository = {
            loadPromotions: sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([]);
                Store.promotions.list.loading.set(false);
            }),
        };
        sandbox.stub(customElements.get('mas-promotions').prototype, 'repository').get(() => repository);
    });

    afterEach(() => {
        fixtureCleanup();
        Store.promotions.list.filter.set(originalFilter);
        Store.promotions.list.filterOptions.set(originalFilterOptions);
        sandbox.restore();
    });

    async function renderPromotions() {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        return el;
    }

    it('places the filter area below the Search field', async () => {
        const { shadowRoot } = await renderPromotions();
        const header = shadowRoot.querySelector('.promotions-header');
        const filters = shadowRoot.querySelector('.promotions-filters-container');
        const search = shadowRoot.querySelector('sp-search');

        expect(header.contains(search)).to.be.true;
        expect(header.contains(filters)).to.be.false;
        expect(header.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
        expect(filters.getBoundingClientRect().top).to.be.at.least(search.getBoundingClientRect().bottom);
    });

    it('removes the filter icon and "Filters:" label', async () => {
        const { shadowRoot } = await renderPromotions();

        expect(shadowRoot.querySelector('sp-icon-filter')).to.be.null;
        expect(shadowRoot.querySelector('.filters-container')).to.be.null;
        expect(shadowRoot.textContent).to.not.include('Filters:');
    });

    it('applies the container and picker styles', async () => {
        const { shadowRoot } = await renderPromotions();
        const container = getComputedStyle(shadowRoot.querySelector('.promotions-filters-container'));
        const picker = getComputedStyle(shadowRoot.querySelector('.promotions-filter-picker'));

        expect(container.display).to.equal('flex');
        expect(container.flexDirection).to.equal('column');
        expect(container.alignItems).to.equal('flex-start');
        expect(container.gap).to.equal('12px');

        expect(picker.display).to.equal('flex');
        expect(picker.height).to.equal('32px');
        expect(picker.paddingLeft).to.equal('12px');
        expect(picker.paddingRight).to.equal('11px');
        expect(picker.borderTopWidth).to.equal('2px');
        expect(picker.borderTopColor).to.equal('rgb(218, 218, 218)');
        expect(picker.borderTopLeftRadius).to.equal('8px');
    });

    it('wraps the status filter control in the picker', async () => {
        const { shadowRoot } = await renderPromotions();
        const picker = shadowRoot.querySelector('.promotions-filters-container > .promotions-filter-picker');

        expect(picker.querySelectorAll('sp-action-group sp-action-button')).to.have.length(FILTER_OPTIONS.length);
    });

    it('renders the result count on its own row after the filter area', async () => {
        const { shadowRoot } = await renderPromotions();
        const filters = shadowRoot.querySelector('.promotions-filters-container');
        const count = shadowRoot.querySelector('.result-count-container');

        expect(filters.contains(count)).to.be.false;
        expect(filters.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
        expect(count.nextElementSibling.classList.contains('promotions-content')).to.be.true;
        expect(count.textContent.trim()).to.equal('0 results');
    });

    it('still updates the status filter on click', async () => {
        const { shadowRoot } = await renderPromotions();
        const buttons = shadowRoot.querySelectorAll('.promotions-filter-picker sp-action-button');

        buttons[0].click();

        expect(Store.promotions.list.filter.get()).to.equal(FILTER_OPTIONS[0].value);
    });
});
