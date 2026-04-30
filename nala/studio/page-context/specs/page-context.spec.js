export default {
    FeatureName: 'M@S Studio Page Context Placeholder Contract',
    features: [
        {
            tcid: '0',
            name: '@studio-page-context-smoke',
            path: '/studio.html',
            data: {
                cardid: '3b1fb0f1-b74e-4e8f-81ad-1744012b1935',
                contextKey: 'product_name',
                contextValue: 'Photoshop',
                rawToken: '{{product_name}}',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @page-context @page-context-smoke',
        },
        {
            tcid: '1',
            name: '@studio-page-context-fallback',
            path: '/studio.html',
            data: {
                cardid: '3b1fb0f1-b74e-4e8f-81ad-1744012b1935',
                rawToken: '{{product_name}}',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @page-context @page-context-fallback',
        },
        {
            tcid: '2',
            name: '@studio-page-context-late-ready',
            path: '/studio.html',
            data: {
                cardid: '3b1fb0f1-b74e-4e8f-81ad-1744012b1935',
                contextKey: 'product_name',
                contextValue: 'Illustrator',
                eventName: 'mas:page-context:ready',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @page-context @page-context-late-ready',
        },
    ],
};
