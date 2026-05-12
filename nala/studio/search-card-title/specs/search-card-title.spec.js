export default {
    FeatureName: 'M@S Studio Search Card Title',
    features: [
        {
            tcid: '0',
            name: '@studio-search-card-title',
            path: '/studio.html',
            data: {
                cardid: '8a338eba-55bf-4720-ab6d-79efd60177f6',
                searchTitle: 'card-with-locale-and-grouped-variations',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @search-card-title @search-card-title-smoke',
        },
        {
            tcid: '1',
            name: '@studio-search-card-title-partial',
            path: '/studio.html',
            data: {
                cardid: '8a338eba-55bf-4720-ab6d-79efd60177f6',
                searchTitle: 'locale-and-grouped',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @search-card-title @search-card-title-partial',
        },
    ],
};
