import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Promotion } from '../../src/aem/promotion.js';
import '../../src/swc.js';
import MasPromotions from '../../src/promotions/mas-promotions.js';

function isoDaysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function makePromotionStore({ title, status = 'PUBLISHED', startDate, endDate }) {
    const fragmentData = {
        id: title,
        title,
        path: `/content/dam/mas/promotions/${title.toLowerCase().replace(/\s+/g, '-')}`,
        status,
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'promoCode', type: 'text', values: [''] },
            { name: 'startDate', values: [startDate] },
            { name: 'endDate', values: [endDate] },
            { name: 'tags', values: [] },
            { name: 'surfaces', type: 'text', values: [] },
        ],
        tags: [],
        etag: '"etag"',
    };
    return new FragmentStore(new Promotion(fragmentData));
}

function makePromotionFixtures() {
    return [
        // active: published, within date range
        makePromotionStore({ title: 'Summer Sale', startDate: isoDaysFromNow(-1), endDate: isoDaysFromNow(1) }),
        makePromotionStore({ title: 'Summer Clearance', startDate: isoDaysFromNow(-1), endDate: isoDaysFromNow(1) }),
        // draft: unpublished
        makePromotionStore({
            title: 'Winter Draft',
            status: 'DRAFT',
            startDate: isoDaysFromNow(-1),
            endDate: isoDaysFromNow(1),
        }),
        // scheduled: published, start date in the future
        makePromotionStore({ title: 'Spring Launch', startDate: isoDaysFromNow(1), endDate: isoDaysFromNow(7) }),
        // expired: end date in the past
        makePromotionStore({ title: 'Old Deal', startDate: isoDaysFromNow(-7), endDate: isoDaysFromNow(-1) }),
    ];
}

async function flushPromises() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

function dispatchSearchInput(el, value) {
    const search = el.renderRoot.querySelector('sp-search');
    search.value = value;
    search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function clickStatusTile(el, filterValue) {
    el.renderRoot.querySelector(`.status-tile[data-filter="${filterValue}"]`).click();
}

function tableRowIds(el) {
    return [...el.renderRoot.querySelectorAll('sp-table-row')].map((row) => row.dataset.id);
}

describe('MasPromotions', () => {
    let sandbox;
    let originalFilter;
    let originalData;
    let originalLoading;
    let elements;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalFilter = Store.promotions.list.filter.get();
        originalData = Store.promotions.list.data.get();
        originalLoading = Store.promotions.list.loading.get();
        elements = [];
    });

    afterEach(() => {
        for (const el of elements) el.remove();
        sandbox.restore();
        Store.promotions.list.filter.set(originalFilter);
        Store.promotions.list.data.set(originalData);
        Store.promotions.list.loading.set(originalLoading);
    });

    /** Mounts a MasPromotions element whose repository resolves the given promotions once `loadGate` resolves. */
    function mount(promotions, loadGate = Promise.resolve()) {
        const fakeRepository = {
            loadPromotions: sandbox.stub().callsFake(async () => {
                await loadGate;
                Store.promotions.list.data.set(promotions);
                Store.promotions.list.loading.set(false);
            }),
        };
        const el = new MasPromotions();
        sandbox.stub(el, 'repository').get(() => fakeRepository);
        elements.push(el);
        document.body.appendChild(el);
        return el;
    }

    async function mountLoaded(promotions) {
        const el = mount(promotions);
        await flushPromises();
        await el.updateComplete;
        return el;
    }

    it('disables the search field until promo projects load, then enables it', async () => {
        let resolveLoad;
        const loadGate = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const el = mount(makePromotionFixtures(), loadGate);
        await el.updateComplete;

        expect(el.renderRoot.querySelector('sp-search').disabled).to.be.true;

        resolveLoad();
        await flushPromises();
        await el.updateComplete;

        expect(el.renderRoot.querySelector('sp-search').disabled).to.be.false;
    });

    it('live-filters rendered rows on every input event, without changing the store filter', async () => {
        const el = await mountLoaded(makePromotionFixtures());

        expect(Store.promotions.list.filter.get()).to.equal('active');
        expect(tableRowIds(el)).to.have.members(['Summer Sale', 'Summer Clearance']);

        dispatchSearchInput(el, 'sale');
        await el.updateComplete;

        expect(tableRowIds(el)).to.deep.equal(['Summer Sale']);
        expect(Store.promotions.list.filter.get()).to.equal('active');
    });

    it('keeps the search term across filter changes and narrows each filter by it, regardless of order', async () => {
        const el = await mountLoaded(makePromotionFixtures());

        // Order A: search first, then switch filter.
        dispatchSearchInput(el, 'summer');
        await el.updateComplete;
        clickStatusTile(el, 'all');
        await el.updateComplete;
        const rowsSearchThenFilter = tableRowIds(el);

        // Reset back to the starting point.
        clickStatusTile(el, 'active');
        dispatchSearchInput(el, '');
        await el.updateComplete;

        // Order B: switch filter first, then search.
        clickStatusTile(el, 'all');
        await el.updateComplete;
        dispatchSearchInput(el, 'summer');
        await el.updateComplete;
        const rowsFilterThenSearch = tableRowIds(el);

        expect(rowsSearchThenFilter).to.have.members(['Summer Sale', 'Summer Clearance']);
        expect(rowsFilterThenSearch).to.have.members(['Summer Sale', 'Summer Clearance']);
        expect(el.searchTerm).to.equal('summer');
        expect(Store.promotions.list.filter.get()).to.equal('all');
    });

    it('keeps status tile counts at the full-list totals while a search term is entered', async () => {
        const el = await mountLoaded(makePromotionFixtures());
        const countFor = (value) =>
            el.renderRoot.querySelector(`.status-tile[data-filter="${value}"] .status-tile-count`).textContent.trim();

        expect(countFor('all')).to.equal('5');
        expect(countFor('active')).to.equal('2');
        expect(countFor('draft')).to.equal('1');
        expect(countFor('scheduled')).to.equal('1');
        expect(countFor('expired')).to.equal('1');
        expect(countFor('archived')).to.equal('0');

        dispatchSearchInput(el, 'summer');
        await el.updateComplete;

        expect(countFor('all')).to.equal('5');
        expect(countFor('active')).to.equal('2');
        expect(countFor('draft')).to.equal('1');
        expect(countFor('scheduled')).to.equal('1');
        expect(countFor('expired')).to.equal('1');
        expect(countFor('archived')).to.equal('0');
    });

    it('restores the full filtered list when the term is cleared, and shows the empty state when nothing matches', async () => {
        const el = await mountLoaded(makePromotionFixtures());

        dispatchSearchInput(el, 'no-such-promotion');
        await el.updateComplete;

        expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(0);
        expect(el.renderRoot.querySelector('.no-promotions-message p').textContent.trim()).to.equal('No promotions found.');

        dispatchSearchInput(el, '');
        await el.updateComplete;

        expect(tableRowIds(el)).to.have.members(['Summer Sale', 'Summer Clearance']);
    });
});
