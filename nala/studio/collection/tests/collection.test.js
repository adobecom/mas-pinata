import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import CollectionEditorPage from '../collection.page.js';
import CollectionSpec from '../specs/collection.spec.js';

const { features } = CollectionSpec;

test.describe('M@S Studio Collection Editor — Add card via link test suite', () => {
    let collection;

    test.beforeEach(async ({ page }) => {
        collection = new CollectionEditorPage(page);
    });

    // @studio-collection-add-card-button-visible
    // AC: Collection editor renders an "Add card" button below the cards list.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify collection editor and Add card button render', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
            await expect(collection.collectionEditor).toBeVisible();
            await expect(collection.cardsContainer).toBeVisible();
            await expect(collection.addCardRow).toBeVisible();
            await expect(collection.addCardButton).toBeVisible();
            await expect(collection.addCardButton).toContainText('Add card');
        });
    });

    // @studio-collection-add-card-input-expand
    // AC: Clicking "Add card" reveals an sp-textfield that is auto-focused.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Click Add card button', async () => {
            await expect(collection.addCardButton).toBeVisible();
            await collection.addCardButton.click();
        });

        await test.step('step-3: Verify input expands, button hides, input is focused', async () => {
            await expect(collection.addCardInput).toBeVisible();
            await expect(collection.addCardButton).toHaveCount(0);
            await expect(collection.addCardInput).toHaveAttribute('placeholder', /Paste card link/);
            await expect(collection.addCardInputField).toBeFocused();
        });
    });

    // @studio-collection-add-card-paste-link
    // AC: Pasting a valid card link appends to cards, collapses input, shows positive toast.
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        let initialCardCount = 0;

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Capture initial card count and open Add card input', async () => {
            await expect(collection.cardsContainer).toBeVisible();
            initialCardCount = await collection.cardItems.count();
            await collection.addCardButton.click();
            await expect(collection.addCardInput).toBeVisible();
        });

        await test.step('step-3: Submit a valid card link via change event', async () => {
            await collection.submitCardLink(data.cardLink);
        });

        await test.step('step-4: Verify positive toast and input collapses', async () => {
            await expect(collection.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(collection.toastPositive).toContainText(data.successToast);
            await expect(collection.addCardInput).toHaveCount(0);
            await expect(collection.addCardButton).toBeVisible();
        });

        await test.step('step-5: Verify the card was appended to the cards list', async () => {
            await expect(collection.cardItems).toHaveCount(initialCardCount + 1);
        });
    });

    // @studio-collection-add-card-duplicate
    // AC: Pasting a link for a card already in the collection shows inline error + negative toast,
    // cards list unchanged, input stays expanded.
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);

        let initialCardCount = 0;

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Capture initial card count and open Add card input', async () => {
            initialCardCount = await collection.cardItems.count();
            await collection.addCardButton.click();
            await expect(collection.addCardInput).toBeVisible();
        });

        await test.step('step-3: Submit a link to a card already in this collection', async () => {
            await collection.submitCardLink(data.duplicateCardLink);
        });

        await test.step('step-4: Verify duplicate inline error and negative toast', async () => {
            await expect(collection.addCardError).toBeVisible({ timeout: 10000 });
            await expect(collection.addCardError).toContainText(data.duplicateError);
            await expect(collection.toastNegative).toBeVisible();
            await expect(collection.toastNegative).toContainText(data.duplicateError);
        });

        await test.step('step-5: Verify cards list unchanged and input still expanded', async () => {
            await expect(collection.cardItems).toHaveCount(initialCardCount);
            await expect(collection.addCardInput).toBeVisible();
        });
    });

    // @studio-collection-add-card-invalid-link
    // AC: Pasting a malformed value shows inline error and leaves the list unchanged.
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);

        let initialCardCount = 0;

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Capture initial card count and open Add card input', async () => {
            initialCardCount = await collection.cardItems.count();
            await collection.addCardButton.click();
            await expect(collection.addCardInput).toBeVisible();
        });

        await test.step('step-3: Submit a non-link value', async () => {
            await collection.submitCardLink(data.invalidValue);
        });

        await test.step('step-4: Verify inline error renders and cards list unchanged', async () => {
            await expect(collection.addCardError).toBeVisible({ timeout: 10000 });
            await expect(collection.addCardError).toContainText(data.invalidError);
            await expect(collection.cardItems).toHaveCount(initialCardCount);
            await expect(collection.addCardInput).toBeVisible();
        });
    });

    // @studio-collection-add-card-blur-collapses-input
    // AC: Clicking outside the expanded input collapses it and clears value/error state.
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio collection fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Open Add card input', async () => {
            await collection.addCardButton.click();
            await expect(collection.addCardInput).toBeVisible();
        });

        await test.step('step-3: Move focus outside the add-card-row', async () => {
            await editor.panel.click({ position: { x: 5, y: 5 } });
        });

        await test.step('step-4: Verify input collapses back to button', async () => {
            await expect(collection.addCardInput).toHaveCount(0);
            await expect(collection.addCardButton).toBeVisible();
            await expect(collection.addCardError).toHaveCount(0);
        });
    });
});
