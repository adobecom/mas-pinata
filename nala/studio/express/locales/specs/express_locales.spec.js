export default {
    FeatureName: 'M@S Studio EXPRESS Locales (KE and MU)',
    features: [
        {
            tcid: '0',
            name: '@studio-express-locales-ke-mu',
            path: '/studio.html',
            browserParams: '#page=content&path=nala&query=',
            data: {
                surface: 'express',
                localesModule: '/io/www/src/fragment/locales.js',
                ke: { lang: 'en', country: 'KE', name: 'Kenya', flag: '🇰🇪' },
                mu: { lang: 'en', country: 'MU', name: 'Mauritius', flag: '🇲🇺' },
                expectedDefault: 'en_US',
                surfacesWithoutKE: ['ccd', 'adobe-home', 'commerce'],
            },
            tags: '@mas-studio @express @express-locales @smoke @regression',
        },
    ],
};
