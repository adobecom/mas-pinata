import { expect, test } from '@playwright/test';
import { features } from './prodocs.spec.js';
import MasPro from './pro.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let acomPage;
let webUtil;

// Card breakpoint below which the What's included toggle is rendered (pro.js hides it from 1280px up).
const TOGGLE_VIEWPORT = { width: 1024, height: 900 };
const HEIGHT_TOLERANCE_PX = 1;

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

    async function openProGallery() {
        const page = workerSetup.getPage('US');
        acomPage = new MasPro(page);
        webUtil = new WebUtil(page);
        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO.US, expect);
        return page;
    }

    // @MAS-Pro
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            await openProGallery();
        });

        await test.step('step-2: Verify Pro Merch Card content', async () => {
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variant', 'pro');
            await expect(acomPage.getCardTitle(data.id)).toBeVisible();
            await expect(acomPage.getCardTitle(data.id)).not.toBeEmpty();
            await expect(acomPage.getCardPrice(data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id)).toContainText(/\d/);
            await expect(acomPage.getCardCTA(data.id)).toBeVisible();
            await expect(acomPage.getCardCTA(data.id)).toHaveAttribute('data-wcs-osi', /.+/);
        });
    });

    // @MAS-Pro-Light-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            await openProGallery();
        });

        await test.step('step-2: Verify Pro Merch Card light CSS', async () => {
            await expect(acomPage.getCard(data.id)).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.id), acomPage.cssProp.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTopCard(data.id), acomPage.cssProp.topCard)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.id), acomPage.cssProp.title)).toBeTruthy();
        });
    });

    // @MAS-Pro-Edu
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            await openProGallery();
        });

        await test.step('step-2: Verify Edu section cards carry the edu size', async () => {
            const cards = acomPage.getSectionCards('pro-edu');
            await expect(cards.first()).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('size', 'edu');
            for (const card of await cards.all()) {
                await expect(card).toHaveAttribute('size', 'edu');
            }
        });
    });

    // @MAS-Pro-Whats-Included
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        let page;
        let originalViewport;

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            page = await openProGallery();
            originalViewport = page.viewportSize();
            await page.setViewportSize(TOGGLE_VIEWPORT);
        });

        try {
            await test.step("step-2: Verify What's included content and quantity selector", async () => {
                await expect(acomPage.getCard(data.id)).toBeVisible();
                await expect(acomPage.getCardWhatsIncluded(data.id)).toHaveCount(1);
                await expect(acomPage.getCardQuantitySelector(data.id)).toBeVisible();
            });

            await test.step("step-3: Verify What's included toggle expands and collapses the list", async () => {
                const toggle = acomPage.getCardWhatsIncludedToggle(data.id);
                await toggle.scrollIntoViewIfNeeded();
                await expect(toggle).toBeVisible();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await expect(acomPage.getCardFeaturesZone(data.id)).toBeHidden();

                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'true');
                await expect(acomPage.getCardFeaturesZone(data.id)).toBeVisible();

                await toggle.click();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                await expect(acomPage.getCardFeaturesZone(data.id)).toBeHidden();
            });
        } finally {
            await page.setViewportSize(originalViewport);
        }
    });

    // @MAS-Pro-Row-Height-Sync
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];

        await test.step('step-1: Go to Pro Merch Card feature test page', async () => {
            await openProGallery();
        });

        for (const [index, section] of data.sections.entries()) {
            await test.step(`step-${index + 2}: Verify cards in the ${section} row have equal heights`, async () => {
                const cards = await acomPage.getSectionCards(section).all();
                expect(cards.length).toBeGreaterThan(1);
                for (const card of cards) {
                    await expect(card).toBeVisible();
                }
                const heights = [];
                for (const card of cards) {
                    heights.push((await card.boundingBox()).height);
                }
                const spread = Math.max(...heights) - Math.min(...heights);
                expect(spread).toBeLessThanOrEqual(HEIGHT_TOLERANCE_PX);
            });
        }
    });
});
