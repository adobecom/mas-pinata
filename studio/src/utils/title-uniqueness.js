/**
 * Escapes regex metacharacters in a literal string so it can be used inside a
 * regex pattern.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns a title that is unique within a single AEM folder, appending `-N`
 * suffixes if the desired title already exists. The check is silent and
 * deterministic: the smallest unused integer is selected, with the unsuffixed
 * title counting as `N=0`.
 *
 * The folder scope is derived strictly from `parentPath` (which already
 * includes locale). Cards in any other folder are invisible to this check by
 * construction.
 *
 * @param {Object} params
 * @param {Object} params.aem - AEM client (`mas-repository.aem`).
 * @param {string} params.parentPath - DAM folder path to scope the search.
 * @param {string} params.desiredTitle - The title the user wants to save.
 * @param {string} [params.excludeFragmentId] - Fragment id to ignore in the
 *     conflict scan (so a card resaving its own title is not a self-conflict).
 * @returns {Promise<string>}
 */
export async function findUniqueTitle({ aem, parentPath, desiredTitle, excludeFragmentId }) {
    if (!aem || !parentPath || !desiredTitle) return desiredTitle;

    const titles = new Set();
    // AEM full-text search is fuzzy (EDGES mode), so we always re-check titles
    // exactly client-side.
    const cursor = aem.sites.cf.fragments.search({
        path: parentPath,
        query: desiredTitle,
    });
    for await (const page of cursor) {
        for (const item of page || []) {
            if (!item || typeof item.title !== 'string') continue;
            if (excludeFragmentId && item.id === excludeFragmentId) continue;
            titles.add(item.title);
        }
    }

    if (!titles.has(desiredTitle)) return desiredTitle;

    const suffixPattern = new RegExp(`^${escapeRegex(desiredTitle)}-(\\d+)$`);
    let maxN = 0;
    for (const title of titles) {
        const match = title.match(suffixPattern);
        if (!match) continue;
        const n = parseInt(match[1], 10);
        if (Number.isFinite(n) && n > maxN) maxN = n;
    }
    return `${desiredTitle}-${maxN + 1}`;
}
