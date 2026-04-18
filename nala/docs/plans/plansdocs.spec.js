/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Plans Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Plans',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '5a5ca143-a417-4087-b466-5b72ac68a830',
            variant: 'plans',
            title: 'Acrobat Pro',
            cta: 'Buy now',
        },
        tags: '@mas-docs @mas-plans @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Plans-CTA-alignment',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {},
        tags: '@mas-docs @mas-plans @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Plans-Badge-No-Overlap',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '8373b5c2-69e6-4e9c-befc-b424dd33469b',
        },
        tags: '@mas-docs @mas-plans @mas-badge-overlap @commerce @regression',
    },
];
