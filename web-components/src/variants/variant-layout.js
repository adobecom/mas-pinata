import { html, nothing } from 'lit';
import { getFragmentMapping } from './variants';

export class VariantLayout {
    static styleMap = {};

    card;

    #container;

    getContainer() {
        this.#container =
            this.#container ??
            this.card.closest(
                'merch-card-collection, [class*="-merch-cards"]',
            ) ??
            this.card.parentElement;
        return this.#container;
    }

    insertVariantStyle() {
        const styleKey = this.constructor.name;
        if (!VariantLayout.styleMap[styleKey]) {
            VariantLayout.styleMap[styleKey] = true;
            const styles = document.createElement('style');
            styles.innerHTML = this.getGlobalCSS();
            document.head.appendChild(styles);
        }
    }

    updateCardElementMinHeight(el, name) {
        if (!el || this.card.heightSync === false) return;
        const elMinHeightPropertyName = `--consonant-merch-card-${this.card.variant}-${name}-height`;
        const height = Math.max(
            0,
            parseInt(window.getComputedStyle(el).height) || 0,
        );
        const container = this.getContainer();
        const maxMinHeight =
            parseInt(
                container.style.getPropertyValue(elMinHeightPropertyName),
            ) || 0;
        if (height > maxMinHeight) {
            container.style.setProperty(elMinHeightPropertyName, `${height}px`);
        }
    }

    constructor(card) {
        this.card = card;
        this.insertVariantStyle();
    }

    get badge() {
        let legacyBadge = nothing;
        if (
            this.card.badgeBackgroundColor &&
            this.card.badgeColor &&
            this.card.badgeText
        ) {
            const additionalStyles = this.evergreen
                ? `border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`
                : '';
            legacyBadge = html`
                <div
                    id="badge"
                    class="${this.card.variant}-badge"
                    style="background-color: ${this.card.badgeBackgroundColor};
                    color: ${this.card.badgeColor};
                    ${additionalStyles}"
                >
                    ${this.card.badgeText}
                </div>
            `;
        }
        return html`<div class="badge-row">
            ${legacyBadge}<slot
                name="badge"
                @slotchange=${() => this.card.updateHasBadgeAttribute?.()}
            ></slot>
        </div>`;
    }

    get cardImage() {
        return html` <div class="image">
            <slot name="bg-image"></slot>
        </div>`;
    }

    /* c8 ignore next 3 */
    getGlobalCSS() {
        return '';
    }

    /* c8 ignore next 3 */
    get theme() {
        return document.querySelector('sp-theme');
    }

    get evergreen() {
        return this.card.classList.contains('intro-pricing');
    }

    get promoBottom() {
        return this.card.classList.contains('promo-bottom');
    }

    get headingSelector() {
        return '[slot="heading-xs"]';
    }

    get secureLabel() {
        return this.card.secureLabel
            ? html`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`
            : nothing;
    }

    get secureLabelFooter() {
        return html`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`;
    }

    async postCardUpdateHook() {
        //nothing to do by default
    }

    connectedCallbackHook() {
        //nothing to do by default
    }

    disconnectedCallbackHook() {
        //nothing to do by default
    }

    syncHeights() {
        // Base implementation - variants can override this
        // Called when all cards in collection are ready
        // Variants that need height synchronization should override this method
    }

    /* c8 ignore next 3 */
    renderLayout() {
        //nothing to do by default
    }

    get aemFragmentMapping() {
        return getFragmentMapping(this.card.variant);
    }
}
