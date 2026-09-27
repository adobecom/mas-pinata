import { PAGE_NAMES } from '../constants.js';
import { extractLocaleFromPath } from '../utils.js';

/**
 * Builds the URL that opens a promo variation in the full-page fragment editor.
 * Keeps the current hash (surface path, catalog locale, promotion project) and swaps in the editor route,
 * the same state `router.navigateToFragmentEditor` sets for the in-app "Edit promo variation" action.
 * @param {{ id: string, path: string }} variation
 * @param {string} [currentUrl] URL to derive the new one from
 * @returns {string}
 */
export function buildPromoVariationEditorUrl(variation, currentUrl = window.location.href) {
    const url = new URL(currentUrl);
    const params = new URLSearchParams(url.hash.slice(1));
    const variationLocale = extractLocaleFromPath(variation.path);
    if (variationLocale !== (params.get('locale') ?? 'en_US')) {
        params.set('region', variationLocale);
    }
    params.delete('query');
    params.set('page', PAGE_NAMES.FRAGMENT_EDITOR);
    params.set('fragmentId', variation.id);
    url.hash = params.toString();
    return url.toString();
}

/**
 * Opens a promo variation in the fragment editor in a new browser tab.
 * @param {{ id: string, path: string }} variation
 */
export function openPromoVariationInNewTab(variation) {
    window.open(buildPromoVariationEditorUrl(variation), '_blank');
}
