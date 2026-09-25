import { expect, test } from '@playwright/test';
import { features } from './prodocs.spec.js';
import MasPro from './pro.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, validateCommerceUrl, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let proPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRO.US }],
});

const goToProPage = async () => {
    const page = workerSetup.getPage('US');
    proPage = new MasPro(page);
    webUtil = new WebUtil(page);
    await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
    return page;
};

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

    // @MAS-Pro-Card
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Pro Merch Card docs page', async () => {
            await goToProPage();
        });

        await test.step('step-2: Verify Pro Merch Card content', async () => {
            const card = proPage.getCard(data.sectionId);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'pro');
            await expect(card.locator(`aem-fragment[fragment="${data.id}"]`)).toBeAttached();
            await expect(proPage.getCardTitle(card)).toBeVisible();
            await expect(proPage.getCardTitle(card)).not.toBeEmpty();
            await expect(proPage.getCardDescription(card)).toBeVisible();
            await expect(proPage.getCardDescription(card)).not.toBeEmpty();
            await expect(proPage.getCardPrice(card)).toBeVisible();
            await expect(proPage.getCardPrice(card)).not.toBeEmpty();
            const cta = proPage.getCardCTA(card);
            await expect(cta).toBeVisible();
            await expect(cta).toHaveAttribute('data-wcs-osi', /.+/);
            const href = await cta.getAttribute('href');
            expect(validateCommerceUrl(href)).toBeTruthy();
        });
    });

    // @MAS-Pro-Card-Light-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Pro Merch Card docs page', async () => {
            await goToProPage();
        });

        await test.step('step-2: Verify Pro Merch Card light theme CSS', async () => {
            const card = proPage.getCard(data.sectionId);
            await expect(card).toBeVisible();
            expect(await webUtil.verifyCSS(card, proPage.cssProp.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(proPage.getCardTopCard(card), proPage.cssProp.topCard)).toBeTruthy();
            expect(await webUtil.verifyCSS(proPage.getCardTitle(card), proPage.cssProp.title)).toBeTruthy();
            expect(await webUtil.verifyCSS(proPage.getCardDescription(card), proPage.cssProp.description)).toBeTruthy();
            expect(await webUtil.verifyCSS(proPage.getCardPrice(card), proPage.cssProp.price)).toBeTruthy();
        });
    });

    // @MAS-Pro-Card-Edu
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Pro Merch Card docs page', async () => {
            await goToProPage();
        });

        await test.step('step-2: Verify Pro Edu card', async () => {
            const card = proPage.getCard(data.sectionId);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'pro');
            await expect(card).toHaveAttribute('size', 'edu');
            await expect(proPage.getCardTitle(card)).toBeVisible();
            await expect(proPage.getCardCTA(card)).toBeVisible();
        });
    });

    // @MAS-Pro-Card-Whats-Included-Toggle
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        let page;

        await test.step('step-1: Go to Pro Merch Card docs page', async () => {
            page = await goToProPage();
        });

        try {
            await test.step('step-2: What is included is always expanded at 1280px and above', async () => {
                await page.setViewportSize({ width: 1280, height: 900 });
                const card = proPage.getCard(data.sectionId);
                await expect(card).toBeVisible();
                await expect(proPage.getCardWhatsIncludedToggle(card)).toBeHidden();
                await expect(proPage.getCardFeaturesZone(card)).toBeVisible();
            });

            await test.step('step-3: What is included toggle expands and collapses below 1280px', async () => {
                await page.setViewportSize({ width: 1024, height: 800 });
                const card = proPage.getCard(data.sectionId);
                const toggle = proPage.getCardWhatsIncludedToggle(card);
                const featuresZone = proPage.getCardFeaturesZone(card);
                await expect(toggle).toBeVisible();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await expect(featuresZone).not.toBeVisible();
                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'true');
                await expect(featuresZone).toBeVisible();
                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await expect(featuresZone).not.toBeVisible();
            });

            await test.step('step-4: Verify quantity selector', async () => {
                const card = proPage.getCard(data.sectionId);
                await expect(proPage.getCardQuantitySelector(card)).toBeVisible();
            });
        } finally {
            await page.setViewportSize({ width: 1280, height: 900 });
        }
    });

    // @MAS-Pro-Card-Row-Height-Sync
    test(`${features[4].name},${features[4].tags}`, async () => {
        let page;

        await test.step('step-1: Go to Pro page and wait for cards to render', async () => {
            page = await goToProPage();
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.waitForSelector('merch-card[variant="pro"]', { timeout: 30000 });
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Verify cards in the same row share one height', async () => {
            const rows = await page.evaluate(() => {
                const cards = [...document.querySelectorAll('merch-card[variant="pro"]')].filter(
                    (c) => c.getBoundingClientRect().width > 2,
                );
                const rowMap = new Map();
                for (const card of cards) {
                    const rowKey = Math.round(card.getBoundingClientRect().top);
                    if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
                    rowMap.get(rowKey).push(card.getBoundingClientRect().height);
                }
                return [...rowMap.values()];
            });

            expect(rows.some((heights) => heights.length >= 2)).toBeTruthy();
            for (const heights of rows) {
                expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
            }
        });
    });
});
