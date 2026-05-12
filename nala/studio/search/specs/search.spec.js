export default {
    FeatureName: 'M@S Studio Search',
    features: [
        {
            tcid: '0',
            name: '@studio-search-card-title',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                searchTerm: 'suggested',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @search @search-card-title',
        },
        {
            tcid: '1',
            name: '@studio-search-partial-match',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                searchTerm: 'suggest',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @search @search-partial-match',
        },
        {
            tcid: '2',
            name: '@studio-search-translation-card-title',
            path: '/studio.html',
            data: {
                searchTerm: 'suggested',
            },
            browserParams: '#page=translations&path=nala',
            tags: '@mas-studio @search @search-translation',
        },
    ],
};
