import Events from './events.js';

/**
 * Publishing goes through an AEM activation workflow, so AEM stamps the publish audit trail with
 * the workflow's own service account instead of the author who triggered it. Version history has to
 * recognise those accounts to avoid presenting them as authors.
 */
const SYSTEM_ACCOUNTS = new Set(['workflow-process-service', 'workflow-service', 'workflow-user', 'system', 'admin']);

/**
 * @param {string} [userId] - User id recorded by AEM
 * @returns {boolean} Whether the id belongs to a system account rather than an author
 */
export function isSystemAccount(userId) {
    if (!userId) return false;
    return SYSTEM_ACCOUNTS.has(`${userId}`.trim().toLowerCase());
}

/**
 * AEM reports audit metadata either nested (`modified: { at, by, fullName }`) or flattened
 * (`modifiedBy`), depending on the endpoint. Read either shape into one.
 * @param {Object|string} [entry] - Nested audit entry, or a bare timestamp
 * @param {string} [flatBy] - User id from the flattened form
 * @returns {{ at: string|undefined, by: string|undefined, fullName: string|undefined }}
 */
export function readAudit(entry, flatBy) {
    if (entry && typeof entry === 'object') {
        return { at: entry.at, by: entry.by ?? flatBy, fullName: entry.fullName };
    }
    return { at: typeof entry === 'string' ? entry : undefined, by: flatBy, fullName: undefined };
}

/** @returns {boolean} Whether `at` is a valid timestamp no later than `limit` */
function isNotNewerThan(at, limit) {
    const time = Date.parse(at);
    const limitTime = Date.parse(limit);
    if (Number.isNaN(time) || Number.isNaN(limitTime)) return false;
    return time <= limitTime;
}

/**
 * Resolve the author behind an audited action. A system account means AEM recorded the workflow
 * instead of the user who triggered it; the author is then the user whose content modification the
 * workflow acted on. That substitution is only trusted when the modification is not newer than the
 * action, so a later edit is never credited with an earlier publish.
 * @param {{ at: string|undefined, by: string|undefined, fullName: string|undefined }} action
 * @param {{ at: string|undefined, by: string|undefined, fullName: string|undefined }} [modification]
 * @returns {{ by: string|undefined, fullName: string|undefined, system: boolean }}
 */
export function resolveActor(action, modification) {
    if (action.by && !isSystemAccount(action.by)) {
        return { by: action.by, fullName: action.fullName, system: false };
    }
    if (modification?.by && !isSystemAccount(modification.by) && isNotNewerThan(modification.at, action.at)) {
        return { by: modification.by, fullName: modification.fullName, system: false };
    }
    return { by: action.by, fullName: action.fullName, system: true };
}

/**
 * Repository for version-related data operations.
 * Handles loading, saving, and restoring fragment versions.
 */
export class VersionRepository {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Load version history for a fragment
     * @param {string} fragmentId - The fragment ID
     * @returns {Promise<{fragment: Object, versions: Array, currentVersion: Object}>}
     */
    async loadVersionHistory(fragmentId) {
        try {
            // Load the current fragment
            const fragment = await this.repository.aem.sites.cf.fragments.getById(fragmentId);

            // Create a "current version" from the live fragment
            const modified = readAudit(fragment.modified, fragment.modifiedBy);
            const published = readAudit(fragment.published, fragment.publishedBy);
            const modifiedActor = resolveActor(modified, modified);
            const publishedActor = resolveActor(published, modified);

            const currentVersion = {
                id: 'current',
                version: 'Current',
                created: modified.at || new Date().toISOString(),
                createdBy: modifiedActor.by || 'System',
                createdByName: modifiedActor.fullName,
                publishedAt: published.at,
                publishedBy: published.at ? publishedActor.by : undefined,
                publishedByName: published.at ? publishedActor.fullName : undefined,
                isCurrent: true,
            };

            // Load version history
            const versionsResponse = await this.repository.aem.sites.cf.fragments.getVersions(fragmentId);
            const historicalVersions = (versionsResponse?.items || []).map((version) => this.normalizeVersion(version));

            // Combine current version with historical versions
            const versions = [currentVersion, ...historicalVersions];

            return {
                fragment,
                versions,
                currentVersion,
            };
        } catch (error) {
            console.error('Failed to load version history:', error);
            throw error;
        }
    }

    /**
     * Normalize a historical version so authorship reads the same as the current version, whichever
     * audit shape AEM returned and whether or not a workflow account created the version.
     * @param {Object} version - Raw version item from AEM
     * @returns {Object} Version with `created`, `createdBy` and `createdByName` resolved
     */
    normalizeVersion(version) {
        const created = readAudit(version.created, version.createdBy);
        const modified = readAudit(version.modified, version.modifiedBy);
        const actor = resolveActor(created, modified);

        return {
            ...version,
            created: created.at ?? version.created,
            createdBy: actor.by,
            createdByName: actor.fullName,
        };
    }

    /**
     * Load data for a specific version
     * @param {string} fragmentId - The fragment ID
     * @param {string} versionId - The version ID
     * @returns {Promise<Object>} Version data
     */
    async loadVersionData(fragmentId, versionId) {
        try {
            const versionData = await this.repository.aem.sites.cf.fragments.getVersion(fragmentId, versionId);
            return versionData;
        } catch (error) {
            console.error('Failed to load version data:', error);
            throw error;
        }
    }

    /**
     * Restore a fragment to a specific version
     * @param {Object} version - The version to restore
     * @param {Object} currentFragment - The current fragment
     * @param {Function} normalizeFields - Function to normalize fields
     * @param {Function} denormalizeFields - Function to denormalize fields
     * @returns {Promise<void>}
     */
    async restoreVersion(version, currentFragment, normalizeFields, denormalizeFields) {
        try {
            // Load the version data if not already loaded
            const versionData = await this.loadVersionData(currentFragment.id, version.id);

            // Normalize the version fields
            const normalizedFields = normalizeFields(versionData);

            // Convert back to AEM array format for saving
            let fieldsArray = denormalizeFields(normalizedFields, currentFragment);

            // Preserve the current fragment's variations field so restored versions don't wipe locale variation.
            const currentVariationsField = currentFragment.fields?.find((f) => f.name === 'variations');
            if (currentVariationsField) {
                const withoutVariations = fieldsArray.filter((f) => f.name !== 'variations');
                fieldsArray = [
                    ...withoutVariations,
                    { ...currentVariationsField, values: currentVariationsField.values || [] },
                ];
            }

            // Extract fragment title and description from normalized fields
            const { fragmentTitle, fragmentDescription } = normalizedFields;

            // Update the current fragment with the version data
            const updatedFragment = {
                ...currentFragment,
                fields: fieldsArray,
                // Restore title and description if they exist in the version
                ...(fragmentTitle !== undefined && { title: fragmentTitle }),
                ...(fragmentDescription !== undefined && { description: fragmentDescription }),
            };

            // Save the fragment
            await this.repository.aem.sites.cf.fragments.save(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: `Version ${version.title} restored successfully`,
            });
        } catch (error) {
            console.error('Failed to restore version:', error);
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to restore version: ${error.message}`,
            });
            throw error;
        }
    }

    /**
     * Search versions by query
     * @param {Array} versions - Array of versions to search
     * @param {string} query - Search query
     * @returns {Array} Filtered versions
     */
    searchVersions(versions, query) {
        if (!query) return versions;

        const lowerQuery = query.toLowerCase();
        return versions.filter((version) => {
            return (
                version.version?.toLowerCase().includes(lowerQuery) ||
                version.createdBy?.toLowerCase().includes(lowerQuery) ||
                version.createdByName?.toLowerCase().includes(lowerQuery) ||
                version.publishedBy?.toLowerCase().includes(lowerQuery) ||
                version.publishedByName?.toLowerCase().includes(lowerQuery) ||
                version.created?.toLowerCase().includes(lowerQuery) ||
                version.comment?.toLowerCase().includes(lowerQuery)
            );
        });
    }
}
