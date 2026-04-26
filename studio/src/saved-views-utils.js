import Store from './store.js';

/**
 * Apply a saved view to the store atomically.
 * Order matters: filters then sort then viewMode — keeps subscribers in a consistent state.
 * @param {{ filters: object, sort: object, viewMode: string }} view
 */
export function applySavedView(view) {
    if (!view) return;
    if (view.filters) Store.filters.set({ ...view.filters });
    if (view.sort) Store.sort.set({ ...view.sort });
    if (typeof view.viewMode === 'string') Store.renderMode.set(view.viewMode);
}
