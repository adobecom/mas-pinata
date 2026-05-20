export default {
    FeatureName: 'M@S Studio Collection Editor — Add card via link',
    features: [
        {
            tcid: '0',
            name: '@studio-collection-add-card-button-visible',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card @collection-smoke',
        },
        {
            tcid: '1',
            name: '@studio-collection-add-card-input-expand',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
        {
            tcid: '2',
            name: '@studio-collection-add-card-paste-link',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
                cardLink:
                    'https://mas.adobe.com/studio.html#page=content&path=nala&query=48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                successToast: 'Card added',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
        {
            tcid: '3',
            name: '@studio-collection-add-card-duplicate',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
                duplicateCardLink:
                    'https://mas.adobe.com/studio.html#page=content&path=nala&query=f7fdf15d-bcb0-40c4-9a8f-fa103fc640e7',
                duplicateError: 'Card already in collection',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
        {
            tcid: '4',
            name: '@studio-collection-add-card-invalid-link',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
                invalidValue: 'not-a-card-link',
                invalidError: 'Paste a valid card link',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
        {
            tcid: '5',
            name: '@studio-collection-add-card-blur-collapses-input',
            path: '/studio.html',
            data: {
                cardid: '198543ee-2ace-48be-be60-f3e7cc775608',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
    ],
};
