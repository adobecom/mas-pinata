import { test, expect, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import EXPRESSLocalesSpec from '../specs/express_locales.spec.js';

const { features } = EXPRESSLocalesSpec;

test.describe('M@S Studio EXPRESS Locales (KE and MU) test suite', () => {
    // @studio-express-locales-ke-mu - Validate KE and MU are exposed under en_US on Express surface (MWPW-191681)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Load MAS Studio so the locales module origin is available', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Dynamically import the locales module from the studio origin', async () => {
            const moduleLoaded = await page.evaluate(async (modulePath) => {
                const mod = await import(modulePath);
                return Boolean(
                    mod &&
                        typeof mod.getSurfaceLocales === 'function' &&
                        typeof mod.getDefaultLocaleCode === 'function' &&
                        typeof mod.getDefaultLocales === 'function' &&
                        typeof mod.getCountryName === 'function' &&
                        typeof mod.getCountryFlag === 'function',
                );
            }, data.localesModule);
            expect(moduleLoaded).toBe(true);
        });

        await test.step('step-3: Verify en_KE and en_MU are exposed via getSurfaceLocales for express', async () => {
            const result = await page.evaluate(
                async ({ modulePath, surface }) => {
                    const { getSurfaceLocales } = await import(modulePath);
                    const surfaceLocales = getSurfaceLocales(surface);
                    return {
                        hasKE: surfaceLocales.some((locale) => locale.lang === 'en' && locale.country === 'KE'),
                        hasMU: surfaceLocales.some((locale) => locale.lang === 'en' && locale.country === 'MU'),
                    };
                },
                { modulePath: data.localesModule, surface: data.surface },
            );
            expect(result.hasKE, 'express surface includes en_KE').toBe(true);
            expect(result.hasMU, 'express surface includes en_MU').toBe(true);
        });

        await test.step('step-4: Verify getDefaultLocaleCode resolves en_KE and en_MU to en_US on express', async () => {
            const result = await page.evaluate(
                async ({ modulePath, surface }) => {
                    const { getDefaultLocaleCode } = await import(modulePath);
                    return {
                        ke: getDefaultLocaleCode(surface, 'en_KE'),
                        mu: getDefaultLocaleCode(surface, 'en_MU'),
                    };
                },
                { modulePath: data.localesModule, surface: data.surface },
            );
            expect(result.ke).toEqual(data.expectedDefault);
            expect(result.mu).toEqual(data.expectedDefault);
        });

        await test.step('step-5: Verify KE is only listed under the en_US row of express defaults', async () => {
            const result = await page.evaluate(
                async ({ modulePath, surface }) => {
                    const { getDefaultLocales } = await import(modulePath);
                    const defaults = getDefaultLocales(surface);
                    const rowsWithKE = defaults.filter((locale) => locale.regions?.includes('KE'));
                    return {
                        rowCount: rowsWithKE.length,
                        rowLang: rowsWithKE[0]?.lang,
                        rowCountry: rowsWithKE[0]?.country,
                    };
                },
                { modulePath: data.localesModule, surface: data.surface },
            );
            expect(result.rowCount).toEqual(1);
            expect(result.rowLang).toEqual('en');
            expect(result.rowCountry).toEqual('US');
        });

        await test.step('step-6: Verify KE is not exposed as a region on ccd, adobe-home, or commerce', async () => {
            const result = await page.evaluate(
                async ({ modulePath, surfaces }) => {
                    const { getDefaultLocales } = await import(modulePath);
                    return surfaces.map((surface) => ({
                        surface,
                        hasKE: getDefaultLocales(surface).some((locale) => locale.regions?.includes('KE')),
                    }));
                },
                { modulePath: data.localesModule, surfaces: data.surfacesWithoutKE },
            );
            for (const { surface, hasKE } of result) {
                expect(hasKE, `${surface} should not list KE as a region`).toBe(false);
            }
        });

        await test.step('step-7: Verify Kenya and Mauritius country names and flags', async () => {
            const result = await page.evaluate(async (modulePath) => {
                const { getCountryName, getCountryFlag } = await import(modulePath);
                return {
                    keName: getCountryName('KE'),
                    keFlag: getCountryFlag('KE'),
                    muName: getCountryName('MU'),
                    muFlag: getCountryFlag('MU'),
                };
            }, data.localesModule);
            expect(result.keName).toEqual(data.ke.name);
            expect(result.keFlag).toEqual(data.ke.flag);
            expect(result.muName).toEqual(data.mu.name);
            expect(result.muFlag).toEqual(data.mu.flag);
        });
    });
});
