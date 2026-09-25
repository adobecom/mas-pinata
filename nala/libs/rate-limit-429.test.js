import { test, expect, request } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import {
    fetchWith429Retry,
    install429HandlerOnContext,
    parseRetryAfter,
    readPause,
    recordPause,
    wrapApiRequestContext,
} from './rate-limit-429.js';

test.use({ storageState: { cookies: [], origins: [] } });

const MODULE_URL = pathToFileURL(path.resolve(import.meta.dirname, 'rate-limit-429.js')).href;

let servers = [];
let originalInfo;
let logs;

/**
 * Local server: `/api` answers 429 (with the given Retry-After) for the first `limit429` hits, then 200.
 * Listens on all interfaces so both 127.0.0.1 and localhost reach it.
 */
async function startServer({ limit429 = 1, retryAfter = '1' } = {}) {
    const server = { hits: 0 };
    server.http = http.createServer((req, res) => {
        if (req.url === '/api') {
            server.hits += 1;
            if (server.hits <= limit429) {
                res.writeHead(429, retryAfter === undefined ? {} : { 'Retry-After': retryAfter });
                res.end('slow down');
                return;
            }
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body>ok</body></html>');
    });
    await new Promise((resolve) => server.http.listen(0, resolve));
    server.port = server.http.address().port;
    servers.push(server);
    return server;
}

test.beforeEach(() => {
    process.env.NALA_429_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nala-429-test-'));
    logs = [];
    originalInfo = console.info;
    console.info = (...args) => logs.push(args.join(' '));
});

test.afterEach(async () => {
    console.info = originalInfo;
    await Promise.all(
        servers.map((s) => {
            s.http.closeAllConnections();
            return new Promise((resolve) => s.http.close(resolve));
        }),
    );
    servers = [];
    fs.rmSync(process.env.NALA_429_STATE_DIR, { recursive: true, force: true });
    delete process.env.NALA_429_STATE_DIR;
});

const fetchStatus = (page) => page.evaluate(() => fetch('/api').then((r) => r.status));

test('parseRetryAfter handles seconds, HTTP date, absent and unparseable values', () => {
    expect(parseRetryAfter('5')).toEqual({ waitMs: 5000, source: 'retry-after' });
    const inThreeSeconds = new Date(Date.now() + 3000).toUTCString();
    const { waitMs, source } = parseRetryAfter(inThreeSeconds);
    expect(source).toBe('retry-after');
    expect(waitMs).toBeGreaterThan(1500);
    expect(waitMs).toBeLessThanOrEqual(3000);
    expect(parseRetryAfter(undefined)).toEqual({ waitMs: 60000, source: 'default-60s' });
    expect(parseRetryAfter('abc')).toEqual({ waitMs: 60000, source: 'default-60s' });
});

test('browser request is paused for Retry-After, retried and logged', async ({ page }) => {
    const server = await startServer({ limit429: 1, retryAfter: '1' });
    await install429HandlerOnContext(page.context());
    await page.goto(`http://127.0.0.1:${server.port}/`);

    const startedAt = Date.now();
    expect(await fetchStatus(page)).toBe(200);

    expect(server.hits).toBe(2);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(990);
    const output = logs.join('\n');
    expect(output).toMatch(
        new RegExp(
            `pause host=127\\.0\\.0\\.1 wait=1s source=retry-after trigger=GET http://127\\.0\\.0\\.1:${server.port}/api`,
        ),
    );
    expect(output).toContain('[NALA 429] resume host=127.0.0.1');
});

test('gives up after 3 retries and hands the 429 to the page', async ({ page }) => {
    const server = await startServer({ limit429: Infinity, retryAfter: '0' });
    await install429HandlerOnContext(page.context());
    await page.goto(`http://127.0.0.1:${server.port}/`);

    expect(await fetchStatus(page)).toBe(429);
    expect(server.hits).toBe(4);
});

test('a paused hostname does not delay other hostnames', async ({ page }) => {
    const server = await startServer({ limit429: 0 });
    await recordPause({ hostname: '127.0.0.1', waitMs: 30000, source: 'retry-after', trigger: 'test' });
    await install429HandlerOnContext(page.context());

    const startedAt = Date.now();
    await page.goto(`http://localhost:${server.port}/`);
    expect(Date.now() - startedAt).toBeLessThan(5000);
});

test('honours a pause recorded by another process', async ({ page }) => {
    const server = await startServer({ limit429: 0 });
    execFileSync(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            `import { recordPause } from ${JSON.stringify(MODULE_URL)};
             await recordPause({ hostname: '127.0.0.1', waitMs: 2000, source: 'retry-after', trigger: 'child' });`,
        ],
        { env: process.env },
    );
    const { pauseUntil } = readPause('127.0.0.1');
    await install429HandlerOnContext(page.context());

    await page.goto(`http://127.0.0.1:${server.port}/`);
    expect(Date.now()).toBeGreaterThanOrEqual(pauseUntil);
});

test('concurrent recordPause calls keep valid JSON with the later pauseUntil', async () => {
    const [short, long] = await Promise.all([
        recordPause({ hostname: 'example.test', waitMs: 1000, source: 'retry-after', trigger: 'a' }),
        recordPause({ hostname: 'example.test', waitMs: 5000, source: 'retry-after', trigger: 'b' }),
    ]);
    expect(short).toBeLessThanOrEqual(long);
    expect(readPause('example.test').pauseUntil).toBe(long);
});

test('wrapApiRequestContext retries a 429 from an APIRequestContext', async () => {
    const server = await startServer({ limit429: 1, retryAfter: '1' });
    const baseURL = `http://127.0.0.1:${server.port}`;
    const ctx = wrapApiRequestContext(await request.newContext({ baseURL }), { baseURL });

    const startedAt = Date.now();
    const response = await ctx.get('/api');
    expect(response.status()).toBe(200);
    expect(server.hits).toBe(2);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(990);
    expect(logs.join('\n')).toContain(`trigger=GET ${baseURL}/api`);
    await ctx.dispose();
});

test('fetchWith429Retry retries a 429 from Node fetch', async () => {
    const server = await startServer({ limit429: 1, retryAfter: '1' });
    const url = `http://127.0.0.1:${server.port}/api`;

    const startedAt = Date.now();
    const response = await fetchWith429Retry(url, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(server.hits).toBe(2);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(990);
    expect(logs.join('\n')).toContain(`trigger=HEAD ${url}`);
});
