export default {
    FeatureName: 'M@S Studio Collection Editor — Add card via link',
    features: [
        {
            tcid: '0',
            name: '@studio-collection-add-card-button-visible',
            path: '/studio.html',
            data: {
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card @collection-smoke',
        },
        {
            tcid: '1',
            name: '@studio-collection-add-card-input-expand',
            path: '/studio.html',
            data: {
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
        {
            tcid: '2',
            name: '@studio-collection-add-card-paste-link',
            path: '/studio.html',
            data: {
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
                cardLink:
                    'TODO-replace-with-actual-card-link-https://mas.adobe.com/studio.html#page=content&path=nala&query=<id>',
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
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
                duplicateCardLink: 'TODO-replace-with-link-to-card-already-in-collection',
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
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
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
                cardid: 'TODO-replace-with-actual-collection-fragment-id',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @collection @collection-add-card',
        },
    ],
};
