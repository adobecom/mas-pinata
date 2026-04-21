export default {
    FeatureName: 'M@S Studio Content Sort',
    features: [
        {
            tcid: '0',
            name: '@studio-sort-title-toggle',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort @sort-smoke',
        },
        {
            tcid: '1',
            name: '@studio-sort-last-modified-toggle',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort',
        },
        {
            tcid: '2',
            name: '@studio-sort-last-modified-column-visible',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort',
        },
        {
            tcid: '3',
            name: '@studio-sort-not-persisted-in-hash',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort',
        },
    ],
};
