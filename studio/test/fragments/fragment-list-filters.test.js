import { expect } from '@esm-bundle/chai';
import { PAGE_NAMES } from '../../src/constants.js';
import { applyFragmentListFilters } from '../../src/fragments/fragment-list-filters.js';
import { VARIATION_FILTER_VALUES } from '../../src/fragments/variation-filter.js';

describe('fragment-list-filters', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    it('excludes promo variation fragments on CONTENT page', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
            makeStore({
                path: '/content/dam/mas/acom/en_US/card',
                tags: [],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.CONTENT,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get().path).to.include('/card');
    });

    it('does not filter promo variations on non-CONTENT pages', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.PROMOTIONS,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
    });

    it('does not filter promo variations on PROMOTIONS_EDITOR page (Select items picker)', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.PROMOTIONS_EDITOR,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
    });

    describe('variation filter (Has variation?)', () => {
        const noVariations = makeStore({ path: '/content/dam/mas/acom/en_US/card-a', tags: [], variations: [] });
        const withPromo = makeStore({
            path: '/content/dam/mas/acom/en_US/card-b',
            tags: [],
            variations: ['/content/dam/mas/acom/en_US/promotions/sale/card-b'],
        });
        const withGrouped = makeStore({
            path: '/content/dam/mas/acom/en_US/card-c',
            tags: [],
            variations: ['/content/dam/mas/acom/en_US/pzn/card-c'],
        });
        const stores = [noVariations, withPromo, withGrouped];

        it('returns all stores when unfiltered (omitted or empty variationFilter)', () => {
            const filtered = applyFragmentListFilters(stores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
            });
            expect(filtered).to.have.lengthOf(3);
        });

        it('HAS_PROMO returns only stores with a promo variation', () => {
            const filtered = applyFragmentListFilters(stores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER_VALUES.HAS_PROMO,
            });
            expect(filtered).to.deep.equal([withPromo]);
        });

        it('HAS_GROUPED returns only stores with a grouped variation', () => {
            const filtered = applyFragmentListFilters(stores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER_VALUES.HAS_GROUPED,
            });
            expect(filtered).to.deep.equal([withGrouped]);
        });

        it('NO_VARIATIONS returns only stores with no variations', () => {
            const filtered = applyFragmentListFilters(stores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER_VALUES.NO_VARIATIONS,
            });
            expect(filtered).to.deep.equal([noVariations]);
        });

        it('composes with the CONTENT-page promo exclusion', () => {
            const promoFragment = makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
                variations: ['/content/dam/mas/acom/en_US/pzn/card-c'],
            });
            const filtered = applyFragmentListFilters([promoFragment], {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER_VALUES.HAS_GROUPED,
            });
            expect(filtered).to.have.lengthOf(0);
        });

        it('composes with the personalization filter', () => {
            const personalizedFragment = makeStore({
                path: '/content/dam/mas/acom/en_US/card-d',
                tags: [{ id: 'mas:pzn/segment-x' }],
                variations: [],
            });
            const filtered = applyFragmentListFilters([personalizedFragment], {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER_VALUES.NO_VARIATIONS,
            });
            expect(filtered).to.have.lengthOf(0);
        });
    });
});
