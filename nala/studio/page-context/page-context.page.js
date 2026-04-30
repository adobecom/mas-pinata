export default class PageContextPage {
    constructor(page) {
        this.page = page;

        // Card containing the AEM fragment under test.
        this.merchCard = page.locator('merch-card');
        this.cardWith = (cardId) =>
            this.page.locator('merch-card').filter({
                has: this.page.locator(`aem-fragment[fragment="${cardId}"]`),
            });
    }

    /**
     * Seed window.masPageContext before any page script runs. Must be called
     * before page.goto(). The init script also installs a one-shot listener
     * so the test can later assert the `mas:page-context:ready` event fires.
     */
    async seedPageContextBeforeLoad(context) {
        await this.page.addInitScript((ctx) => {
            window.masPageContext = ctx;
            window.__masPageContextReadyCount = 0;
            document.addEventListener('mas:page-context:ready', () => {
                window.__masPageContextReadyCount += 1;
            });
        }, context);
    }

    /**
     * Install only the ready-event listener (no context seeded). Used by the
     * late-ready test to verify the event is observed when dispatched after
     * page load.
     */
    async installReadyEventCounterBeforeLoad() {
        await this.page.addInitScript(() => {
            window.__masPageContextReadyCount = 0;
            document.addEventListener('mas:page-context:ready', () => {
                window.__masPageContextReadyCount += 1;
            });
        });
    }

    /**
     * Set window.masPageContext after page load and dispatch the contract's
     * ready event so any waiting cards can resolve.
     */
    async setPageContextAndDispatchReady(context) {
        await this.page.evaluate((ctx) => {
            window.masPageContext = ctx;
            document.dispatchEvent(new CustomEvent('mas:page-context:ready'));
        }, context);
    }

    async readPageContextGlobal() {
        return this.page.evaluate(() => window.masPageContext ?? null);
    }

    async readReadyEventCount() {
        return this.page.evaluate(() => window.__masPageContextReadyCount ?? 0);
    }

    /**
     * Read the public constants the merch-card library exposes so callers
     * (MEP) can integrate without hard-coding strings.
     */
    async readPublicConstants() {
        return this.page.evaluate(async () => {
            try {
                const mod = await import('/libs/deps/mas/mas.js');
                return {
                    PAGE_CONTEXT_GLOBAL: mod.PAGE_CONTEXT_GLOBAL,
                    EVENT_MAS_PAGE_CONTEXT_READY: mod.EVENT_MAS_PAGE_CONTEXT_READY,
                };
            } catch {
                return null;
            }
        });
    }

    /**
     * Returns true when no raw `{{token}}` pattern is visible anywhere in the
     * card's text content. The contract requires unresolved tokens to fall
     * back to empty string — visitors should never see a raw `{{...}}`.
     */
    async cardTextContainsRawToken(cardId, rawToken) {
        const card = this.cardWith(cardId);
        const text = (await card.textContent()) ?? '';
        return text.includes(rawToken);
    }
}
