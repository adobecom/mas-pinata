import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions.js';

const DAY = 24 * 60 * 60 * 1000;

const createPromotion = ({ id, title, status = 'PUBLISHED', startDate, endDate }) => {
    const fields = [{ name: 'title', type: 'text', values: [title] }];
    if (startDate !== undefined) fields.push({ name: 'startDate', type: 'date-time', values: [startDate] });
    if (endDate !== undefined) fields.push({ name: 'endDate', type: 'date-time', values: [endDate] });
    const fragment = new Promotion({
        id,
        title,
        path: `/content/dam/mas/promotions/${id}`,
        status,
        created: { fullName: 'Test User' },
        fields,
        tags: [],
    });
    return new FragmentStore(fragment);
};

describe('MasPromotions search and filters', () => {
    const now = Date.now();
    let promotions;

    beforeEach(() => {
        promotions = [
            createPromotion({
                id: 'summer-active',
                title: 'Summer Sale',
                status: 'PUBLISHED',
                startDate: new Date(now - DAY).toISOString(),
                endDate: new Date(now + DAY).toISOString(),
            }),
            createPromotion({
                id: 'winter-active',
                title: 'Winter Sale',
                status: 'PUBLISHED',
                startDate: new Date(now - DAY).toISOString(),
                endDate: new Date(now + DAY).toISOString(),
            }),
            createPromotion({
                id: 'spring-draft',
                title: 'Spring Sale',
                status: 'DRAFT',
                startDate: new Date(now - DAY).toISOString(),
                endDate: new Date(now + DAY).toISOString(),
            }),
        ];
        Store.promotions.list.data.value = promotions;
        Store.promotions.list.loading.value = false;
        Store.promotions.list.data.setMeta('listFetched', true);
        Store.promotions.list.filter.value = 'active';
    });

    afterEach(() => {
        fixtureCleanup();
        Store.promotions.list.data.value = [];
        Store.promotions.list.loading.value = true;
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.filter.value = 'active';
    });

    it('disables the search field until promo projects have loaded', async () => {
        Store.promotions.list.loading.value = true;
        Store.promotions.list.data.removeMeta('listFetched');
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        const search = el.shadowRoot.querySelector('sp-search');
        expect(search.disabled).to.be.true;

        Store.promotions.list.data.setMeta('listFetched', true);
        Store.promotions.list.loading.set(false);
        await el.updateComplete;

        expect(search.disabled).to.be.false;
    });

    it('live-filters rendered rows as the user types, with no submit required', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'summer';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;

        const rows = el.shadowRoot.querySelectorAll('sp-table-row');
        expect(rows).to.have.lengthOf(1);
        expect(rows[0].textContent).to.include('Summer Sale');

        search.value = 'summer sale extra';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(0);
    });

    it('restores the full list for the current filter when the search term is cleared', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'summer';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(1);

        search.value = '';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);
    });

    it('keeps the search term and never touches Store.promotions.list.filter from the search handler', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'sale';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.promotions.list.filter.get()).to.equal('active');

        const allTile = el.shadowRoot.querySelector('[data-filter="all"]');
        allTile.click();
        await el.updateComplete;

        expect(el.searchTerm).to.equal('sale');
        expect(Store.promotions.list.filter.get()).to.equal('all');
        const rows = el.shadowRoot.querySelectorAll('sp-table-row');
        expect(rows).to.have.lengthOf(3);
    });

    it('keeps tile counts stable while a search term is active', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;

        const countsBefore = [...el.shadowRoot.querySelectorAll('.status-tile')].map((tile) => ({
            filter: tile.dataset.filter,
            count: tile.querySelector('.status-tile-count').textContent,
        }));

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'summer';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;

        const countsAfter = [...el.shadowRoot.querySelectorAll('.status-tile')].map((tile) => ({
            filter: tile.dataset.filter,
            count: tile.querySelector('.status-tile-count').textContent,
        }));

        expect(countsAfter).to.deep.equal(countsBefore);
        const allCount = countsBefore.find((c) => c.filter === 'all').count;
        expect(allCount).to.equal('3');
        const activeCount = countsBefore.find((c) => c.filter === 'active').count;
        expect(activeCount).to.equal('2');
    });

    it('shows a results count beside the search field matching the rendered rows', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.result-count-container').textContent).to.include('2 results');

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'winter';
        search.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.result-count-container').textContent).to.include('1 results');
    });
});
