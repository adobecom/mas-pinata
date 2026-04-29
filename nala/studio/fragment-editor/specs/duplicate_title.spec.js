export default {
    FeatureName: 'M@S Studio Fragment Editor Duplicate Title',
    features: [
        {
            tcid: '0',
            name: '@studio-create-duplicate-title-auto-rename',
            path: '/studio.html',
            data: {
                osi: 'puf',
                variant: 'ccd-suggested',
                folderPath: 'sandbox',
            },
            browserParams: '#page=content&path=sandbox',
            tags: '@mas-studio @fragment-editor @duplicate-title',
        },
        {
            tcid: '1',
            name: '@studio-edit-duplicate-title-auto-rename',
            path: '/studio.html',
            data: {
                osi: 'puf',
                variant: 'ccd-suggested',
                folderPath: 'sandbox',
            },
            browserParams: '#page=content&path=sandbox',
            tags: '@mas-studio @fragment-editor @duplicate-title',
        },
        {
            tcid: '2',
            name: '@studio-cross-folder-no-rename',
            path: '/studio.html',
            data: {
                osi: 'puf',
                variant: 'ccd-suggested',
                folderA: 'sandbox',
                folderB: 'nala',
            },
            browserParams: '#page=content&path=sandbox',
            tags: '@mas-studio @fragment-editor @duplicate-title',
        },
    ],
};
