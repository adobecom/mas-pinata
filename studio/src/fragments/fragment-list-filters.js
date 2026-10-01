import { PAGE_NAMES } from '../constants.js';
import {
    fragmentIsPromoVariation,
    getPromoNameFromPromoVariationPath,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from '../promotions/promotion-model.js';
import { fragmentHasPersonalizationTag } from '../common/utils/personalization-utils.js';

/**
 * Values for the "Has variation?" fragment list filter.
 */
export const VARIATION_FILTER = Object.freeze({
    PROMO: 'promo',
    GROUPED: 'grouped',
    NONE: 'none',
});

/**
 * Menu options for the "Has variation?" fragment list filter, in display order.
 */
export const VARIATION_FILTER_OPTIONS = Object.freeze([
    { value: VARIATION_FILTER.PROMO, label: 'Has promo variation' },
    { value: VARIATION_FILTER.GROUPED, label: 'Has grouped variation' },
    { value: VARIATION_FILTER.NONE, label: 'No variations' },
]);

/**
 * Maps promo variation fragments present in the list back to the default fragment path they
 * belong to, purely from the variation's own path (no fetch). Promo variations are never
 * recorded in a parent's `variations` field (see promotion-variations.js createPromoVariation,
 * which only tags the copy), so a card's promo-variation presence can only be read off the list
 * by finding its promo variation row elsewhere in the same search result set.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @returns {Set<string>}
 */
function collectPromoVariationParentPaths(fragmentStores) {
    const parentPaths = new Set();
    for (const fs of fragmentStores) {
        const fragment = fs.get?.() ?? fs.value;
        if (!isPromoVariationPath(fragment.path)) continue;
        const promoName = getPromoNameFromPromoVariationPath(fragment.path);
        if (!promoName) continue;
        for (const candidate of resolveDefaultPathFromPromoVariation(fragment.path, promoName)) {
            parentPaths.add(candidate);
        }
    }
    return parentPaths;
}

/**
 * Filters fragment stores by the selected "Has variation?" option. Grouped presence comes from
 * the references-free Fragment#getVariationPresence() accessor (grouped variations are recorded
 * in the parent's `variations` field). Promo presence combines that accessor's hydrated-reference
 * fallback with collectPromoVariationParentPaths, since unhydrated promo variations never appear
 * in a card's own field data and must be found by path elsewhere in the list.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {string} [variationFilter] - one of VARIATION_FILTER's values, or falsy for no filtering
 * @param {Set<string>} [promoVariationParentPaths] - precomputed via collectPromoVariationParentPaths;
 *   pass explicitly when fragmentStores has already had promo variation rows filtered out of it.
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function filterStoresByVariationPresence(fragmentStores, variationFilter, promoVariationParentPaths) {
    if (!variationFilter) return fragmentStores;
    const parentPaths = promoVariationParentPaths ?? collectPromoVariationParentPaths(fragmentStores);
    return fragmentStores.filter((fs) => {
        const fragment = fs.get?.() ?? fs.value;
        const { promo: hydratedPromo, grouped } = fragment.getVariationPresence();
        const promo = hydratedPromo || parentPaths.has(fragment.path);
        if (variationFilter === VARIATION_FILTER.PROMO) return promo;
        if (variationFilter === VARIATION_FILTER.GROUPED) return grouped;
        return !promo && !grouped;
    });
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
 * Applies content-list filters (personalization, hide promo variations on CONTENT page, and
 * the "Has variation?" filter).
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {{ page: string, personalizationFilterEnabled: boolean, variationFilter?: string }} options
 * @returns {import('../reactivity/fragment-store.js').FragmentStore[]}
 */
export function applyFragmentListFilters(fragmentStores, { page, personalizationFilterEnabled, variationFilter }) {
    // Computed from the full, unfiltered list: the CONTENT-page exclusion below removes promo
    // variation rows, which are the only place their parent's promo presence can be read from.
    const promoVariationParentPaths = variationFilter ? collectPromoVariationParentPaths(fragmentStores) : undefined;
    const filteredByPersonalization = filterStoresByPersonalizationEnabled(fragmentStores, personalizationFilterEnabled);
    const filteredByPromoVariation =
        page !== PAGE_NAMES.CONTENT
            ? filteredByPersonalization
            : filteredByPersonalization.filter((fs) => {
                  const fragment = fs.get?.() ?? fs.value;
                  return !fragmentIsPromoVariation(fragment);
              });
    return filterStoresByVariationPresence(filteredByPromoVariation, variationFilter, promoVariationParentPaths);
}
