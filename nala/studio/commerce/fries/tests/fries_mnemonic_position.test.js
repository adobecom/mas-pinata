import { test, expect, studio, fries, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesMnemonicSpec from '../specs/fries_mnemonic_position.spec.js';

const { features } = COMFriesMnemonicSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-mnemonic-below-description - Validate mnemonic icons on a fries card
    // render in a horizontal row directly below the description, not in the top-left header.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card is visible', async () => {
            await studio.waitForCardsLoaded();
            await expect(friesCard).toBeVisible();
        });

        await test.step('step-3: Validate at least one mnemonic icon is slotted', async () => {
            const iconLocator = friesCard.locator(fries.icon).first();
            await expect(iconLocator).toBeVisible();
        });

        await test.step('step-4: Validate mnemonic icons render below the description', async () => {
            const description = friesCard.locator(fries.description);
            const firstIcon = friesCard.locator(fries.icon).first();

            await expect(description).toBeVisible();
            await expect(firstIcon).toBeVisible();

            const descriptionBox = await description.boundingBox();
            const iconBox = await firstIcon.boundingBox();

            expect(descriptionBox).not.toBeNull();
            expect(iconBox).not.toBeNull();

            // Icons must start below the bottom of the description (not above/alongside it).
            expect(iconBox.y).toBeGreaterThanOrEqual(descriptionBox.y + descriptionBox.height);
        });

        await test.step('step-5: Validate mnemonic icons render below the heading (not in header)', async () => {
            const heading = friesCard.locator(fries.title);
            const firstIcon = friesCard.locator(fries.icon).first();

            await expect(heading).toBeVisible();

            const headingBox = await heading.boundingBox();
            const iconBox = await firstIcon.boundingBox();

            expect(headingBox).not.toBeNull();
            expect(iconBox).not.toBeNull();

            // Icons must render below the heading — regression guard against the previous
            // header-row layout where the icons slot was rendered before/next to the heading.
            expect(iconBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
        });

        await test.step('step-6: Validate icons slot lays out as a wrapping horizontal row', async () => {
            const slotStyle = await friesCard.evaluate((card) => {
                const slot = card.shadowRoot?.querySelector('slot[name="icons"]');
                if (!slot) return null;
                const style = window.getComputedStyle(slot);
                return {
                    display: style.display,
                    flexDirection: style.flexDirection,
                    flexWrap: style.flexWrap,
                };
            });

            expect(slotStyle).not.toBeNull();
            expect(slotStyle.display).toBe('flex');
            expect(slotStyle.flexDirection).toBe('row');
            expect(slotStyle.flexWrap).toBe('wrap');
        });

        await test.step('step-7: Validate mnemonic icons stay within the fries card width', async () => {
            const cardBox = await friesCard.boundingBox();
            const iconCount = await friesCard.locator(fries.icon).count();

            expect(cardBox).not.toBeNull();

            for (let i = 0; i < iconCount; i += 1) {
                const iconBox = await friesCard.locator(fries.icon).nth(i).boundingBox();
                expect(iconBox).not.toBeNull();
                // Each icon must render within the card's horizontal bounds (wrapping, not overflowing).
                expect(iconBox.x).toBeGreaterThanOrEqual(cardBox.x);
                expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
            }
        });
    });
});
