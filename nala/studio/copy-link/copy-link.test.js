import { test, expect, studio, miloLibs, setTestPage } from '../../libs/mas-test.js';
import CopyLinkPage from '../copy-link/copy-link.page.js';
import CopyLinkSpec from './copy-link.spec.js';

const { features } = CopyLinkSpec;

test.describe('M@S Studio - Copy Link test suite', () => {
    let copyLink;

    test.beforeEach(async ({ context, page }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        copyLink = new CopyLinkPage(page);
    });

    // @studio-copy-link-table-row - Copy a Studio link for a top-level table row
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to MAS Studio content view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Switch to table view and locate the fragment row', async () => {
            await studio.switchToTableView();
            await expect(studio.tableView).toBeVisible();
            await expect(studio.tableViewFragmentTable(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Open row actions and click Copy link', async () => {
            await copyLink.copyLinkForRow(data.cardid);
        });

        await test.step('step-4: Verify positive toast appears', async () => {
            await expect(copyLink.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(copyLink.toastPositive).toContainText('Link copied to clipboard');
        });

        await test.step('step-5: Verify clipboard URL shape', async () => {
            const clipboardText = await copyLink.readClipboard();
            expect(clipboardText).toContain('https://mas.adobe.com/studio.html#');
            expect(clipboardText).toContain(`content-type=${data.expectedContentType}`);
            expect(clipboardText).toContain('page=content');
            expect(clipboardText).toContain(`path=${data.expectedPath}`);
            // query=<fragmentId>|<encoded-label>
            const match = clipboardText.match(/query=([^|]+)\|(.+)$/);
            expect(match).not.toBeNull();
            expect(match[1]).toBe(data.cardid);
            expect(match[2].length).toBeGreaterThan(0);
        });
    });

    // @studio-copy-link-variation-row - Copy a Studio link for an expanded variation row
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);
        let variationId;

        await test.step('step-1: Navigate to MAS Studio content view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Switch to table view and expand the parent row', async () => {
            await studio.switchToTableView();
            await expect(studio.tableView).toBeVisible();
            const parentTable = studio.tableViewFragmentTable(data.cardid);
            await expect(parentTable).toBeVisible();
            await parentTable.locator('button.expand-button').click();
            const variationsTable = studio.regionalVariationsTable(data.cardid).first();
            await expect(variationsTable).toBeVisible({ timeout: 10000 });
            variationId = await variationsTable.getAttribute('data-id');
            expect(variationId).toBeTruthy();
        });

        await test.step('step-3: Open variation-row actions and click Copy link', async () => {
            await copyLink.copyLinkForRow(variationId);
        });

        await test.step('step-4: Verify positive toast appears', async () => {
            await expect(copyLink.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(copyLink.toastPositive).toContainText('Link copied to clipboard');
        });

        await test.step('step-5: Verify clipboard URL targets the variation, not the parent', async () => {
            const clipboardText = await copyLink.readClipboard();
            expect(clipboardText).toContain('https://mas.adobe.com/studio.html#');
            expect(clipboardText).toContain(`content-type=${data.expectedContentType}`);
            expect(clipboardText).toContain('page=content');
            expect(clipboardText).toContain(`path=${data.expectedPath}`);
            const match = clipboardText.match(/query=([^|]+)\|(.+)$/);
            expect(match).not.toBeNull();
            expect(match[1]).toBe(variationId);
            expect(match[1]).not.toBe(data.cardid);
            expect(match[2].length).toBeGreaterThan(0);
        });
    });
});
