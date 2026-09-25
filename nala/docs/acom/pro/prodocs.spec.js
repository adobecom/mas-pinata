import { DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Pro Cards Feature';

const CARD_FRAGMENT_ID = '46e554aa-f273-4caa-a0b8-4491253d7ef2';

export const features = [
    {
        tcid: '0',
        name: '@MAS-Pro',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { cardid: CARD_FRAGMENT_ID, id: 'pro-light-1' },
        tags: '@mas-docs @mas-pro-card @commerce @regression',
    },
    {
        tcid: '1',
        name: '@MAS-Pro-Light-CSS',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { cardid: CARD_FRAGMENT_ID, id: 'pro-light-1' },
        tags: '@mas-docs @mas-pro-card @commerce @regression',
    },
    {
        tcid: '2',
        name: '@MAS-Pro-Edu',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { cardid: CARD_FRAGMENT_ID, id: 'pro-edu-1' },
        tags: '@mas-docs @mas-pro-card @commerce @regression',
    },
    {
        tcid: '3',
        name: '@MAS-Pro-Whats-Included',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { cardid: CARD_FRAGMENT_ID, id: 'pro-wi-1' },
        tags: '@mas-docs @mas-pro-card @commerce @regression',
    },
    {
        tcid: '4',
        name: '@MAS-Pro-Row-Height-Sync',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { cardid: CARD_FRAGMENT_ID, sections: ['pro-light', 'pro-edu', 'pro-wi'] },
        tags: '@mas-docs @mas-pro-card @commerce @regression',
    },
];
