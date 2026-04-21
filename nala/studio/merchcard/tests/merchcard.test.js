import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import MerchcardPage from '../merchcard.page.js';
import MerchcardSpec from '../specs/merchcard.spec.js';

const { features } = MerchcardSpec;

test.describe('M@S Studio Merch-Card Badge Height test suite', () => {
    // @studio-merchcard-badge-height-clearance — badge-text card exposes --badge-height and title clears it
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const merchcard = new MerchcardPage(page);

        await test.step('step-1: Go to test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate merch-card is visible with badge-text attribute', async () => {
            await studio.waitForCardsLoaded();
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('badge-text', /.+/);
        });

        await test.step('step-3: Validate --badge-height custom property is set on the host', async () => {
            const card = merchcard.getCardById(data.cardid);
            await expect
                .poll(async () => merchcard.getCssVariable(card, '--badge-height'), {
                    message: 'expected --badge-height to be published by ResizeObserver',
                    timeout: 10000,
                })
                .toMatch(/^\d+px$/);
            const rendered = await merchcard.getBadgeRenderedHeight(card);
            expect(rendered).toBeGreaterThan(0);
        });

        await test.step('step-4: Validate card title slot padding clears the badge height', async () => {
            const card = merchcard.getCardById(data.cardid);
            const padding = await merchcard.getTitlePaddingBlockStart(card, data.titleSlot);
            expect(padding).not.toBeNull();
            const paddingPx = Number.parseFloat(padding);
            expect(Number.isFinite(paddingPx)).toBe(true);
            expect(paddingPx).toBeGreaterThanOrEqual(0);
            const badgeHeight = await merchcard.getBadgeRenderedHeight(card);
            const expectedMin = Math.max(0, badgeHeight - data.spacingXs);
            expect(paddingPx).toBeGreaterThanOrEqual(expectedMin - 1);
        });
    });

    // @studio-merchcard-badge-removed-no-extra-padding — removing badge-text attribute drops the extra padding
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const merchcard = new MerchcardPage(page);

        await test.step('step-1: Go to test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate merch-card is visible with badge-text attribute', async () => {
            await studio.waitForCardsLoaded();
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('badge-text', /.+/);
        });

        let paddingWithBadgePx = 0;
        await test.step('step-3: Capture title padding-block-start while badge-text is set', async () => {
            const card = merchcard.getCardById(data.cardid);
            await expect
                .poll(async () => merchcard.getCssVariable(card, '--badge-height'), {
                    message: 'expected --badge-height to be published by ResizeObserver',
                    timeout: 10000,
                })
                .toMatch(/^\d+px$/);
            const padding = await merchcard.getTitlePaddingBlockStart(card, data.titleSlot);
            paddingWithBadgePx = Number.parseFloat(padding);
            expect(Number.isFinite(paddingWithBadgePx)).toBe(true);
        });

        await test.step('step-4: Remove badge-text attribute and confirm extra padding is dropped', async () => {
            const card = merchcard.getCardById(data.cardid);
            await merchcard.removeBadgeAttribute(card);
            await expect(card).not.toHaveAttribute('badge-text', /.+/);
            const paddingWithoutBadge = await merchcard.getTitlePaddingBlockStart(card, data.titleSlot);
            expect(paddingWithoutBadge).not.toBeNull();
            const paddingWithoutBadgePx = Number.parseFloat(paddingWithoutBadge);
            expect(Number.isFinite(paddingWithoutBadgePx)).toBe(true);
            expect(paddingWithoutBadgePx).toBeLessThanOrEqual(paddingWithBadgePx);
            expect(paddingWithoutBadgePx).toBeLessThanOrEqual(data.spacingXs);
        });
    });
});
