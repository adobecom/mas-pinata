import { expect, test, setTestPage } from '../../../libs/mas-test.js';
import { features } from '../specs/badge.spec.js';
import BadgePage from '../badge.page.js';
import { constructTestUrl } from '../../../utils/commerce.js';

let badgePage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

test.describe('Merch Card badge-row feature test suite', () => {
    test.beforeEach(async ({ page }) => {
        badgePage = new BadgePage(page);
    });

    // @MAS-Badge-row-product — badge renders inside a dedicated full-width .badge-row wrapper
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = constructTestUrl(baseURL, features[0].path);
        setTestPage(testPage);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to Product docs page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Card is visible with expected variant', async () => {
            const card = badgePage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
        });

        await test.step('step-3: Badge row is present and contains legacy badge text', async () => {
            const badgeRow = badgePage.getBadgeRow(data.id);
            await expect(badgeRow).toBeVisible();
            await expect(badgeRow).toContainText(data.badge);
        });

        await test.step('step-4: Badge row is block-level (display: block)', async () => {
            const badgeRow = badgePage.getBadgeRow(data.id);
            await expect(badgeRow).toHaveCSS('display', 'block');
        });

        await test.step('step-5: Card host reflects has-badge attribute', async () => {
            const card = badgePage.getCard(data.id);
            await expect(card).toHaveAttribute('has-badge', '');
        });

        await test.step('step-6: Cards without a badge do not have has-badge and have a collapsed badge row', async () => {
            const noBadgeCards = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('merch-card'));
                return cards
                    .filter((card) => {
                        const hasSlotted = !!card.querySelector(':scope > [slot="badge"]');
                        const hasLegacy = !!card.shadowRoot?.querySelector('.badge-row #badge');
                        return !hasSlotted && !hasLegacy;
                    })
                    .map((card) => ({
                        hasBadgeAttr: card.hasAttribute('has-badge'),
                        badgeRowHeight:
                            card.shadowRoot?.querySelector('.badge-row')?.getBoundingClientRect().height ?? null,
                        badgeRowDisplay:
                            card.shadowRoot?.querySelector('.badge-row') &&
                            window.getComputedStyle(card.shadowRoot.querySelector('.badge-row')).display,
                    }));
            });

            for (const card of noBadgeCards) {
                expect(card.hasBadgeAttr).toBe(false);
                expect(card.badgeRowHeight).toBe(0);
                expect(card.badgeRowDisplay).toBe('none');
            }
        });
    });

    // @MAS-Badge-row-not-absolute — badge row uses normal flow, never position: absolute
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = constructTestUrl(baseURL, features[1].path);
        setTestPage(testPage);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to Product docs page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Card is visible', async () => {
            await expect(badgePage.getCard(data.id)).toBeVisible();
        });

        await test.step('step-3: Badge row has non-absolute position', async () => {
            const badgeRow = badgePage.getBadgeRow(data.id);
            await expect(badgeRow).not.toHaveCSS('position', 'absolute');
        });

        await test.step('step-4: Slotted badge element is visible on the card', async () => {
            const slottedBadge = badgePage.getSlottedBadge(data.id);
            await expect(slottedBadge).toBeVisible();
        });
    });

    // @MAS-Badge-row-precedes-heading — badge row is the block-start element of the card body
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = constructTestUrl(baseURL, features[2].path);
        setTestPage(testPage);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to Product docs page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Card is visible', async () => {
            await expect(badgePage.getCard(data.id)).toBeVisible();
        });

        await test.step('step-3: Badge row top is at or above card heading top', async () => {
            const badgeRow = badgePage.getBadgeRow(data.id);
            const heading = badgePage.getHeading(data.id);
            await expect(badgeRow).toBeVisible();
            await expect(heading).toBeVisible();
            const [badgeBox, headingBox] = await Promise.all([badgeRow.boundingBox(), heading.boundingBox()]);
            expect(badgeBox).not.toBeNull();
            expect(headingBox).not.toBeNull();
            expect(badgeBox.y).toBeLessThanOrEqual(headingBox.y);
        });
    });
});
