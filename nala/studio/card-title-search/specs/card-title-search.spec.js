export default {
    FeatureName: 'M@S Studio Card Title Search',
    features: [
        {
            tcid: '0',
            name: '@studio-card-title-search-smoke',
            path: '/studio.html',
            data: {
                cardid: '45e50a68-9bd7-4fc2-9665-12f39140a1be',
                searchTerm: 'MAS Automation Test Card',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @card-title-search @card-title-search-smoke',
        },
        {
            tcid: '1',
            name: '@studio-card-title-search-partial',
            path: '/studio.html',
            data: {
                cardid: '45e50a68-9bd7-4fc2-9665-12f39140a1be',
                searchTerm: 'Automation Test',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @card-title-search @card-title-search-partial',
        },
        {
            tcid: '2',
            name: '@studio-card-title-search-case-insensitive',
            path: '/studio.html',
            data: {
                cardid: '45e50a68-9bd7-4fc2-9665-12f39140a1be',
                searchTerm: 'mas automation test card',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @card-title-search @card-title-search-case',
        },
        {
            tcid: '3',
            name: '@studio-card-title-search-field-input',
            path: '/studio.html',
            data: {
                cardid: '45e50a68-9bd7-4fc2-9665-12f39140a1be',
                searchTerm: 'MAS Automation Test Card',
            },
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @card-title-search @card-title-search-field',
        },
    ],
};
