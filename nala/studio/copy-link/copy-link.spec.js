export default {
    FeatureName: 'M@S Studio - Copy Link from Table View',
    features: [
        {
            tcid: '0',
            name: '@studio-copy-link-table-row',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                expectedPath: 'nala',
                expectedContentType: 'merch-card',
            },
            tags: '@mas-studio @copy-link',
        },
        {
            tcid: '1',
            name: '@studio-copy-link-variation-row',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                expectedPath: 'nala',
                expectedContentType: 'merch-card',
            },
            tags: '@mas-studio @copy-link',
        },
    ],
};
