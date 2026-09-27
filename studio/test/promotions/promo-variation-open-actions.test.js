import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { CARD_MODEL_PATH, FRAGMENT_STATUS } from '../../src/constants.js';
import { buildPromoVariationEditorUrl, openPromoVariationInNewTab } from '../../src/promotions/promo-variation-open-actions.js';
import '../../src/swc.js';
import '../../src/translation/mas-collapsible-table-row.js';

const CARD_PATH = '/content/dam/mas/acom/en_US/cards/test';
const VARIATION = {
    id: 'variation-id',
    path: '/content/dam/mas/acom/en_US/promotions/black-friday/cards/test',
    title: 'Promo variation',
    studioPath: 'merch-card: ACOM / Promo variation',
    status: FRAGMENT_STATUS.DRAFT,
    model: { path: CARD_MODEL_PATH },
    tags: [{ id: 'mas:promotion/black-friday', title: 'Black Friday' }],
    fields: [],
    offerData: { offerId: 'offer-id' },
};

describe('promo-variation-open-actions', () => {
    describe('buildPromoVariationEditorUrl', () => {
        it('routes to the fragment editor for the variation and keeps the rest of the hash', () => {
            const url = new URL(
                buildPromoVariationEditorUrl(
                    VARIATION,
                    'https://mas.adobe.com/studio.html#page=promotions-editor&path=acom&promotionId=promo-id',
                ),
            );
            const params = new URLSearchParams(url.hash.slice(1));
            expect(url.origin + url.pathname).to.equal('https://mas.adobe.com/studio.html');
            expect(params.get('page')).to.equal('fragment-editor');
            expect(params.get('fragmentId')).to.equal('variation-id');
            expect(params.get('path')).to.equal('acom');
            expect(params.get('promotionId')).to.equal('promo-id');
            expect(params.has('region')).to.be.false;
        });

        it('sets the region when the variation locale differs from the catalog locale', () => {
            const variation = { ...VARIATION, path: VARIATION.path.replace('en_US', 'fr_FR') };
            const url = new URL(
                buildPromoVariationEditorUrl(variation, 'https://mas.adobe.com/studio.html#page=promotions-editor'),
            );
            expect(new URLSearchParams(url.hash.slice(1)).get('region')).to.equal('fr_FR');
        });

        it('drops the search query', () => {
            const url = new URL(
                buildPromoVariationEditorUrl(VARIATION, 'https://mas.adobe.com/studio.html#query=abc&page=content'),
            );
            expect(new URLSearchParams(url.hash.slice(1)).has('query')).to.be.false;
        });
    });

    describe('openPromoVariationInNewTab', () => {
        it('opens the editor URL in a new tab', () => {
            const openStub = sinon.stub(window, 'open');
            openPromoVariationInNewTab(VARIATION);
            expect(openStub.calledOnceWithExactly(buildPromoVariationEditorUrl(VARIATION), '_blank')).to.be.true;
            openStub.restore();
        });
    });

    describe('mas-collapsible-table-row wiring', () => {
        let openStub;

        const renderRow = async (openPromoVariationsInNewTab) => {
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${{
                        path: CARD_PATH,
                        title: 'Card',
                        status: FRAGMENT_STATUS.PUBLISHED,
                        model: { path: CARD_MODEL_PATH },
                        tags: [],
                        fields: [{ name: 'variations', values: [] }],
                    }}
                    .viewOnly=${true}
                    .viewOnlyTabs=${['promotion']}
                    .tabs=${['promotion']}
                    .selectableTabs=${[]}
                    .promoVariationsFetchedByParent=${new Map([[CARD_PATH, [VARIATION]]])}
                    .openPromoVariationsInNewTab=${openPromoVariationsInNewTab}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.expandedVariationsPaths = new Set([VARIATION.path]);
            await el.updateComplete;
            return el;
        };

        const promoRow = (el) => el.shadowRoot.querySelector(`sp-table-row[value="${VARIATION.path}"]`);
        const fire = (target, type, init = {}) =>
            target.dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, cancelable: true, ...init }));

        beforeEach(() => {
            setItemsSelectionStore(Store.promotions);
            openStub = sinon.stub(window, 'open');
        });

        afterEach(() => {
            fixtureCleanup();
            openStub.restore();
            setItemsSelectionStore(null);
        });

        it('opens the variation on double click', async () => {
            const el = await renderRow(true);
            fire(promoRow(el), 'dblclick');
            expect(openStub.calledOnceWithExactly(buildPromoVariationEditorUrl(VARIATION), '_blank')).to.be.true;
        });

        it('does not open anything on single click', async () => {
            const el = await renderRow(true);
            fire(promoRow(el), 'click');
            expect(openStub.called).to.be.false;
        });

        it('shows a single "Open in a new tab" item on right click and opens the variation when chosen', async () => {
            const el = await renderRow(true);
            const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true });
            promoRow(el).dispatchEvent(event);
            await el.updateComplete;
            expect(event.defaultPrevented).to.be.true;
            const items = el.shadowRoot.querySelectorAll('.context-menu sp-menu-item');
            expect(items).to.have.lengthOf(1);
            expect(items[0].textContent.trim()).to.equal('Open in a new tab');
            items[0].click();
            await el.updateComplete;
            expect(openStub.calledOnceWithExactly(buildPromoVariationEditorUrl(VARIATION), '_blank')).to.be.true;
            expect(el.shadowRoot.querySelector('.context-menu')).to.not.exist;
        });

        it('closes the context menu on Escape', async () => {
            const el = await renderRow(true);
            fire(promoRow(el), 'contextmenu');
            await el.updateComplete;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.context-menu')).to.not.exist;
        });

        it('ignores events from the nested variation details row', async () => {
            const el = await renderRow(true);
            const detailsRow = el.shadowRoot.querySelector('.variation-details-row');
            expect(detailsRow).to.exist;
            fire(detailsRow, 'dblclick');
            const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true });
            detailsRow.dispatchEvent(event);
            await el.updateComplete;
            expect(openStub.called).to.be.false;
            expect(event.defaultPrevented).to.be.false;
            expect(el.shadowRoot.querySelector('.context-menu')).to.not.exist;
        });

        it('ignores events from the copy offer ID button', async () => {
            const el = await renderRow(true);
            const copyButton = promoRow(el).querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
            expect(copyButton).to.exist;
            fire(copyButton, 'dblclick');
            fire(copyButton, 'contextmenu');
            await el.updateComplete;
            expect(openStub.called).to.be.false;
            expect(el.shadowRoot.querySelector('.context-menu')).to.not.exist;
        });

        it('does nothing when the opt-in flag is not set', async () => {
            const el = await renderRow(false);
            fire(promoRow(el), 'dblclick');
            const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true });
            promoRow(el).dispatchEvent(event);
            await el.updateComplete;
            expect(openStub.called).to.be.false;
            expect(event.defaultPrevented).to.be.false;
            expect(el.shadowRoot.querySelector('.context-menu')).to.not.exist;
        });
    });
});
