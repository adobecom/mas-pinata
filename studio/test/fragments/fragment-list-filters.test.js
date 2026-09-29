import { expect } from '@esm-bundle/chai';
import { PAGE_NAMES } from '../../src/constants.js';
import { Fragment } from '../../src/aem/fragment.js';
import { applyFragmentListFilters, VARIATION_FILTERS } from '../../src/fragments/fragment-list-filters.js';

describe('fragment-list-filters', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    const makeFragmentStore = (overrides) => makeStore(new Fragment(overrides));

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

    describe('variationFilter', () => {
        // Promo variations are never listed in the parent's `variations` field (they are discovered
        // by probing, not through a reference field) — only a hydrated `references` entry signals
        // promo presence, which is what MasRepository merges in before calling this filter.
        const promoCard = makeFragmentStore({
            path: '/content/dam/mas/sandbox/en_US/card-promo',
            fields: [],
            references: [
                {
                    id: 'ref-promo',
                    path: '/content/dam/mas/sandbox/en_US/promotions/sale/card-promo',
                    tags: [{ id: 'mas:promotion/sale' }],
                },
            ],
        });
        const groupedCard = makeFragmentStore({
            path: '/content/dam/mas/sandbox/en_US/card-grouped',
            fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_US/pzn/card-grouped-a'] }],
            references: [{ id: 'ref-grouped', path: '/content/dam/mas/sandbox/en_US/pzn/card-grouped-a' }],
        });
        const noVariationsFieldCard = makeFragmentStore({
            path: '/content/dam/mas/sandbox/en_US/card-no-field',
            fields: [],
            references: [],
        });
        const emptyVariationsCard = makeFragmentStore({
            path: '/content/dam/mas/sandbox/en_US/card-empty-field',
            fields: [{ name: 'variations', values: [] }],
            references: [],
        });

        it("'promo' returns only cards with a promo variation", () => {
            const filtered = applyFragmentListFilters([promoCard, groupedCard, noVariationsFieldCard], {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: true,
                variationFilter: VARIATION_FILTERS.PROMO,
            });

            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(promoCard.get().path);
        });

        it("'grouped' returns only cards with a grouped variation", () => {
            const filtered = applyFragmentListFilters([promoCard, groupedCard, noVariationsFieldCard], {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: true,
                variationFilter: VARIATION_FILTERS.GROUPED,
            });

            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(groupedCard.get().path);
        });

        it("'none' returns only cards with zero variations, including missing and empty variations fields", () => {
            const filtered = applyFragmentListFilters([promoCard, groupedCard, noVariationsFieldCard, emptyVariationsCard], {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: true,
                variationFilter: VARIATION_FILTERS.NONE,
            });

            expect(filtered).to.have.lengthOf(2);
            expect(filtered.map((fs) => fs.get().path)).to.include.members([
                noVariationsFieldCard.get().path,
                emptyVariationsCard.get().path,
            ]);
        });

        it('leaves results unchanged when variationFilter is unset', () => {
            const standalonePromoVariation = makeFragmentStore({
                path: '/content/dam/mas/sandbox/en_US/promotions/sale/standalone-variation',
                fields: [],
                references: [],
            });

            const filtered = applyFragmentListFilters(
                [promoCard, groupedCard, noVariationsFieldCard, standalonePromoVariation],
                {
                    page: PAGE_NAMES.CONTENT,
                    personalizationFilterEnabled: true,
                },
            );

            expect(filtered).to.have.lengthOf(3);
            expect(filtered.map((fs) => fs.get().path)).to.include.members([
                promoCard.get().path,
                groupedCard.get().path,
                noVariationsFieldCard.get().path,
            ]);
        });

        it('does not filter when variationFilter is an unrecognised value', () => {
            const filtered = applyFragmentListFilters([promoCard, groupedCard, noVariationsFieldCard], {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: true,
                variationFilter: 'bogus',
            });

            expect(filtered).to.have.lengthOf(3);
        });

        it('composes with personalization and CONTENT-page promo-variation exclusion', () => {
            const qualifyingParent = makeFragmentStore({
                path: '/content/dam/mas/sandbox/en_US/card-parent',
                fields: [],
                references: [
                    {
                        id: 'ref-parent-promo',
                        path: '/content/dam/mas/sandbox/en_US/promotions/sale/card-parent',
                        tags: [{ id: 'mas:promotion/sale' }],
                    },
                ],
                tags: [],
            });
            const personalizationTaggedParent = makeFragmentStore({
                path: '/content/dam/mas/sandbox/en_US/card-pzn-parent',
                fields: [],
                references: [
                    {
                        id: 'ref-pzn-parent-promo',
                        path: '/content/dam/mas/sandbox/en_US/promotions/sale/card-pzn-parent',
                        tags: [{ id: 'mas:promotion/sale' }],
                    },
                ],
                tags: [{ id: 'mas:pzn/segment/foo' }],
            });
            const promoVariationCardItself = makeFragmentStore({
                path: '/content/dam/mas/sandbox/en_US/promotions/sale/standalone-variation',
                fields: [],
                references: [],
                tags: [{ id: 'mas:promotion/sale' }],
            });

            const filtered = applyFragmentListFilters(
                [qualifyingParent, personalizationTaggedParent, promoVariationCardItself],
                {
                    page: PAGE_NAMES.CONTENT,
                    personalizationFilterEnabled: false,
                    variationFilter: VARIATION_FILTERS.PROMO,
                },
            );

            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(qualifyingParent.get().path);
        });
    });
});
