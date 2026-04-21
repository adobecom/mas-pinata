import { test, expect, studio, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import MerchCardPage from '../merch-card.page.js';
import MerchCardSpec from '../specs/merch-card.spec.js';

const { features } = MerchCardSpec;

test.describe('M@S Studio Merch Card Badge Layout test suite', () => {
    let merchCard;

    test.beforeEach(async ({ page }) => {
        merchCard = new MerchCardPage(page);
    });

    // @studio-merch-card-badge-height-variable
    // AC: ResizeObserver sets --consonant-merch-card-badge-height on cards with a badge
    //     and .body receives padding-block-start equal to the measured height.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
        });

        const card = await studio.getCard(data.cardid);

        await test.step('step-2: Validate card with badge is visible', async () => {
            await expect(card).toBeVisible();
            const badge = card.locator('[slot="badge"], div[class$="-badge"]').first();
            await expect(badge).toBeVisible();
        });

        await test.step('step-3: Validate --consonant-merch-card-badge-height is set', async () => {
            await expect(async () => {
                const value = await merchCard.getBadgeHeightVar(card);
                expect(value).toMatch(/^\d+px$/);
                expect(parseInt(value, 10)).toBeGreaterThan(0);
            }).toPass({ timeout: 5000 });
        });

        await test.step('step-4: Validate .body padding-block-start equals badge height', async () => {
            const varValue = await merchCard.getBadgeHeightVar(card);
            const badgeHeightPx = parseInt(varValue, 10);
            const bodyPadding = await merchCard.getBodyPaddingBlockStart(card);
            expect(parseInt(bodyPadding, 10)).toBe(badgeHeightPx);
        });
    });

    // @studio-merch-card-badge-wraps-long-text
    // AC: Long badge text wraps to a second line; max-width:180px and white-space:normal apply.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
        });

        const card = await studio.getCard(data.cardid);

        await test.step('step-2: Validate legacy badge CSS allows wrapping', async () => {
            const legacyBadge = card.locator('div[class$="-badge"]').first();
            if (await legacyBadge.count()) {
                expect(await webUtil.verifyCSS(legacyBadge, merchCard.cssProp.legacyBadge)).toBeTruthy();
            }
        });

        await test.step('step-3: Validate heading clears the full badge height (no overlap)', async () => {
            const badge = card.locator('[slot="badge"], div[class$="-badge"]').first();
            const heading = card.locator('h3[slot="heading-xs"], h3[slot="heading-m"]').first();
            await expect(badge).toBeVisible();
            await expect(heading).toBeVisible();

            const [badgeBox, headingBox] = await Promise.all([badge.boundingBox(), heading.boundingBox()]);
            expect(badgeBox).not.toBeNull();
            expect(headingBox).not.toBeNull();
            // Heading top must be at or below the bottom of the badge — i.e. no overlap.
            expect(headingBox.y).toBeGreaterThanOrEqual(badgeBox.y + badgeBox.height - 1);
        });
    });

    // @studio-merch-card-no-badge-no-padding
    // AC: Cards without any badge element do not receive extra top padding.
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
        });

        const card = await studio.getCard(data.cardid);

        await test.step('step-2: Validate card without badge is visible', async () => {
            await expect(card).toBeVisible();
            await expect(card.locator('[slot="badge"], div[class$="-badge"]')).toHaveCount(0);
        });

        await test.step('step-3: Validate --consonant-merch-card-badge-height is not set', async () => {
            const value = await merchCard.getBadgeHeightVar(card);
            expect(value).toBe('');
        });
    });
});
