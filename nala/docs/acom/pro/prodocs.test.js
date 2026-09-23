import { expect, test } from '@playwright/test';
import { features } from './prodocs.spec.js';
import MasPro from './pro.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRO }],
});

test.describe('Pro gallery feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    features.forEach(({ tcid, name, tags, data }) => {
        test(`[Test Id - ${tcid}] ${name},${tags}`, async () => {
            await test.step('step-1: Go to Pro gallery page', async () => {
                galleryPage = new MasPro(workerSetup.getPage('US'));
                await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO, expect);
            });

            await test.step('step-2: Verify Pro card is rendered', async () => {
                await expect(galleryPage.getCard(data.id)).toBeVisible();
                await expect(galleryPage.getCard(data.id)).toHaveAttribute('variant', data.variant);
            });
        });
    });
});
