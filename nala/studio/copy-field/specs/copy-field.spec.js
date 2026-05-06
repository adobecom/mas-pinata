export default {
    FeatureName: 'M@S Studio Side-Nav Copy Field',
    features: [
        {
            tcid: '0',
            name: '@studio-copy-field-prices-match-preview',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                fieldDisplayName: 'Prices',
                taxLabelPattern: /\bTTC\b|inkl\.\s*MwSt/i,
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @copy-field @copy-field-non-vat',
        },
        {
            tcid: '1',
            name: '@studio-copy-field-prices-match-preview-vat-locale',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                fieldDisplayName: 'Prices',
                localePicker: 'French (FR)',
                locale: 'fr_FR',
                taxLabelPattern: /\bTTC\b|inkl\.\s*MwSt/i,
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @copy-field @copy-field-vat',
        },
    ],
};
