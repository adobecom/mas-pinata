/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Card Badge Overlap Prevention Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-MerchCard-badge-wrap-css',
        path: DOCS_GALLERY_PATH.MERCH_CARD,
        data: {
            cardSelector: 'merch-card#static',
            expectedBadgeText: 'Best value',
            expectedWhiteSpace: 'normal',
            expectedWordBreak: 'break-word',
        },
        tags: '@mas-docs @mas-merch-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-MerchCard-badge-height-reserved',
        path: DOCS_GALLERY_PATH.MERCH_CARD,
        data: {
            cardSelector: 'merch-card#static',
            longBadgeText: 'Jetzt kaufen und sparen mit Adobe Creative Cloud',
        },
        tags: '@mas-docs @mas-merch-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-MerchCard-badge-heading-no-overlap',
        path: DOCS_GALLERY_PATH.MERCH_CARD,
        data: {
            cardSelector: 'merch-card#static',
            longBadgeText: 'Jetzt kaufen und sparen mit Adobe Creative Cloud',
        },
        tags: '@mas-docs @mas-merch-card @commerce @smoke @regression @milo',
    },
];
