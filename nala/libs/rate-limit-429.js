/**
 * HTTP 429 handling for Nala network traffic.
 *
 * When a call gets a 429 the hostname is paused for `Retry-After` (or 60 s when absent). Every other call to that
 * hostname waits too, across Playwright workers and across Nala runs on the same machine, because the pause is kept
 * in a small file store (one JSON file per hostname). Runs on different machines do not coordinate.
 *
 * NALA_429_HANDLER_DISABLED=1 turns the installers into no-ops; NALA_429_STATE_DIR overrides the store location.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

export const DEFAULT_WAIT_MS = 60000;
export const MAX_429_RETRIES = 3;

const LOCK_RETRY_MS = 25;
const LOCK_STALE_MS = 10000;
const API_METHODS = ['fetch', 'get', 'post', 'put', 'patch', 'delete', 'head'];

/** `hostname:pauseUntil` keys already announced by this process, so a resume is logged once per pause. */
const announcedResumes = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isDisabled = () => process.env.NALA_429_HANDLER_DISABLED === '1';

const log = (message) => console.info(`[NALA 429] ${message}`);

/**
 * Mirrors parseRetryAfter in io/studio/src/common.js (not imported: CommonJS IO Runtime module across an app boundary).
 * Only the fallback differs: 60 s here.
 * @param {string|undefined} headerValue Retry-After header: delay-seconds or HTTP-date.
 * @param {number} nowMs
 * @returns {{ waitMs: number, source: 'retry-after' | 'default-60s' }}
 */
export function parseRetryAfter(headerValue, nowMs = Date.now()) {
    if (headerValue) {
        const seconds = Number(headerValue);
        if (Number.isFinite(seconds)) return { waitMs: Math.max(0, seconds * 1000), source: 'retry-after' };
        const date = Date.parse(headerValue);
        if (!Number.isNaN(date)) return { waitMs: Math.max(0, date - nowMs), source: 'retry-after' };
    }
    return { waitMs: DEFAULT_WAIT_MS, source: 'default-60s' };
}

function resolveStateDir() {
    const dir = process.env.NALA_429_STATE_DIR || path.join(os.tmpdir(), 'nala-429-pauses');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

const recordFile = (hostname) => path.join(resolveStateDir(), `${encodeURIComponent(hostname)}.json`);

/**
 * @param {string} hostname
 * @returns {{ hostname: string, pauseUntil: number } | null} the stored pause record, or null when there is none.
 */
export function readPause(hostname) {
    try {
        return JSON.parse(fs.readFileSync(recordFile(hostname), 'utf8'));
    } catch {
        return null;
    }
}

async function withLock(lockDir, fn) {
    for (;;) {
        try {
            await fs.promises.mkdir(lockDir);
            break;
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
            try {
                const { mtimeMs } = await fs.promises.stat(lockDir);
                if (Date.now() - mtimeMs > LOCK_STALE_MS) await fs.promises.rmdir(lockDir);
            } catch {
                // the lock was released between the failed mkdir and the stat; retry
            }
            await sleep(LOCK_RETRY_MS);
        }
    }
    try {
        return await fn();
    } finally {
        await fs.promises.rmdir(lockDir).catch(() => {});
    }
}

/**
 * Pause a hostname for `waitMs`. An existing record is only ever extended, never shortened.
 * @param {{ hostname: string, waitMs: number, source: string, trigger: string }} pause
 * @returns {Promise<number>} the effective pauseUntil (epoch ms)
 */
export async function recordPause({ hostname, waitMs, source, trigger }) {
    const file = recordFile(hostname);
    const pauseUntil = await withLock(`${file}.lock`, async () => {
        const existing = readPause(hostname);
        const until = Math.max(existing?.pauseUntil ?? 0, Date.now() + waitMs);
        const record = { hostname, pauseUntil: until, source, trigger, pid: process.pid, updatedAt: Date.now() };
        const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
        await fs.promises.writeFile(tmp, JSON.stringify(record));
        await fs.promises.rename(tmp, file);
        return until;
    });
    log(
        `pause host=${hostname} wait=${Math.round(waitMs / 100) / 10}s source=${source} trigger=${trigger} ` +
            `until=${new Date(pauseUntil).toISOString()}`,
    );
    return pauseUntil;
}

/**
 * Resolve once the hostname is not paused. Re-reads the record after each sleep because another worker or run may have
 * extended the pause.
 * @param {string} hostname
 * @param {{ onWait?: (pauseUntil: number) => void }} [options]
 */
export async function waitForDomain(hostname, { onWait } = {}) {
    const startedAt = Date.now();
    let lastPauseUntil = 0;
    for (;;) {
        const pauseUntil = readPause(hostname)?.pauseUntil ?? 0;
        const remaining = pauseUntil - Date.now();
        if (remaining <= 0) break;
        lastPauseUntil = pauseUntil;
        onWait?.(pauseUntil);
        await sleep(remaining);
    }
    const key = `${hostname}:${lastPauseUntil}`;
    if (lastPauseUntil && !announcedResumes.has(key)) {
        announcedResumes.add(key);
        log(
            `resume host=${hostname} paused-until=${new Date(lastPauseUntil).toISOString()} ` +
                `waited=${Date.now() - startedAt}ms`,
        );
    }
}

const readPlaywrightResponse = (response) => ({
    status: response.status(),
    retryAfter: response.headers()['retry-after'],
});

const readFetchResponse = (response) => ({
    status: response.status,
    retryAfter: response.headers.get('retry-after') ?? undefined,
});

/**
 * Gate on the hostname, then call `send` until it stops answering 429 or the retries are spent.
 * The last response is returned untouched, so a persistent 429 fails exactly as it did before.
 * `read` extracts the status and Retry-After header from the kind of response `send` returns.
 */
async function sendWithRetry(send, { hostname, trigger, onWait, read = readPlaywrightResponse }) {
    await waitForDomain(hostname, { onWait });
    let response = await send();
    for (let retry = 0; read(response).status === 429 && retry < MAX_429_RETRIES; retry += 1) {
        const { waitMs, source } = parseRetryAfter(read(response).retryAfter);
        await recordPause({ hostname, waitMs, source, trigger });
        await waitForDomain(hostname, { onWait });
        response = await send();
    }
    return response;
}

/**
 * Build an `onWait` callback that extends the running test's timeout by the part of a pause not already covered.
 * @param {() => import('@playwright/test').TestInfo | null} getTestInfo returns null when no test is running
 */
export function createTimeoutExtender(getTestInfo) {
    let extendedFor = null;
    let coveredUntil = 0;
    return (pauseUntil) => {
        const testInfo = getTestInfo();
        if (!testInfo) return;
        if (testInfo !== extendedFor) {
            extendedFor = testInfo;
            coveredUntil = 0;
        }
        const extra = Math.max(0, pauseUntil - Math.max(Date.now(), coveredUntil));
        coveredUntil = Math.max(coveredUntil, pauseUntil);
        if (extra > 0) testInfo.setTimeout(testInfo.timeout + extra);
    };
}

/**
 * Gate and retry every http(s) request of a browser context on 429.
 * Page-level routes must use route.fallback() so requests reach this handler.
 * @param {import('@playwright/test').BrowserContext} context
 * @param {{ onWait?: (pauseUntil: number) => void }} [options]
 */
export async function install429HandlerOnContext(context, { onWait } = {}) {
    if (isDisabled()) return;
    await context.route('**/*', async (route) => {
        const request = route.request();
        const url = request.url();
        if (!/^https?:/.test(url)) {
            await route.fallback();
            return;
        }
        let response;
        try {
            // maxRedirects: 0 lets the browser follow redirects itself so page.url() stays correct
            response = await sendWithRetry(() => route.fetch({ maxRedirects: 0 }), {
                hostname: new URL(url).hostname,
                trigger: `${request.method()} ${url}`,
                onWait,
            });
        } catch {
            // let the browser produce its native failure
            await route.continue();
            return;
        }
        await route.fulfill({ response });
    });
}

/**
 * Wrap a Playwright APIRequestContext so fetch/get/post/put/patch/delete/head gate and retry on 429.
 * Calls with failOnStatusCode: true, or whose URL cannot be resolved, pass through unchanged.
 * @param {import('@playwright/test').APIRequestContext} ctx
 * @param {{ baseURL?: string, onWait?: (pauseUntil: number) => void }} [options]
 */
export function wrapApiRequestContext(ctx, { baseURL, onWait } = {}) {
    if (isDisabled()) return ctx;
    return new Proxy(ctx, {
        get(target, prop) {
            const value = Reflect.get(target, prop, target);
            if (typeof value !== 'function') return value;
            if (!API_METHODS.includes(prop)) return value.bind(target);
            return async (urlOrRequest, options) => {
                let url;
                try {
                    url = new URL(urlOrRequest.url?.() ?? urlOrRequest, baseURL);
                } catch {
                    return value.call(target, urlOrRequest, options);
                }
                if (options?.failOnStatusCode) return value.call(target, urlOrRequest, options);
                const method = (
                    options?.method ?? (prop === 'fetch' ? (urlOrRequest.method?.() ?? 'GET') : prop)
                ).toUpperCase();
                return sendWithRetry(() => value.call(target, urlOrRequest, options), {
                    hostname: url.hostname,
                    trigger: `${method} ${url.href}`,
                    onWait,
                });
            };
        },
    });
}

/**
 * Node `fetch` with the same gate, retry and logging as the Playwright paths, for code that runs outside a test
 * (global setup). Calls whose URL cannot be parsed pass through unchanged.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWith429Retry(url, options = {}) {
    const send = () => fetch(url, options);
    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch {
        return send();
    }
    if (isDisabled()) return send();
    return sendWithRetry(send, {
        hostname,
        trigger: `${(options.method ?? 'GET').toUpperCase()} ${url}`,
        read: readFetchResponse,
    });
}
