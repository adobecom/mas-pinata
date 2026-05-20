import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import SelectionPanelPage from '../selection-panel.page.js';
import SelectionPanelSpec from '../specs/selection-panel.spec.js';

const { features } = SelectionPanelSpec;

test.describe('M@S Studio Selection Panel test suite', () => {
    test.beforeEach(async ({ context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    });

    // @studio-selection-panel-bulk-copy-code - Validate bulk Copy code writes
    // one rich-text hyperlink per fragment (HTML) and one URL per line (plain text).
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);
        const selectionPanel = new SelectionPanelPage(page);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
        });

        await test.step('step-2: Enter selection mode and select two cards', async () => {
            const selectButton = page.locator('mas-toolbar sp-button:has-text("Select")');
            await expect(selectButton).toBeVisible();
            await selectButton.click();

            for (const cardId of data.cardids) {
                const card = page.locator(`mas-fragment-render[data-id="${cardId}"]`);
                await card.scrollIntoViewIfNeeded();
                await card.locator('.overlay').click();
            }

            await expect(selectionPanel.selectionPanel).toBeVisible();
            await expect(selectionPanel.copyCodeButton).toBeVisible();
        });

        await test.step('step-3: Click Copy code in the bulk action bar', async () => {
            await selectionPanel.copyCodeButton.click();
            await expect(selectionPanel.toastPositive).toBeVisible();
            await expect(selectionPanel.toastPositive).toContainText('Copied 2 links to clipboard');
        });

        await test.step('step-4: Verify clipboard contents', async () => {
            const { html, plain } = await selectionPanel.readClipboard();

            const anchorMatches = html.match(/<a href="https:\/\/mas\.adobe\.com\/studio\.html#/g) || [];
            expect(anchorMatches.length).toBe(2);
            expect(html).toContain('<br>');

            const plainLines = plain.split('\n').filter(Boolean);
            expect(plainLines.length).toBe(2);
            for (const line of plainLines) {
                expect(line.startsWith('https://mas.adobe.com/studio.html#')).toBe(true);
            }
        });
    });
});
