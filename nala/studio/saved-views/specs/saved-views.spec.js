export default {
    FeatureName: 'M@S Studio Saved Views',
    features: [
        {
            tcid: '0',
            name: '@studio-saved-views-save-apply-delete',
            path: '/studio.html',
            data: {
                viewName: 'Nala saved view',
                browserParamsContent: '#page=content&path=acom&locale=fr_FR&tags=mas:product/photoshop',
                browserParamsReset: '#page=content&path=acom&locale=en_US',
                expectedFilterCount: '1',
                expectedHashKeys: ['path=acom', 'locale=fr_FR', 'tags=mas:product/photoshop'],
            },
            tags: '@mas-studio @saved-views @saved-views-crud',
        },
    ],
};
