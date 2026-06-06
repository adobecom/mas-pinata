export default {
    FeatureName: 'M@S Studio Fragment Search',
    features: [
        {
            tcid: '0',
            // AC: a mid-word substring of a fragment's jcr:title / title field returns
            // that fragment ("photo" matches "Photoshop Plans"). Use a substring that is
            // NOT a token-edge prefix so it exercises the new path, not AEM's EDGES index.
            name: '@studio-search-substring',
            path: '/studio.html',
            data: {
                // Mid-word substring (>= 3 chars) of the target fragment's title.
                query: 'tomat',
                // Fragment whose jcr:title / title field contains the substring above.
                cardid: '481a2002-9a4e-447b-a990-b3e56fdb2d14',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @search @search-substring',
        },
        {
            tcid: '1',
            // AC: matching is case-insensitive — the same substring in a different case
            // still surfaces the fragment.
            name: '@studio-search-case-insensitive',
            path: '/studio.html',
            data: {
                // Same substring as tcid 0 but in a different case (e.g. uppercased).
                query: 'TOMAT',
                cardid: '481a2002-9a4e-447b-a990-b3e56fdb2d14',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @search @search-case-insensitive',
        },
        {
            tcid: '2',
            // AC: 1–2 character queries do NOT trigger the substring browse (3-char guard);
            // a 2-char mid-word substring stays on AEM's prefix index and must not surface
            // the fragment that the >= 3-char substring (tcid 0) does.
            name: '@studio-search-min-length',
            path: '/studio.html',
            data: {
                // A 2-char mid-word fragment of the tcid 0 query (must be < 3 chars).
                shortQuery: 'to',
                // The fragment that tcid 0 surfaces but this short query must NOT.
                cardid: '481a2002-9a4e-447b-a990-b3e56fdb2d14',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @search @search-min-length',
        },
    ],
};
