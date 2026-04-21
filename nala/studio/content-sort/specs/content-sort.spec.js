export default {
    FeatureName: 'M@S Studio Content Sort',
    features: [
        {
            tcid: '0',
            name: '@studio-content-sort-smoke',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @content-sort @content-sort-smoke',
        },
        {
            tcid: '1',
            name: '@studio-content-sort-title-toggle',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @content-sort @content-sort-title',
        },
        {
            tcid: '2',
            name: '@studio-content-sort-modified-toggle',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @content-sort @content-sort-modified',
        },
    ],
};
