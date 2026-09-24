import { DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

const PRO_FRAGMENT_ID = '46e554aa-f273-4caa-a0b8-4491253d7ef2';

export const FeatureName = 'Merch Acom Pro Cards Feature';
export const features = [
    // PRO CARDS
    {
        tcid: '0',
        name: '@MAS-Pro',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, rowId: 'pro-light-row' },
        browserParams: '?theme=darkest',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Pro-Light-CSS',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, rowId: 'pro-light-row' },
        browserParams: '?theme=darkest',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Pro-Edu',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, rowId: 'pro-edu-row', size: 'edu' },
        browserParams: '?theme=darkest',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '3',
        name: '@MAS-Pro-Whats-Included',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { id: PRO_FRAGMENT_ID, rowId: 'pro-whats-included-row' },
        browserParams: '?theme=darkest',
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '4',
        name: '@MAS-Pro-Row-Height-Sync',
        path: DOCS_GALLERY_PATH.PRO.US,
        data: { rowIds: ['pro-light-row', 'pro-edu-row'] },
        browserParams: '?theme=darkest',
        tags: '@mas-docs @mas-acom @mas-pro-card @regression @milo',
    },
];
