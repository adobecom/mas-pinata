import { expect } from '@esm-bundle/chai';
import { PAGE_NAMES } from '../../src/constants.js';
import { Fragment } from '../../src/aem/fragment.js';
import {
    applyFragmentListFilters,
    filterStoresByVariationPresence,
    VARIATION_FILTER,
} from '../../src/fragments/fragment-list-filters.js';

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

    describe('hasVariation filter', () => {
        const makeFragmentStore = ({ path, variationPaths = [], tags = [] }) => {
            const fragment = new Fragment({
                path,
                model: { path: '/models/card' },
                fields: [{ name: 'variations', values: variationPaths }],
                references: [],
                tags,
            });
            return { get: () => fragment, value: fragment };
        };

        // Promo variations are never recorded in a parent's `variations` field (see
        // promotion-variations.js createPromoVariation): they are their own fragment, found in
        // the list by path/tag, so the fixtures below model a promo card as two rows — the
        // parent card (no promo entry in its own `variations` field) and its promo variation.
        const promoCard = makeFragmentStore({ path: '/content/dam/mas/acom/en_US/promo-card' });
        const promoVariationRow = makeFragmentStore({
            path: '/content/dam/mas/acom/en_US/promotions/sale/promo-card',
            tags: [{ id: 'mas:promotion/sale' }],
        });
        const groupedCard = makeFragmentStore({
            path: '/content/dam/mas/acom/en_US/grouped-card',
            variationPaths: ['/content/dam/mas/acom/en_US/pzn/grouped-card'],
        });
        const noVariationCard = makeFragmentStore({
            path: '/content/dam/mas/acom/en_US/plain-card',
            variationPaths: [],
        });
        const localeOnlyCard = makeFragmentStore({
            path: '/content/dam/mas/acom/en_US/locale-card',
            variationPaths: ['/content/dam/mas/acom/fr_FR/locale-card'],
        });

        it('returns the input unchanged for a falsy filter value', () => {
            const stores = [promoCard, promoVariationRow, groupedCard, noVariationCard];
            expect(filterStoresByVariationPresence(stores, undefined)).to.equal(stores);
        });

        it('"Has promo variation" keeps only the card whose promo variation appears elsewhere in the list', () => {
            const filtered = filterStoresByVariationPresence(
                [promoCard, promoVariationRow, groupedCard, noVariationCard],
                VARIATION_FILTER.PROMO,
            );
            expect(filtered).to.deep.equal([promoCard]);
        });

        it('"Has grouped variation" keeps only grouped-bearing cards', () => {
            const filtered = filterStoresByVariationPresence(
                [promoCard, promoVariationRow, groupedCard, noVariationCard],
                VARIATION_FILTER.GROUPED,
            );
            expect(filtered).to.deep.equal([groupedCard]);
        });

        it('"No variations" keeps cards with neither grouped nor list-detectable promo variations', () => {
            const filtered = filterStoresByVariationPresence(
                [promoCard, promoVariationRow, groupedCard, noVariationCard, localeOnlyCard],
                VARIATION_FILTER.NONE,
            );
            // promoVariationRow is itself a variation fragment, not a parent card; this function
            // alone doesn't strip it out (that's the CONTENT-page exclusion's job in
            // applyFragmentListFilters, asserted separately below), so it passes on its own data.
            expect(filtered).to.deep.equal([promoVariationRow, noVariationCard, localeOnlyCard]);
        });

        it('combines with the CONTENT-page promo-variation exclusion while still detecting promo presence from the removed row', () => {
            const filtered = applyFragmentListFilters([promoCard, promoVariationRow, groupedCard], {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER.PROMO,
            });

            // promoVariationRow is itself stripped by the CONTENT-page exclusion, but its
            // existence elsewhere in the original list must still mark promoCard as matching.
            expect(filtered).to.deep.equal([promoCard]);
        });

        it('"No variations" on the CONTENT page excludes the promo variation row itself once stripped', () => {
            const filtered = applyFragmentListFilters([promoVariationRow, noVariationCard], {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER.NONE,
            });

            expect(filtered).to.deep.equal([noVariationCard]);
        });

        it('CONTENT-page promo-variation exclusion still removes promo variation rows for the "Has grouped variation" filter', () => {
            const promoAndGroupedVariationRow = makeFragmentStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                variationPaths: ['/content/dam/mas/acom/en_US/pzn/card'],
            });

            const filtered = applyFragmentListFilters([promoAndGroupedVariationRow, groupedCard], {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER.GROUPED,
            });

            expect(filtered).to.deep.equal([groupedCard]);
        });
    });
});
