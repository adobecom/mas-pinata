export default class MasCatalog {
    constructor(page) {
        this.page = page;
    }

    getGalleryHeading() {
        return this.page.locator('#catalog-gallery');
    }

    getCard(fragmentId) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${fragmentId}"])`).first();
    }

    getCatalogCards() {
        return this.page.locator('.three-merch-cards.catalog merch-card[variant="catalog"]');
    }

    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards.catalog merch-card div[slot="footer"] :is(a, button)');
    }

    /**
     * Injects a pair of mnemonic-list marquee fixtures into the page so the
     * catalog marquee font-size override (`.catalog-marquee .mnemonic-list
     * .product-list .product-item strong`) can be asserted against a control
     * that is intentionally outside the catalog-marquee scope. Mirrors the
     * structure Milo emits on /products/catalog.
     */
    async injectMarqueeFixtures() {
        await this.page.evaluate(() => {
            const marker = 'catalog-marquee-fixture';
            document.querySelectorAll(`[data-fixture="${marker}"]`).forEach((el) => el.remove());
            const host = document.querySelector('main') || document.body;

            const marquee = document.createElement('div');
            marquee.className = 'marquee catalog catalog-marquee';
            marquee.dataset.fixture = marker;
            marquee.innerHTML = `
                <div class="mnemonic-list">
                    <div class="product-list">
                        <div class="product-item">
                            <strong data-test="catalog-marquee-title">Photoshop</strong>
                        </div>
                    </div>
                </div>
            `;
            host.appendChild(marquee);

            const control = document.createElement('div');
            control.className = 'plain-mnemonic';
            control.dataset.fixture = marker;
            control.innerHTML = `
                <div class="mnemonic-list">
                    <div class="product-list">
                        <div class="product-item">
                            <strong data-test="control-mnemonic-title">Photoshop</strong>
                        </div>
                    </div>
                </div>
            `;
            host.appendChild(control);
        });
    }

    getCatalogMarqueeTitle() {
        return this.page.locator('strong[data-test="catalog-marquee-title"]');
    }

    getControlMnemonicTitle() {
        return this.page.locator('strong[data-test="control-mnemonic-title"]');
    }

    async resolveCssVariablePx(variableName) {
        return this.page.evaluate((name) => {
            const probe = document.createElement('div');
            probe.style.position = 'absolute';
            probe.style.visibility = 'hidden';
            probe.style.fontSize = `var(${name})`;
            document.body.appendChild(probe);
            const px = getComputedStyle(probe).fontSize;
            probe.remove();
            return px;
        }, variableName);
    }
}
