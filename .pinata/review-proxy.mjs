#!/usr/bin/env node
// Piñata review proxy for mas-studio.
//
// Sits in front of `aem up` during the Piñata review phase so the reviewer
// agent can take authenticated screenshots without triggering the IMS
// redirect_uri mismatch.
//
// The `mas-studio` IMS client only allows `https://mas.adobe.com/studio.html`
// (and a couple of sibling URIs) as redirect targets, so loading studio.html
// from `http://localhost:<pinata-port>` never completes login. This proxy
// rewrites a single <script> tag in studio.html to replace the imslib bootstrap
// with a stub that reads a cached IMS access token + profile from /.pinata/auth
// and short-circuits straight into initMasStudio().
//
// Env contract:
//   FRONTEND_PORT        — port the proxy listens on (the one Pinata allocates)
//   AEM_UPSTREAM_PORT    — port `aem up` is bound to (sibling; by convention 10000 + FRONTEND_PORT)
//
// The auth cache is apps/mas/.pinata/auth-cache.json, populated by `just pinata-auth`.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LISTEN_PORT = parseInt(process.env.FRONTEND_PORT || process.argv[2] || '', 10);
const UPSTREAM_PORT = parseInt(
    process.env.AEM_UPSTREAM_PORT || process.argv[3] || String(LISTEN_PORT + 10000),
    10,
);
// Auth cache lives outside the worktree so all concurrent Piñata runs for mas
// share a single IMS token (one login per ~24h, not per run). Can be overridden
// via PINATA_AUTH_CACHE for tests.
const DEFAULT_CACHE = path.join(
    process.env.HOME || process.env.USERPROFILE || '/tmp',
    '.cache', 'pinata-mas', 'auth-cache.json',
);
const AUTH_CACHE_PATH = process.env.PINATA_AUTH_CACHE || DEFAULT_CACHE;

if (!Number.isFinite(LISTEN_PORT) || !Number.isFinite(UPSTREAM_PORT)) {
    console.error(`[pinata review proxy] invalid ports (listen=${LISTEN_PORT}, upstream=${UPSTREAM_PORT})`);
    process.exit(2);
}

// The single line in apps/mas/studio.html we rewrite. Any drift in this string
// (tag formatting, URL change) should fail loudly — a silent passthrough would
// re-introduce the IMS redirect_uri problem and make screenshots misleading.
const IMS_SCRIPT_TAG = '<script src="https://www.adobe.com/libs/deps/imslib.min.js"></script>';

// Inline bypass: fetch the cached IMS token/profile, seed sessionStorage +
// window.adobeIMS, then manually invoke the existing onReady() which calls
// initMasStudio() via a stubbed validateToken().
const BYPASS_SCRIPT = `<script>
(async () => {
    try {
        const res = await fetch('/.pinata/auth');
        if (!res.ok) throw new Error('auth fetch failed: HTTP ' + res.status);
        const { token, profile, expire } = await res.json();
        if (!token) throw new Error('auth cache has no token');
        sessionStorage.setItem('masAccessToken', token);
        const expireDate = new Date(expire || Date.now() + 3600000);
        window.adobeIMS = {
            initialized: true,
            getAccessToken: () => ({ token, expire: expireDate }),
            getProfile: () => Promise.resolve(profile || {}),
            isSignedInUser: () => true,
            signOut: () => {},
            signIn: () => {},
            validateToken: () => Promise.resolve(true),
        };
        if (typeof window.adobeid?.onReady === 'function') {
            window.adobeid.onReady();
        } else {
            console.warn('[pinata review] adobeid.onReady() not available');
        }
    } catch (e) {
        console.error('[pinata review] IMS bypass failed:', e);
        const banner = document.createElement('pre');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:16px;background:#fee;color:#900;font-family:monospace;z-index:99999;margin:0;white-space:pre-wrap';
        banner.textContent = '[pinata review] IMS bypass failed: ' + e.message + '\\n\\nRun: just pinata-auth (in apps/mas/) to refresh the token cache.';
        (document.body || document.documentElement).appendChild(banner);
    }
})();
</script>`;

function sendAuth(res) {
    let raw;
    try {
        raw = fs.readFileSync(AUTH_CACHE_PATH, 'utf8');
    } catch (e) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'auth cache missing',
            hint: 'run: just pinata-auth (in apps/mas/) to populate .pinata/auth-cache.json',
            path: AUTH_CACHE_PATH,
        }));
        return;
    }
    // Validate JSON before serving so the client sees a clean 500 rather than a parse error.
    try {
        JSON.parse(raw);
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'auth cache is not valid JSON', detail: e.message }));
        return;
    }
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
    });
    res.end(raw);
}

function forwardRequest(clientReq, clientRes, { rewrite }) {
    // When rewriting HTML, request identity encoding so we can do a plain string replace.
    const headers = { ...clientReq.headers, host: `localhost:${UPSTREAM_PORT}` };
    if (rewrite) {
        headers['accept-encoding'] = 'identity';
    }

    const upstreamReq = http.request({
        hostname: 'localhost',
        port: UPSTREAM_PORT,
        path: clientReq.url,
        method: clientReq.method,
        headers,
    }, (upstreamRes) => {
        if (!rewrite) {
            clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
            upstreamRes.pipe(clientRes);
            return;
        }

        const chunks = [];
        upstreamRes.on('data', (c) => chunks.push(c));
        upstreamRes.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            if (!body.includes(IMS_SCRIPT_TAG)) {
                // Fail loudly: if studio.html drifts, the rewrite must be updated in this file.
                clientRes.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                clientRes.end(
                    '[pinata review proxy] IMS rewrite target not found in /studio.html.\n' +
                    'Expected the exact line:\n  ' + IMS_SCRIPT_TAG + '\n\n' +
                    'The proxy HTML rewrite rule in apps/mas/.pinata/review-proxy.mjs needs updating\n' +
                    'to match the current studio.html.'
                );
                return;
            }
            const rewritten = body.replace(IMS_SCRIPT_TAG, BYPASS_SCRIPT);
            const outHeaders = { ...upstreamRes.headers };
            delete outHeaders['content-length'];
            delete outHeaders['content-encoding'];
            outHeaders['content-type'] = 'text/html; charset=utf-8';
            outHeaders['cache-control'] = 'no-store';
            clientRes.writeHead(upstreamRes.statusCode || 200, outHeaders);
            clientRes.end(rewritten);
        });
        upstreamRes.on('error', (e) => {
            if (!clientRes.headersSent) {
                clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
            }
            clientRes.end('upstream stream error: ' + e.message);
        });
    });

    upstreamReq.on('error', (e) => {
        if (!clientRes.headersSent) {
            clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        }
        clientRes.end(
            `[pinata review proxy] upstream (aem up) unreachable on :${UPSTREAM_PORT} — ${e.message}\n` +
            'Is `aem up` running? It should have been started by `just pinata-start`.'
        );
    });

    if (clientReq.method === 'GET' || clientReq.method === 'HEAD') {
        upstreamReq.end();
    } else {
        clientReq.pipe(upstreamReq);
    }
}

const server = http.createServer((req, res) => {
    let url;
    try {
        url = new URL(req.url, `http://localhost:${LISTEN_PORT}`);
    } catch {
        res.writeHead(400).end('bad url');
        return;
    }

    if (url.pathname === '/.pinata/auth') {
        sendAuth(res);
        return;
    }

    const rewrite = url.pathname === '/studio.html';
    forwardRequest(req, res, { rewrite });
});

server.on('error', (e) => {
    console.error(`[pinata review proxy] listen failed on :${LISTEN_PORT}: ${e.message}`);
    process.exit(1);
});

server.listen(LISTEN_PORT, () => {
    console.log(
        `[pinata review proxy] :${LISTEN_PORT} → :${UPSTREAM_PORT} ` +
        `(studio.html rewrite active, auth cache ${fs.existsSync(AUTH_CACHE_PATH) ? 'present' : 'MISSING — run: just pinata-auth'})`
    );
});

const shutdown = (sig) => {
    console.log(`[pinata review proxy] ${sig} received, closing`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
