import { expect } from '@esm-bundle/chai';
import { Fragment } from '../../src/aem/fragment.js';
import {
    VARIATION_FILTER_VALUES,
    VARIATION_FILTER_OPTIONS,
    fragmentMatchesVariationFilter,
} from '../../src/fragments/variation-filter.js';

describe('variation-filter', () => {
    const makeFragment = (variationPaths = []) =>
        new Fragment({
            path: '/content/dam/mas/acom/en_US/card',
            fields: [{ name: 'variations', values: variationPaths }],
        });

    it('exposes the three ticket-specified options with exact labels', () => {
        expect(VARIATION_FILTER_OPTIONS).to.deep.equal([
            { value: VARIATION_FILTER_VALUES.HAS_PROMO, label: 'Has promo variation' },
            { value: VARIATION_FILTER_VALUES.HAS_GROUPED, label: 'Has grouped variation' },
            { value: VARIATION_FILTER_VALUES.NO_VARIATIONS, label: 'No variations' },
        ]);
    });

    [undefined, null, ''].forEach((value) => {
        it(`returns true for every fragment when value is ${JSON.stringify(value)} (unfiltered default)`, () => {
            const noVariations = makeFragment([]);
            const withVariations = makeFragment([
                '/content/dam/mas/acom/en_US/promotions/sale/card',
                '/content/dam/mas/acom/en_US/pzn/card',
            ]);
            expect(fragmentMatchesVariationFilter(noVariations, value)).to.be.true;
            expect(fragmentMatchesVariationFilter(withVariations, value)).to.be.true;
        });
    });

    describe('HAS_PROMO', () => {
        it('matches a fragment with a promo variation path', () => {
            const fragment = makeFragment(['/content/dam/mas/acom/en_US/promotions/sale/card']);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_PROMO)).to.be.true;
        });

        it('does not match a fragment with only a grouped variation', () => {
            const fragment = makeFragment(['/content/dam/mas/acom/en_US/pzn/card']);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_PROMO)).to.be.false;
        });

        it('does not match a fragment with no variations', () => {
            const fragment = makeFragment([]);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_PROMO)).to.be.false;
        });
    });

    describe('HAS_GROUPED', () => {
        it('matches a fragment with a grouped (pzn) variation path', () => {
            const fragment = makeFragment(['/content/dam/mas/acom/en_US/pzn/card']);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_GROUPED)).to.be.true;
        });

        it('does not match a fragment with only a promo variation', () => {
            const fragment = makeFragment(['/content/dam/mas/acom/en_US/promotions/sale/card']);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_GROUPED)).to.be.false;
        });

        it('does not match a fragment with no variations', () => {
            const fragment = makeFragment([]);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.HAS_GROUPED)).to.be.false;
        });
    });

    describe('NO_VARIATIONS', () => {
        it('matches a fragment with an empty variations field', () => {
            const fragment = makeFragment([]);
            expect(fragmentMatchesVariationFilter(fragment, VARIATION_FILTER_VALUES.NO_VARIATIONS)).to.be.true;
        });

        it('does not match a fragment with any variation, promo or grouped', () => {
            const withPromo = makeFragment(['/content/dam/mas/acom/en_US/promotions/sale/card']);
            const withGrouped = makeFragment(['/content/dam/mas/acom/en_US/pzn/card']);
            expect(fragmentMatchesVariationFilter(withPromo, VARIATION_FILTER_VALUES.NO_VARIATIONS)).to.be.false;
            expect(fragmentMatchesVariationFilter(withGrouped, VARIATION_FILTER_VALUES.NO_VARIATIONS)).to.be.false;
        });
    });

    it('does not throw for a fragment lacking getVariations', () => {
        expect(() => fragmentMatchesVariationFilter({}, VARIATION_FILTER_VALUES.NO_VARIATIONS)).to.not.throw();
        expect(fragmentMatchesVariationFilter({}, VARIATION_FILTER_VALUES.NO_VARIATIONS)).to.be.true;
        expect(() => fragmentMatchesVariationFilter(undefined, VARIATION_FILTER_VALUES.HAS_PROMO)).to.not.throw();
    });
});
