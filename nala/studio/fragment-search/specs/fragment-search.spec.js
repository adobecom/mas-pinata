/**
 * Fixture dependency: tests require a pre-existing AEM fragment.
 * - Fragment ID: 287ef7ee-b0e3-4d95-a689-578de492ceae
 * - Expected title: "Nala Automation Card"
 * - Location: AEM `nala` folder
 * - Purpose: validates title-based search returns correct results
 */
export default {
    FeatureName: 'M@S Studio Fragment Search Title',
    features: [
        {
            tcid: '0',
            name: '@studio-fragment-search-title-match',
            path: '/studio.html',
            data: {
                query: 'Nala Automation Card',
                cardid: '287ef7ee-b0e3-4d95-a689-578de492ceae',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @fragment-search @fragment-search-title',
        },
        {
            tcid: '1',
            name: '@studio-fragment-search-short-query-no-title',
            path: '/studio.html',
            data: {
                query: 'ab',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @fragment-search @fragment-search-short-query',
        },
        {
            tcid: '2',
            name: '@studio-fragment-search-dedup',
            path: '/studio.html',
            data: {
                query: 'Nala Automation Card',
                cardid: '287ef7ee-b0e3-4d95-a689-578de492ceae',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @fragment-search @fragment-search-dedup',
        },
    ],
};
