import { expect, test } from '@playwright/test';
import { features } from './prodocs.spec.js';
import MasPro from './pro.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, validateCommerceUrl, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let acomPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRO.US }],
});

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

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro Merch Card content', async () => {
            await expect(acomPage.getCard(data.id, data.section)).toBeVisible();
            await expect(acomPage.getCardTitle(data.id, data.section)).toBeVisible();
            await expect(acomPage.getCardTitle(data.id, data.section)).toContainText(data.title);
            await expect(acomPage.getCardDescription(data.id, data.section)).toBeVisible();
            await expect(acomPage.getCardDescription(data.id, data.section)).toContainText(data.description);
            await expect(acomPage.getCardPrice(data.id, data.section)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id, data.section)).toContainText(data.price);
            const cta = acomPage.getCardCTA(data.id, data.section).first();
            await expect(cta).toBeVisible();
            await expect(cta).toContainText(data.cta);
            await expect(cta).toHaveAttribute('data-wcs-osi', data.ctaOsi);
            const ctaHref = await cta.evaluate((el) => el.href);
            expect(validateCommerceUrl(ctaHref)).toBe(true);
        });
    });

    // @MAS-Pro-Light-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            const page = workerSetup.getPage('US');
            acomPage = new MasPro(page);
            webUtil = new WebUtil(page);

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro Merch Card light theme CSS', async () => {
            await expect(acomPage.getCard(data.id, data.section)).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.id, data.section), acomPage.cssProp.card)).toBeTruthy();
            expect(
                await webUtil.verifyCSS(acomPage.getCardTopCard(data.id, data.section), acomPage.cssProp.topCard),
            ).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.id, data.section), acomPage.cssProp.title)).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    acomPage.getCardDescription(data.id, data.section).first(),
                    acomPage.cssProp.description,
                ),
            ).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardPrice(data.id, data.section), acomPage.cssProp.price)).toBeTruthy();
        });
    });

    // @MAS-Pro-Edu
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            const page = workerSetup.getPage('US');
            acomPage = new MasPro(page);

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        });

        await test.step('step-2: Verify Pro Edu Merch Card variant and size', async () => {
            await expect(acomPage.getCard(data.id, data.section)).toBeVisible();
            await expect(acomPage.getCard(data.id, data.section)).toHaveAttribute('variant', 'pro');
            await expect(acomPage.getCard(data.id, data.section)).toHaveAttribute('size', data.size);
        });
    });

    // @MAS-Pro-Whats-Included
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        const page = workerSetup.getPage('US');

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            acomPage = new MasPro(page);

            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
            await page.setViewportSize({ width: 1280, height: 900 });
            await expect(acomPage.getCard(data.id, data.section)).toBeVisible();
        });

        await test.step('step-2: Verify What is included is always expanded on desktop', async () => {
            // At >=1280px the toggle is display:none and the features zone is forced visible.
            await expect(acomPage.getWhatsIncludedToggle(data.id, data.section)).toBeHidden();
            await expect(acomPage.getFeaturesZone(data.id, data.section)).toBeVisible();
            await expect(acomPage.getWhatsIncludedSection(data.id, data.section).first()).toBeVisible();
        });

        await test.step('step-3: Verify What is included toggle expands and collapses below 1280px', async () => {
            try {
                await page.setViewportSize({ width: 1024, height: 800 });
                const toggle = acomPage.getWhatsIncludedToggle(data.id, data.section);
                const featuresZone = acomPage.getFeaturesZone(data.id, data.section);
                await expect(toggle).toBeVisible();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await expect(featuresZone).not.toBeVisible();
                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'true');
                await expect(featuresZone).toBeVisible();
                await expect(acomPage.getWhatsIncludedSection(data.id, data.section).first()).toBeVisible();
                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            } finally {
                // The worker page is shared by the other tests: restore the desktop viewport.
                await page.setViewportSize({ width: 1280, height: 900 });
            }
        });

        await test.step('step-4: Verify the quantity selector is part of the card', async () => {
            // The fragment authors an unconfigured <merch-quantity-select>, which renders no license selector.
            await expect(acomPage.getCardQS(data.id, data.section)).toBeAttached();
        });
    });

    // @MAS-Pro-Row-Height-Sync
    test(`${features[4].name},${features[4].tags}`, async () => {
        const page = workerSetup.getPage('US');

        await test.step('step-1: Go to Pro page and wait for cards to render', async () => {
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.waitForSelector('merch-card[variant="pro"]', { timeout: 30000 });
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Verify cards in the same row share one top card height', async () => {
            const rows = await page.evaluate(() => {
                const cssVar = '--consonant-merch-card-pro-top-card-height';
                const cards = [...document.querySelectorAll('merch-card[variant="pro"]')].filter(
                    (c) => c.getBoundingClientRect().width > 2,
                );
                const rowMap = new Map();
                for (const card of cards) {
                    // Same grouping as the Pro variant: rows are cards sharing an offsetTop.
                    if (!rowMap.has(card.offsetTop)) rowMap.set(card.offsetTop, []);
                    rowMap.get(card.offsetTop).push(card.style.getPropertyValue(cssVar));
                }
                return [...rowMap.values()];
            });

            // The row height sync section holds two cards side by side.
            const syncedRows = rows.filter((row) => row.length >= 2);
            expect(syncedRows.length).toBeGreaterThan(0);

            for (const row of syncedRows) {
                const unique = new Set(row);
                expect(unique.size).toBe(1);
                expect([...unique][0]).toMatch(/^\d+(\.\d+)?px$/);
            }
        });
    });
});
