import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import MasPromotions from '../../src/promotions/mas-promotions.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

function makePromotion({ id, title = '', status = 'PUBLISHED', startDate = '', endDate = '' } = {}) {
    const fragmentData = {
        id: id ?? `promo-${title || Math.random()}`,
        title,
        path: `/content/dam/mas/promotions/${id ?? title}`,
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'startDate', values: [startDate] },
            { name: 'endDate', values: [endDate] },
        ],
        tags: [],
        status,
    };
    return new FragmentStore(new Promotion(fragmentData));
}

const PAST = '2020-01-01T00:00:00.000Z';
const PAST_END = '2020-06-01T00:00:00.000Z';
const FUTURE = '2099-01-01T00:00:00.000Z';
const FUTURE_END = '2099-06-01T00:00:00.000Z';

describe('MasPromotions', () => {
    let sandbox;
    let originalData;
    let originalLoading;
    let originalFilter;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalData = Store.promotions.list.data.get();
        originalLoading = Store.promotions.list.loading.get();
        originalFilter = Store.promotions.list.filter.get();
    });

    afterEach(async () => {
        const elements = [...document.querySelectorAll('mas-promotions')];
        for (const el of elements) {
            el.remove();
            await el.updateComplete;
        }
        sandbox.restore();
        Store.promotions.list.data.set(originalData);
        Store.promotions.list.loading.set(originalLoading);
        Store.promotions.list.filter.set(originalFilter);
    });

    async function flushPromises() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    /** Mounts MasPromotions with a stubbed repository whose loadPromotions seeds the given data and clears loading. */
    async function mountPromotions(data, filter = 'all') {
        Store.promotions.list.filter.set(filter);
        const repo = {
            loadPromotions: sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set(data);
                Store.promotions.list.loading.set(false);
            }),
        };
        const el = new MasPromotions();
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        await flushPromises();
        await flushPromises();
        await el.updateComplete;
        return el;
    }

    function getSearchField(el) {
        return el.renderRoot.querySelector('sp-search');
    }

    function typeSearch(el, value) {
        const search = getSearchField(el);
        search.value = value;
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    function getTile(el, label) {
        return [...el.renderRoot.querySelectorAll('.promotions-status-tile')].find(
            (tile) => tile.querySelector('.promotions-status-tile-label').textContent.trim() === label,
        );
    }

    function getResultsText(el) {
        return el.renderRoot.querySelector('.promotions-search-help-text').textContent.trim();
    }

    describe('search field gating on load state', () => {
        it('disables search while promotions are loading and enables it once they load', async () => {
            Store.promotions.list.filter.set('all');
            Store.promotions.list.loading.set(true);
            let resolveLoad;
            const repo = {
                loadPromotions: sandbox.stub().callsFake(
                    () =>
                        new Promise((resolve) => {
                            resolveLoad = () => {
                                Store.promotions.list.data.set([makePromotion({ id: '1', title: 'Promo One' })]);
                                Store.promotions.list.loading.set(false);
                                resolve();
                            };
                        }),
                ),
            };
            const el = new MasPromotions();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;

            expect(getSearchField(el).hasAttribute('disabled')).to.be.true;

            resolveLoad();
            await flushPromises();
            await el.updateComplete;

            expect(getSearchField(el).hasAttribute('disabled')).to.be.false;
        });
    });

    describe('promotions list stays in sync with external store updates', () => {
        it('reflects data a concurrent store write adds after loadPromotions already resolved', async () => {
            Store.promotions.list.filter.set('all');
            const repo = {
                loadPromotions: sandbox.stub().callsFake(async () => {
                    // Simulates a load that was aborted by a concurrent reload (e.g. MasRepository's own
                    // debounced search) and resolved without writing fresh data to the store.
                    Store.promotions.list.loading.set(false);
                }),
            };
            const el = new MasPromotions();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;
            await flushPromises();
            await el.updateComplete;

            expect(el.renderRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(0);

            Store.promotions.list.data.set([makePromotion({ id: 'late', title: 'Late Arrival Promo' })]);
            await el.updateComplete;

            expect(el.renderRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(1);
        });
    });

    describe('live search', () => {
        it('narrows the rendered rows as the user types, without pressing Enter', async () => {
            const data = [
                makePromotion({ id: 'summer', title: 'Summer Launch Promo', startDate: PAST, endDate: FUTURE_END }),
                makePromotion({ id: 'winter', title: 'Winter Launch Promo', startDate: PAST, endDate: FUTURE_END }),
                makePromotion({ id: 'draft', title: 'Draft Project', status: 'DRAFT', startDate: PAST, endDate: FUTURE_END }),
            ];
            const el = await mountPromotions(data, 'all');

            typeSearch(el, 'summer');
            await el.updateComplete;

            expect(el.renderRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(1);
            expect(getResultsText(el)).to.equal('1 results');
            expect(el.filter).to.equal('all');
            expect(Store.promotions.list.filter.get()).to.equal('all');
        });

        it('never changes the selected status filter while typing', async () => {
            const data = [makePromotion({ id: 'a', title: 'Alpha', startDate: PAST, endDate: FUTURE_END })];
            const el = await mountPromotions(data, 'all');

            typeSearch(el, 'anything');
            await el.updateComplete;

            expect(el.filter).to.equal('all');
            expect(Store.promotions.list.filter.get()).to.equal('all');
        });
    });

    describe('search term persists across status filter changes', () => {
        it('keeps the typed term in the field and re-applies it to the newly selected filter', async () => {
            const data = [
                makePromotion({
                    id: 'summer-active',
                    title: 'Summer Launch Promo',
                    status: 'PUBLISHED',
                    startDate: PAST,
                    endDate: FUTURE_END,
                }),
                makePromotion({
                    id: 'winter-active',
                    title: 'Winter Launch Promo',
                    status: 'PUBLISHED',
                    startDate: PAST,
                    endDate: FUTURE_END,
                }),
                makePromotion({
                    id: 'draft-launch',
                    title: 'Draft Launch Promo',
                    status: 'DRAFT',
                    startDate: PAST,
                    endDate: FUTURE_END,
                }),
            ];
            const el = await mountPromotions(data, 'all');

            typeSearch(el, 'launch');
            await el.updateComplete;
            expect(el.renderRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(3);

            getTile(el, 'Active').dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await el.updateComplete;

            expect(getSearchField(el).value).to.equal('launch');
            expect(Store.promotions.list.filter.get()).to.equal('active');
            expect(el.renderRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);
        });
    });

    describe('status tile counts', () => {
        it('computes counts from the unfiltered list and keeps them stable while a term is typed', async () => {
            const data = [
                makePromotion({ id: 'd1', title: 'Draft Project', status: 'DRAFT', startDate: PAST, endDate: FUTURE_END }),
                makePromotion({
                    id: 'a1',
                    title: 'Summer Launch Promo',
                    status: 'PUBLISHED',
                    startDate: PAST,
                    endDate: FUTURE_END,
                }),
                makePromotion({
                    id: 'a2',
                    title: 'Winter Launch Promo',
                    status: 'PUBLISHED',
                    startDate: PAST,
                    endDate: FUTURE_END,
                }),
                makePromotion({
                    id: 's1',
                    title: 'Scheduled Launch Promo',
                    status: 'PUBLISHED',
                    startDate: FUTURE,
                    endDate: FUTURE_END,
                }),
                makePromotion({
                    id: 'e1',
                    title: 'Expired Launch Promo',
                    status: 'PUBLISHED',
                    startDate: PAST,
                    endDate: PAST_END,
                }),
            ];
            const el = await mountPromotions(data, 'all');

            expect(el.statusCounts).to.deep.equal({
                all: 5,
                draft: 1,
                active: 2,
                scheduled: 1,
                expired: 1,
                archived: 0,
            });

            typeSearch(el, 'summer');
            await el.updateComplete;

            expect(el.filteredPromotions).to.have.lengthOf(1);
            expect(el.statusCounts).to.deep.equal({
                all: 5,
                draft: 1,
                active: 2,
                scheduled: 1,
                expired: 1,
                archived: 0,
            });
        });
    });

    describe('name-only, case-insensitive matching', () => {
        it('matches a lowercase term against a mixed-case title', async () => {
            const data = [makePromotion({ id: 'promo-1', title: 'Summer Launch Promo', startDate: PAST, endDate: FUTURE_END })];
            const el = await mountPromotions(data, 'all');

            typeSearch(el, 'summer');
            await el.updateComplete;

            expect(el.filteredPromotions).to.have.lengthOf(1);
        });

        it('does not match a term equal to a project id', async () => {
            const data = [makePromotion({ id: 'promo-1', title: 'Summer Launch Promo', startDate: PAST, endDate: FUTURE_END })];
            const el = await mountPromotions(data, 'all');

            typeSearch(el, 'promo-1');
            await el.updateComplete;

            expect(el.filteredPromotions).to.have.lengthOf(0);
        });
    });
});
