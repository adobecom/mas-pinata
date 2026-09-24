import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

// Only fragment 46e554aa is published for Pro (sandbox, edu size, light theme,
// with What's included). Dark and Wide galleries wait for their fragments.
const PRO_FRAGMENT_ID = '46e554aa-f273-4caa-a0b8-4491253d7ef2';

export const FeatureName = 'Merch Acom Pro Cards Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Pro',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: {
            id: PRO_FRAGMENT_ID,
            section: 'pro-light',
            title: 'Creative Cloud Pro',
            subtitle: 'All-in-one toolkit',
            description: 'Save 71% on 20+ creative apps',
            price: PRICE_PATTERN.US.mo,
            cta: 'Free trial',
            ctaOsi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
        },
        browserParams: '',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Pro-Light-CSS',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, section: 'pro-light' },
        browserParams: '',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Pro-Edu',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, section: 'pro-edu', size: 'edu' },
        browserParams: '',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '3',
        name: '@MAS-Pro-Whats-Included',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, section: 'pro-whats-included' },
        browserParams: '',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '4',
        name: '@MAS-Pro-Row-Height-Sync',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: {},
        browserParams: '',
        tags: '@mas-docs @mas-acom @mas-pro-card @regression @milo',
    },
];
