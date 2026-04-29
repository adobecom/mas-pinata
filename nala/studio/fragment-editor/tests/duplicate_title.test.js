import { test, expect, studio, editor, miloLibs, setTestPage, setClonedCardID } from '../../../libs/mas-test.js';
import DuplicateTitleSpec from '../specs/duplicate_title.spec.js';

const { features } = DuplicateTitleSpec;

test.describe('M@S Studio Duplicate Title auto-rename test suite', () => {
    // @studio-create-duplicate-title-auto-rename
    // Two cards created in the same folder with the same title — second silently saved as `${title}-1`.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio sandbox folder', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Create first card with the duplicate-title test title', async () => {
            const firstId = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(firstId);
            data.firstCardId = firstId;
            data.firstTitle = await editor.title.inputValue();
            expect(data.firstTitle).toBeTruthy();
        });

        await test.step('step-3: Navigate back to the folder list', async () => {
            await studio.fragmentsButton.click();
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Create a second card with the SAME title', async () => {
            const secondId = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(secondId);
            data.secondCardId = secondId;
        });

        await test.step('step-5: Verify the second card title was auto-renamed to `${title}-1`', async () => {
            await expect(editor.title).toHaveValue(`${data.firstTitle}-1`, { timeout: 15000 });
        });
    });

    // @studio-edit-duplicate-title-auto-rename
    // Editing card B's title to match card A's title silently auto-renames the saved title to `${title}-1`.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio sandbox folder', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Create card A', async () => {
            const cardAId = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(cardAId);
            data.cardATitle = await editor.title.inputValue();
            expect(data.cardATitle).toBeTruthy();
        });

        await test.step('step-3: Navigate back to the folder list', async () => {
            await studio.fragmentsButton.click();
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Create card B (auto-generated title from same test will collide on save)', async () => {
            // Second invocation reuses the same auto-generated title; the create-time
            // dedupe will land it on `${cardATitle}-1`. We then edit it back to the
            // original to drive the save-time dedupe path.
            const cardBId = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(cardBId);
            data.cardBId = cardBId;
        });

        await test.step('step-5: Edit card B title to match card A title and save', async () => {
            await expect(editor.title).toBeVisible();
            await editor.title.fill(data.cardATitle);
            await studio.saveCard();
        });

        await test.step('step-6: Verify saved title is `${cardATitle}-1` (or next available -N)', async () => {
            await expect(editor.title).toHaveValue(new RegExp(`^${escapeRegex(data.cardATitle)}-\\d+$`), { timeout: 15000 });
        });
    });

    // @studio-cross-folder-no-rename
    // Same title in two different folder paths must coexist without any suffix.
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPageA = `${baseURL}${features[2].path}${miloLibs}#page=content&path=${data.folderA}`;
        const testPageB = `${baseURL}${features[2].path}${miloLibs}#page=content&path=${data.folderB}`;
        setTestPage(testPageA);

        await test.step('step-1: Go to folder A', async () => {
            await page.goto(testPageA);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Create card in folder A', async () => {
            const idA = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(idA);
            data.titleInA = await editor.title.inputValue();
            expect(data.titleInA).toBeTruthy();
        });

        await test.step('step-3: Navigate to folder B', async () => {
            await page.goto(testPageB);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Create card in folder B with same title (auto-generated)', async () => {
            const idB = await studio.createFragment({ osi: data.osi, variant: data.variant });
            setClonedCardID(idB);
            data.titleInB = await editor.title.inputValue();
        });

        await test.step('step-5: Verify both folders kept the original title without suffix', async () => {
            // The auto-generated title is identical for both invocations of getTitle()
            // within a single test run, so titleInA === titleInB proves cross-folder isolation.
            expect(data.titleInB).toBe(data.titleInA);
        });
    });
});

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
