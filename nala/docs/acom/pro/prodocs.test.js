import { expect, test } from '@playwright/test';
import { features } from './prodocs.spec.js';
import MasPro from './pro.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let acomPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRO.US }],
});

const TOP_CARD_HEIGHT_PROP = '--consonant-merch-card-pro-top-card-height';

test.describe('ACOM MAS Pro cards feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    // *** PRO CARDS: ***

    // @MAS-Pro
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            const page = workerSetup.getPage('US');
            acomPage = new MasPro(page);
            await page.setViewportSize({ width: 1280, height: 900 });

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro Merch Card content', async () => {
            await expect(acomPage.getCard(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCard(data.rowId, data.id)).toHaveAttribute('variant', 'pro');
            await expect(acomPage.getCardTitle(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCardTitle(data.rowId, data.id)).not.toHaveText('');
            await expect(acomPage.getCardDescription(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCardDescription(data.rowId, data.id)).not.toHaveText('');
            await expect(acomPage.getCardPrice(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.rowId, data.id)).not.toHaveText('');
            await expect(acomPage.getCardCTA(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCardCTA(data.rowId, data.id)).toHaveAttribute('data-wcs-osi', /.+/);
            await expect(acomPage.getCardCTA(data.rowId, data.id)).toHaveAttribute('data-analytics-id', /.+/);
        });
    });

    // @MAS-Pro-Light-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            const page = workerSetup.getPage('US');
            acomPage = new MasPro(page);
            webUtil = new WebUtil(page);
            await page.setViewportSize({ width: 1280, height: 900 });

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro light Merch Card CSS', async () => {
            await expect(acomPage.getCard(data.rowId, data.id)).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.rowId, data.id), acomPage.cssProp.card)).toBeTruthy();
            expect(
                await webUtil.verifyCSS(acomPage.getCardTopCard(data.rowId, data.id), acomPage.cssProp.topCard),
            ).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.rowId, data.id), acomPage.cssProp.title)).toBeTruthy();
            expect(
                await webUtil.verifyCSS(acomPage.getCardDescription(data.rowId, data.id).first(), acomPage.cssProp.description),
            ).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardPrice(data.rowId, data.id), acomPage.cssProp.price)).toBeTruthy();
        });
    });

    // @MAS-Pro-Edu
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            const page = workerSetup.getPage('US');
            acomPage = new MasPro(page);
            await page.setViewportSize({ width: 1280, height: 900 });

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro edu Merch Card', async () => {
            await expect(acomPage.getCard(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCard(data.rowId, data.id)).toHaveAttribute('variant', 'pro');
            await expect(acomPage.getCard(data.rowId, data.id)).toHaveAttribute('size', data.size);
            await expect(acomPage.getCardQuantitySelect(data.rowId, data.id)).toBeAttached();
            await expect(acomPage.getCardLicenseSelectTrigger(data.rowId, data.id)).toBeVisible();
        });
    });

    // @MAS-Pro-Whats-Included
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        let page;

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            page = workerSetup.getPage('US');
            acomPage = new MasPro(page);
            await page.setViewportSize({ width: 1280, height: 900 });

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        const toggle = () => acomPage.getCardWhatsIncludedToggle(data.rowId, data.id);
        const featuresZone = () => acomPage.getCardFeaturesZone(data.rowId, data.id);

        await test.step("step-2: Verify What's included is always expanded at 1280px", async () => {
            await expect(acomPage.getCard(data.rowId, data.id)).toBeVisible();
            await expect(acomPage.getCardQuantitySelect(data.rowId, data.id)).toBeAttached();
            await expect(acomPage.getCardLicenseSelectTrigger(data.rowId, data.id)).toBeVisible();
            await expect(toggle()).toBeHidden();
            await expect(featuresZone()).toBeVisible();
            await expect(acomPage.getCardWhatsIncluded(data.rowId, data.id)).toBeAttached();
        });

        await test.step('step-3: Verify the toggle expands and collapses below 1280px', async () => {
            await page.setViewportSize({ width: 1024, height: 800 });
            await expect(toggle()).toBeVisible();
            await expect(toggle()).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone()).not.toBeVisible();
            await toggle().click();
            await expect(toggle()).toHaveAttribute('aria-expanded', 'true');
            await expect(featuresZone()).toBeVisible();
            await toggle().click();
            await expect(toggle()).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone()).not.toBeVisible();
        });
    });

    // @MAS-Pro-Row-Height-Sync
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];
        let page;

        await test.step('step-1: Go to Pro page and wait for cards to render', async () => {
            page = workerSetup.getPage('US');
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.waitForSelector('merch-card[variant="pro"]', { timeout: 30000 });
        });

        // Groups the visible cards of each row container by rounded top position.
        const readRows = () =>
            page.evaluate(
                ({ rowIds, cssVar }) =>
                    rowIds.flatMap((rowId) => {
                        const container = document.getElementById(rowId);
                        const cards = [...container.querySelectorAll('merch-card[variant="pro"]')].filter(
                            (card) => card.getBoundingClientRect().width > 2,
                        );
                        const rows = new Map();
                        for (const card of cards) {
                            const top = Math.round(card.getBoundingClientRect().top);
                            if (!rows.has(top)) rows.set(top, []);
                            rows.get(top).push({
                                cssVar: card.style.getPropertyValue(cssVar),
                                topCardHeight: card.shadowRoot.querySelector('.top-card').getBoundingClientRect().height,
                            });
                        }
                        return [...rows.values()].map((row) => ({
                            rowId,
                            containerVar: container.style.getPropertyValue(cssVar),
                            cards: row,
                        }));
                    }),
                { rowIds: data.rowIds, cssVar: TOP_CARD_HEIGHT_PROP },
            );

        await test.step('step-2: Verify the height var is set on each card of a multi-card row, not on the container', async () => {
            await expect
                .poll(async () => (await readRows()).some((row) => row.cards.length > 1 && row.cards.every((c) => c.cssVar)), {
                    timeout: 30000,
                })
                .toBe(true);
            const rows = await readRows();
            for (const row of rows) {
                expect(row.containerVar).toBe('');
                if (row.cards.length < 2) continue;
                for (const card of row.cards) expect(card.cssVar).toMatch(/^\d+(\.\d+)?px$/);
            }
        });

        await test.step('step-3: Verify cards in the same row share one .top-card height', async () => {
            const rows = (await readRows()).filter((row) => row.cards.length > 1);
            expect(rows.length).toBeGreaterThan(0);
            for (const row of rows) {
                expect(new Set(row.cards.map((c) => c.cssVar)).size).toBe(1);
                const [first, ...rest] = row.cards.map((c) => c.topCardHeight);
                for (const height of rest) expect(Math.abs(height - first)).toBeLessThanOrEqual(1);
            }
        });
    });
});
