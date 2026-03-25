import { ADOBE_PRODUCTS } from '../constants/adobe-products.js';

const productTerms = ADOBE_PRODUCTS.flatMap(({ id, name }) => [
    id.toLowerCase(),
    name.toLowerCase(),
]);

export const ADOBE_KEYWORDS = new Set([
    ...productTerms,
    'adobe',
    'creative cloud',
    'document cloud',
    'experience cloud',
    'digital experience',
    'aem',
    'adobeexperience',
    'marketo',
    'analytics',
    'target',
    'campaign',
    'journey optimizer',
    'real-time cdp',
    'audience manager',
    'workfront',
    'commerce',
    'magento',
    'sensei',
    'mas',
    'merch',
    'ost',
    'offer selector',
]);

export const PROMPT_SUGGESTIONS = [
    { label: 'Photoshop plans', query: 'Photoshop' },
    { label: 'Creative Cloud', query: 'Creative Cloud' },
    { label: 'Acrobat Pro', query: 'Acrobat Pro' },
    { label: 'Adobe Express', query: 'Adobe Express' },
    { label: 'Lightroom', query: 'Lightroom' },
    { label: 'Firefly', query: 'Firefly' },
    { label: 'AEM', query: 'AEM' },
    { label: 'Marketo', query: 'Marketo' },
];

export function isAdobeRelatedQuery(query) {
    if (!query || !query.trim()) return true;
    const lower = query.toLowerCase();
    for (const keyword of ADOBE_KEYWORDS) {
        if (lower.includes(keyword)) return true;
    }
    return false;
}
