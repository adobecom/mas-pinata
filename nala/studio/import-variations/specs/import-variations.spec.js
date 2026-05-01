export default {
    FeatureName: 'M@S Studio Import Variations',
    features: [
        {
            tcid: '0',
            name: '@studio-import-variations-page-load',
            path: '/studio.html',
            browserParams: '#page=import-variations&path=nala&locale=en_US',
            tags: '@mas-studio @import-variations @smoke',
        },
        {
            tcid: '1',
            name: '@studio-import-variations-side-nav-entry',
            path: '/studio.html',
            browserParams: '#page=welcome&path=nala&locale=en_US',
            tags: '@mas-studio @import-variations',
        },
        {
            tcid: '2',
            name: '@studio-import-variations-base-picker',
            path: '/studio.html',
            browserParams: '#page=import-variations&path=nala&locale=en_US',
            tags: '@mas-studio @import-variations',
        },
    ],
};
