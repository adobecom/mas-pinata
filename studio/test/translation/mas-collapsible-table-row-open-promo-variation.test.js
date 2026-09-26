import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { setCardVariationsByPaths } from '../../src/common/utils/items-loader.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS, PAGE_NAMES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-collapsible-table-row.js';

describe('MasCollapsibleTableRow open promo variation in a new tab', () => {
    const promoPath = '/content/dam/mas/acom/en_US/promotions/black-friday/promo-card';
    const promoVariation = {
        id: 'promo-fragment-id',
        path: promoPath,
        title: 'Promo Card',
        studioPath: 'promo/path',
        status: FRAGMENT_STATUS.PUBLISHED,
        tags: [{ id: 'mas:promotion/black-friday', title: 'Black Friday' }],
        offerData: { offerId: 'OFFER-1' },
    };

    let sandbox;
    let previousPage;
    let openStub;

    const mountRow = async ({ viewOnly = true, modelPath = CARD_MODEL_PATH } = {}) => {
        const topLevelCard = {
            id: 'parent-id',
            path: '/content/dam/mas/acom/en_US/cards/test',
            title: 'Test Card',
            status: FRAGMENT_STATUS.PUBLISHED,
            model: { path: modelPath },
            tags: [],
            fields: [{ name: 'variations', values: [] }],
        };
        const el = await fixture(
            html`<mas-collapsible-table-row
                .topLevelCard=${topLevelCard}
                .viewOnly=${viewOnly}
                .viewOnlyTabs=${['promotion']}
                .tabs=${['promotion']}
                .selectableTabs=${[]}
                .isTopLevelExpanded=${true}
            ></mas-collapsible-table-row>`,
        );
        el.promoVariations = [promoVariation];
        el.expandedVariationsPaths = new Set([promoPath]);
        await el.updateComplete;
        return el;
    };

    const getVariationRow = (el) => el.shadowRoot.querySelector(`sp-table-row[value="${promoPath}"]`);
    const getMenuItems = (el) => el.shadowRoot.querySelectorAll('.promo-variation-context-menu sp-menu-item');
    const fire = (target, type) =>
        target.dispatchEvent(
            new MouseEvent(type, { bubbles: true, composed: true, cancelable: true, clientX: 40, clientY: 60 }),
        );

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        previousPage = Store.page.get();
        Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);
        Store.promotions.promotionId.set('promotion-project-id');
        setItemsSelectionStore(Store.promotions);
        setCardVariationsByPaths(new Map());
        openStub = sandbox.stub(window, 'open');
        sandbox.stub(navigator.clipboard, 'writeText').resolves();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.page.set(previousPage);
        Store.promotions.promotionId.set(null);
        setItemsSelectionStore(null);
    });

    it('opens the variation in the fragment editor on double click', async () => {
        const el = await mountRow();
        fire(getVariationRow(el), 'dblclick');
        expect(openStub.calledOnce).to.be.true;
        const [url, target] = openStub.firstCall.args;
        const params = new URLSearchParams(url.slice(url.indexOf('#') + 1));
        expect(target).to.equal('_blank');
        expect(params.get('page')).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
        expect(params.get('fragmentId')).to.equal('promo-fragment-id');
        expect(params.get('promotionId')).to.equal('promotion-project-id');
        expect(params.get('locale')).to.equal('en_US');
        expect(params.get('path')).to.equal('acom');
    });

    it('shows a single "Open in a new tab" item on right click and opens the tab when chosen', async () => {
        const el = await mountRow();
        const event = fire(getVariationRow(el), 'contextmenu');
        await el.updateComplete;
        expect(event).to.be.false;
        const items = getMenuItems(el);
        expect(items).to.have.lengthOf(1);
        expect(items[0].textContent).to.include('Open in a new tab');

        items[0].click();
        await el.updateComplete;
        expect(openStub.calledOnce).to.be.true;
        expect(getMenuItems(el)).to.have.lengthOf(0);
    });

    it('closes the context menu on Escape', async () => {
        const el = await mountRow();
        fire(getVariationRow(el), 'contextmenu');
        await el.updateComplete;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await el.updateComplete;
        expect(getMenuItems(el)).to.have.lengthOf(0);
    });

    it('closes the context menu on a pointerdown outside of it', async () => {
        const el = await mountRow();
        fire(getVariationRow(el), 'contextmenu');
        await el.updateComplete;
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(getMenuItems(el)).to.have.lengthOf(0);
    });

    it('ignores double click and right click on the nested details row', async () => {
        const el = await mountRow();
        const detailsRow = el.shadowRoot.querySelector('.variation-details-row');
        expect(detailsRow).to.exist;
        fire(detailsRow, 'dblclick');
        fire(detailsRow, 'contextmenu');
        await el.updateComplete;
        expect(openStub.called).to.be.false;
        expect(getMenuItems(el)).to.have.lengthOf(0);
    });

    it('keeps the copy Offer ID button working without opening a tab', async () => {
        const el = await mountRow();
        const copyBtn = getVariationRow(el).querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
        expect(copyBtn).to.exist;
        copyBtn.click();
        fire(copyBtn, 'dblclick');
        fire(copyBtn, 'contextmenu');
        await el.updateComplete;
        expect(navigator.clipboard.writeText.calledWith('OFFER-1')).to.be.true;
        expect(openStub.called).to.be.false;
        expect(getMenuItems(el)).to.have.lengthOf(0);
    });

    describe('outside the promotions editor Fragments table', () => {
        const expectInert = async (el) => {
            const row = getVariationRow(el);
            fire(row, 'dblclick');
            fire(row, 'contextmenu');
            await el.updateComplete;
            expect(openStub.called).to.be.false;
            expect(getMenuItems(el)).to.have.lengthOf(0);
        };

        it('does nothing on another page', async () => {
            Store.page.set(PAGE_NAMES.CONTENT);
            await expectInert(await mountRow());
        });

        it('does nothing for a collection top-level item', async () => {
            await expectInert(await mountRow({ modelPath: COLLECTION_MODEL_PATH }));
        });

        it('does nothing when not view only', async () => {
            const el = await mountRow({ viewOnly: false });
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            await expectInert(el);
        });
    });
});
