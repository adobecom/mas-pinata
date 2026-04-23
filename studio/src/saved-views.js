import Store from './store.js';

const IMS_ORG_ID = '3B962FB55F5F922E0A495C88';

function ioBaseUrl() {
    return document.querySelector('meta[name="io-base-url"]')?.content;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
        accept: 'application/json',
        'x-gw-ims-org-id': IMS_ORG_ID,
    };
}

export async function loadSavedViews() {
    const base = ioBaseUrl();
    if (!base) return [];
    const response = await fetch(`${base}/preferences`, {
        method: 'GET',
        headers: authHeaders(),
    });
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    return Array.isArray(body?.savedViews) ? body.savedViews : [];
}

export async function saveSavedViews(views) {
    const base = ioBaseUrl();
    if (!base) throw new Error('io-base-url meta tag not found');
    const response = await fetch(`${base}/preferences`, {
        method: 'POST',
        headers: {
            ...authHeaders(),
            'content-type': 'application/json',
        },
        body: JSON.stringify({ savedViews: views }),
    });
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    return Array.isArray(body?.savedViews) ? body.savedViews : views;
}

export async function initSavedViews() {
    try {
        const views = await loadSavedViews();
        Store.savedViews.set(views);
    } catch (e) {
        console.error('Error initializing saved views', e);
    }
}
