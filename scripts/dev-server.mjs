#!/usr/bin/env node
/**
 * dev-server.mjs — Lightweight AEM-compatible dev server for mas.
 *
 * Replaces `aem up` when the git branch name exceeds the 63-char DNS label
 * limit (e.g. feat-24-price-based-sort-merch-card-collection--mas--adobe-ai-pod).
 *
 * Behaviour:
 *   1. Serves files from the project root (local override takes priority).
 *   2. Proxies all other requests to AEM_ORIGIN (default: main branch live URL).
 *
 * Usage:
 *   BACKEND_PORT=9110 node scripts/dev-server.mjs
 *   AEM_ORIGIN=https://main--mas--adobe-ai-pod.aem.page node scripts/dev-server.mjs
 */

import { createServer } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '9110', 10);
const AEM_ORIGIN = process.env.AEM_ORIGIN || 'https://main--mas--adobe-ai-pod.aem.page';
const aemUrl = new URL(AEM_ORIGIN);

const MIME_TYPES = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.mjs':  'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.ico':  'image/x-icon',
    '.woff2':'font/woff2',
    '.woff': 'font/woff',
    '.ttf':  'font/ttf',
};

const CORS_HEADERS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    'access-control-allow-headers': '*',
    'access-control-expose-headers': '*',
};

function serveLocal(filePath, res) {
    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = statSync(filePath);
    res.writeHead(200, {
        'content-type': mime,
        'content-length': stat.size,
        ...CORS_HEADERS,
    });
    createReadStream(filePath).pipe(res);
}

function proxyToAem(req, res) {
    const options = {
        hostname: aemUrl.hostname,
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: aemUrl.hostname,
        },
    };

    const proxyReq = httpsRequest(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            ...CORS_HEADERS,
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`Proxy error for ${req.url}: ${err.message}`);
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.end(`Proxy error: ${err.message}`);
    });

    req.pipe(proxyReq);
}

const server = createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    // Normalise path: strip query string
    const urlPath = req.url.split('?')[0];

    // 1. Try serving the exact local file
    const localFile = join(ROOT_DIR, urlPath);
    if (existsSync(localFile) && statSync(localFile).isFile()) {
        serveLocal(localFile, res);
        return;
    }

    // 2. Try index.html for directory paths (SPA-style)
    if (urlPath.endsWith('/') || !extname(urlPath)) {
        const indexFile = join(ROOT_DIR, urlPath, 'index.html');
        if (existsSync(indexFile)) {
            serveLocal(indexFile, res);
            return;
        }
    }

    // 3. Proxy to AEM origin
    proxyToAem(req, res);
});

server.listen(PORT, () => {
    console.log(`[dev-server] Local AEM dev server up and running: http://localhost:${PORT}/`);
    console.log(`[dev-server] Proxying to ${AEM_ORIGIN}`);
    console.log(`[dev-server] Serving local files from ${ROOT_DIR}`);
});

process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
});
