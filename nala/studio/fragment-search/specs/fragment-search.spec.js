export default {
    FeatureName: 'M@S Studio Fragment Search Title',
    features: [
        {
            tcid: '0',
            name: '@studio-fragment-search-title',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                searchTerm: 'suggested',
            },
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @fragment-search @fragment-search-title',
        },
        {
            tcid: '1',
            name: '@studio-fragment-search-empty-query',
            path: '/studio.html',
            data: {},
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @fragment-search @fragment-search-empty',
        },
    ],
};
