import { Fragment } from '../aem/fragment.js';
import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation } from '../promotions/promotion-model.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';

/**
 * When personalization is off, exclude fragments that carry mas:pzn/… tags except mas:pzn/country/….
 * When on, search omits non-country pzn tags from the API; narrowing by those tags happens in mas-content.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {boolean} personalizationFilterEnabled
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled) {
    if (personalizationFilterEnabled === true) return fragmentStores;
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentHasPersonalizationTag(fragment);
    });
}

/** Values of the "Has variation?" filter. */
export const VARIATION_FILTER = Object.freeze({ PROMO: 'promo', GROUPED: 'grouped', NONE: 'none' });

/** Options of the "Has variation?" picker, in display order. */
export const VARIATION_FILTER_OPTIONS = Object.freeze([
    { value: VARIATION_FILTER.PROMO, label: 'Has promo variation' },
    { value: VARIATION_FILTER.GROUPED, label: 'Has grouped variation' },
    { value: VARIATION_FILTER.NONE, label: 'No variations' },
]);

/**
 * Search results carry the parent's `variations` field (regional and grouped paths) but never its promo
 * variations, which live under promotions/ and are only discoverable by looking at that folder.
 */
const VARIATION_FILTER_MATCHERS = {
    [VARIATION_FILTER.PROMO]: (fragment, promoParentPaths) => promoParentPaths.has(fragment.path),
    [VARIATION_FILTER.GROUPED]: (fragment) => fragment.getVariations().some(Fragment.isGroupedVariationPath),
    [VARIATION_FILTER.NONE]: (fragment, promoParentPaths) => !fragment.hasVariations() && !promoParentPaths.has(fragment.path),
};

/**
 * Keeps only fragments matching the selected "Has variation?" option; a card with both promo and grouped
 * variations matches both of those options. "No variations" also excludes locale variations.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {'promo' | 'grouped' | 'none' | undefined} variationFilter unset returns every store
 * @param {Set<string>} promoParentPaths paths of the cards that have at least one promo variation
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByVariationType(fragmentStores, variationFilter, promoParentPaths) {
    if (!variationFilter) return fragmentStores;
    const matches = VARIATION_FILTER_MATCHERS[variationFilter];
    return fragmentStores.filter((fs) => matches(fs.get?.() ?? fs.value, promoParentPaths));
}

/**
 * Applies content-list filters (personalization, hide promo variations on CONTENT page, "Has variation?").
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variationFilter?: string, promoParentPaths?: Set<string> }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(
    fragmentStores,
    { page, personalizationFilterEnabled, variationFilter, promoParentPaths },
) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    const filteredByVariation = filterStoresByVariationType(filteredByPersonalization, variationFilter, promoParentPaths);
    if (page !== PAGE_NAMES.CONTENT) return filteredByVariation;
    return filteredByVariation.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return !fragmentIsPromoVariation(fragment);
    });
}
