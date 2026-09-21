import { LitElement, html, css } from 'lit';
import Events from './events.js';

const DEFAULT_TIMEOUT = 6000;

class MasToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 10%;
            z-index: 1000;
        }
    `;

    constructor() {
        super();
        this.show = this.show.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        Events.toast.subscribe(this.show);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Events.toast.unsubscribe(this.show);
    }

    show({ variant, content, timeout }) {
        const toast = this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = content;
            toast.variant = variant;
            // The element is reused, so reset to the default when no timeout is given.
            toast.timeout = timeout ?? DEFAULT_TIMEOUT;
            toast.open = true;
        }
    }

    render() {
        return html`<sp-toast timeout=${DEFAULT_TIMEOUT}></sp-toast>`;
    }
}

customElements.define('mas-toast', MasToast);
