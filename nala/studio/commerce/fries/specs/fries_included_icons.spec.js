export default {
    FeatureName: 'M@S Studio Commerce Fries Included Icons',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-included-icons-save',
            path: '/studio.html',
            data: {
                // TODO: replace with a real Fries test card id once fixtures are set up
                cardid: 'c0a37a89-c3e7-4bdb-a298-c43b89e2a781',
                expectedIconCount: 2,
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-included-icons',
        },
    ],
};
