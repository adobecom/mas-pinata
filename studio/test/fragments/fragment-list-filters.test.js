import { expect } from '@esm-bundle/chai';
import { Fragment } from '../../src/aem/fragment.js';
import { PAGE_NAMES } from '../../src/constants.js';
import {
    applyFragmentListFilters,
    filterStoresByVariationType,
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

    describe('filterStoresByVariationType', () => {
        const surfaceRoot = '/content/dam/mas/sandbox/en_US';

        // Search results only carry the `variations` field, never hydrated references.
        const makeCard = (name, variations = []) =>
            makeStore(
                new Fragment({
                    id: name,
                    path: `${surfaceRoot}/${name}`,
                    model: { path: '/models/card' },
                    fields: [{ name: 'variations', values: variations }],
                }),
            );

        const groupedOnly = makeCard('grouped-only', [`${surfaceRoot}/pzn/grouped-only`]);
        const localeOnly = makeCard('locale-only', ['/content/dam/mas/sandbox/fr_FR/locale-only']);
        const promoOnly = makeCard('promo-only');
        const both = makeCard('both', [`${surfaceRoot}/pzn/both`]);
        const none = makeCard('none');
        const stores = [groupedOnly, localeOnly, promoOnly, both, none];
        const promoParentPaths = new Set([`${surfaceRoot}/promo-only`, `${surfaceRoot}/both`]);

        it('keeps cards with a promo variation', () => {
            expect(filterStoresByVariationType(stores, VARIATION_FILTER.PROMO, promoParentPaths)).to.deep.equal([
                promoOnly,
                both,
            ]);
        });

        it('keeps cards with a grouped variation', () => {
            expect(filterStoresByVariationType(stores, VARIATION_FILTER.GROUPED, promoParentPaths)).to.deep.equal([
                groupedOnly,
                both,
            ]);
        });

        it('keeps only cards without any variation', () => {
            expect(filterStoresByVariationType(stores, VARIATION_FILTER.NONE, promoParentPaths)).to.deep.equal([none]);
        });

        it('excludes a card whose only variation is a locale variation', () => {
            const result = filterStoresByVariationType(stores, VARIATION_FILTER.NONE, promoParentPaths);

            expect(result).to.not.include(localeOnly);
        });

        it('keeps a card with promo and grouped variations under both filters', () => {
            const promoResult = filterStoresByVariationType(stores, VARIATION_FILTER.PROMO, promoParentPaths);
            const groupedResult = filterStoresByVariationType(stores, VARIATION_FILTER.GROUPED, promoParentPaths);

            expect(promoResult).to.include(both);
            expect(groupedResult).to.include(both);
        });

        it('returns every card when no filter is set', () => {
            expect(filterStoresByVariationType(stores, undefined, promoParentPaths)).to.deep.equal(stores);
        });

        it('combines with the other list filters', () => {
            const pznTagged = makeStore({
                path: `${surfaceRoot}/pzn-tagged`,
                tags: [{ id: 'mas:pzn/segment/students' }],
                getVariations: () => [`${surfaceRoot}/pzn/pzn-tagged`],
            });
            const filtered = applyFragmentListFilters([...stores, pznTagged], {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationFilter: VARIATION_FILTER.GROUPED,
                promoParentPaths,
            });

            expect(filtered).to.deep.equal([groupedOnly, both]);
        });
    });
});
