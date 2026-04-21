import { expect, test } from '@playwright/test';
import { features } from './merchcarddocs.spec.js';
import MasMerchCard from './merchcard.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let merchCardPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.MERCH_CARD }],
});

test.describe('Merch Card badge overlap prevention feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        // eslint-disable-line no-empty-pattern
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    // @MAS-MerchCard-badge-wrap-css — Long badge text must wrap instead of clipping.
    test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to merch-card docs page', async () => {
            const page = workerSetup.getPage('US');
            merchCardPage = new MasMerchCard(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MERCH_CARD, expect);
        });

        await test.step('step-2: Verify badge exists and carries wrap CSS', async () => {
            const card = merchCardPage.getStaticCard();
            await expect(card).toBeVisible();
            const badge = merchCardPage.getBadge(card);
            await expect(badge).toBeVisible();
            await expect(badge).toContainText(data.expectedBadgeText);
            await expect(badge).toHaveCSS('white-space', data.expectedWhiteSpace);
            await expect(badge).toHaveCSS('word-break', data.expectedWordBreak);
        });
    });

    // @MAS-MerchCard-badge-height-reserved — --badge-height is written to the host and reflected in body padding.
    test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to merch-card docs page', async () => {
            const page = workerSetup.getPage('US');
            merchCardPage = new MasMerchCard(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MERCH_CARD, expect);
        });

        await test.step('step-2: Inject long badge text and verify --badge-height is reserved on host', async () => {
            const page = workerSetup.getPage('US');
            const longText = data.longBadgeText;

            const result = await page.evaluate(
                async ({ selector, text }) => {
                    const card = document.querySelector(selector);
                    if (!card) return { error: 'card-not-found' };
                    card.setAttribute('badge-text', text);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    const badgeEl = card.shadowRoot?.getElementById('badge');
                    const badgeHeight = card.style.getPropertyValue('--badge-height');
                    return {
                        badgeHeight,
                        badgeOffsetHeight: badgeEl?.offsetHeight ?? 0,
                    };
                },
                { selector: data.cardSelector, text: longText },
            );

            expect(result.error).toBeUndefined();
            expect(result.badgeHeight).toMatch(/^\d+px$/);
            expect(result.badgeOffsetHeight).toBeGreaterThan(0);

            const heightPx = parseInt(result.badgeHeight, 10);
            expect(heightPx).toBeGreaterThanOrEqual(result.badgeOffsetHeight);
        });
    });

    // @MAS-MerchCard-badge-heading-no-overlap — Wrapped badge and heading do not overlap vertically.
    test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to merch-card docs page', async () => {
            const page = workerSetup.getPage('US');
            merchCardPage = new MasMerchCard(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MERCH_CARD, expect);
        });

        await test.step('step-2: Set long badge text and verify heading drops below the badge pill', async () => {
            const page = workerSetup.getPage('US');

            await page.evaluate(
                async ({ selector, text }) => {
                    const card = document.querySelector(selector);
                    if (!card) return;
                    card.setAttribute('badge-text', text);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                },
                { selector: data.cardSelector, text: data.longBadgeText },
            );

            const card = merchCardPage.getStaticCard();
            await card.scrollIntoViewIfNeeded();
            const badge = merchCardPage.getBadge(card);
            const heading = merchCardPage.getHeading(card);

            await expect(badge).toBeVisible();
            await expect(heading).toBeVisible();

            const badgeBox = await badge.boundingBox();
            const headingBox = await heading.boundingBox();
            expect(badgeBox).not.toBeNull();
            expect(headingBox).not.toBeNull();

            expect(headingBox.y).toBeGreaterThanOrEqual(badgeBox.y + badgeBox.height - 1);
        });
    });
});
