import { Fragment } from '../aem/fragment.js';
import { isPromoVariationPath } from '../promotions/promotion-model.js';

export const VARIATION_FILTER_VALUES = {
    HAS_PROMO: 'has-promo-variation',
    HAS_GROUPED: 'has-grouped-variation',
    NO_VARIATIONS: 'no-variations',
};

export const VARIATION_FILTER_OPTIONS = [
    { value: VARIATION_FILTER_VALUES.HAS_PROMO, label: 'Has promo variation' },
    { value: VARIATION_FILTER_VALUES.HAS_GROUPED, label: 'Has grouped variation' },
    { value: VARIATION_FILTER_VALUES.NO_VARIATIONS, label: 'No variations' },
];

/**
 * True when a fragment's variation paths match the selected "Has variation?" filter value.
 * No value selected (null/undefined/'') means unfiltered — every fragment matches.
 * @param {{ getVariations?: () => string[], variations?: string[] }} fragment
 * @param {string} [value] - one of VARIATION_FILTER_VALUES
 * @returns {boolean}
 */
export function fragmentMatchesVariationFilter(fragment, value) {
    if (!value) return true;
    const paths = fragment?.getVariations?.() ?? fragment?.variations ?? [];
    switch (value) {
        case VARIATION_FILTER_VALUES.NO_VARIATIONS:
            return paths.length === 0;
        case VARIATION_FILTER_VALUES.HAS_GROUPED:
            return paths.some((path) => Fragment.isGroupedVariationPath(path));
        case VARIATION_FILTER_VALUES.HAS_PROMO:
            return paths.some((path) => !Fragment.isGroupedVariationPath(path) && isPromoVariationPath(path));
        default:
            return true;
    }
}
