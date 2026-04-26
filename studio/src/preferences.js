const IMS_ORG_ID = '3B962FB55F5F922E0A495C88';

function getEndpoint() {
    const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
    return `${ioBaseUrl}/preferences`;
}

function authHeaders() {
    return {
        Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
        accept: 'application/json',
        'x-gw-ims-org-id': IMS_ORG_ID,
    };
}

export async function loadPreferences() {
    try {
        const response = await fetch(getEndpoint(), {
            headers: authHeaders(),
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.savedViews)) {
            return { savedViews: [] };
        }
        return data;
    } catch (e) {
        console.error('Failed to load preferences', e);
        return { savedViews: [] };
    }
}

export async function savePreferences(savedViews) {
    const response = await fetch(getEndpoint(), {
        method: 'PUT',
        headers: {
            ...authHeaders(),
            'content-type': 'application/json',
        },
        body: JSON.stringify({ savedViews }),
    });
    if (!response.ok) {
        const message = `Failed to save preferences: ${response.status} ${response.statusText}`;
        console.error(message);
        throw new Error(message);
    }
    return response.json();
}
