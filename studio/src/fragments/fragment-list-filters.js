import { PAGE_NAMES } from '../constants.js';
import { fragmentIsPromoVariation } from '../promotions/promotion-model.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';

/**
 * Accepted values for the variation-presence filter. Extensible: a future variation type
 * needs one entry here and one branch in matchesVariationFilter.
 */
export const VARIATION_FILTERS = Object.freeze({
    PROMO: 'promo',
    GROUPED: 'grouped',
    NONE: 'none',
});

/**
 * Set of variationFilter values whose predicate depends on promo variation references being
 * hydrated onto the fragment (promo variations are discovered by path/tag probing, not through
 * the `variations` field, so the caller must merge them into `fragment.references` first).
 * @see MasRepository#applyFragmentListFilters
 */
export const VARIATION_FILTERS_REQUIRING_PROMO_HYDRATION = Object.freeze([VARIATION_FILTERS.PROMO, VARIATION_FILTERS.NONE]);

/**
 * Matches a card against a VARIATION_FILTERS value. An unset or unrecognised value matches everything.
 * Promo variation presence relies on `fragment.listPromoVariations()`, which reads promo entries out
 * of `fragment.references` — the caller must hydrate those references first for 'promo' and 'none'
 * to be accurate (see VARIATION_FILTERS_REQUIRING_PROMO_HYDRATION).
 * @param {string} [variationFilter]
 * @param {import('../aem/fragment.js').Fragment} fragment
 * @returns {boolean}
 */
export function matchesVariationFilter(variationFilter, fragment) {
    switch (variationFilter) {
        case VARIATION_FILTERS.PROMO:
            return fragment.listPromoVariations().length > 0;
        case VARIATION_FILTERS.GROUPED:
            return fragment.listGroupedVariations().length > 0;
        case VARIATION_FILTERS.NONE:
            return fragment.getTotalVariationCount() === 0;
        default:
            return true;
    }
}

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

/**
 * Applies content-list filters (personalization + hide promo variations on CONTENT page + variation presence).
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variationFilter?: string }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled, variationFilter }) {
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    const filteredByContentType =
        page !== PAGE_NAMES.CONTENT
            ? filteredByPersonalization
            : filteredByPersonalization.filter((fs) => {
                  const fragment = fs.get?.() ?? fs.value;
                  return !fragmentIsPromoVariation(fragment);
              });
    return filteredByContentType.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        return matchesVariationFilter(variationFilter, fragment);
    });
}
