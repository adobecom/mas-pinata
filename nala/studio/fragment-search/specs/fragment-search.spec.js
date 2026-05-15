export default {
    FeatureName: 'M@S Studio Fragment Search by Title',
    features: [
        {
            tcid: '0',
            name: '@studio-fragment-search-title-smoke',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @fragment-search @fragment-search-title',
        },
        {
            tcid: '1',
            name: '@studio-fragment-search-title-empty-query',
            path: '/studio.html',
            data: {},
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @fragment-search @fragment-search-title',
        },
    ],
};
