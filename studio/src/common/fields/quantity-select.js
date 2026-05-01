import { css, html, LitElement, nothing } from 'lit';

/**
 * Builds a serialized merch quantity selector HTML value.
 * @param {{ title: string, min: string, step: string, defaultValue: string }} config
 * @returns {string}
 */
export const createQuantitySelectValue = ({ title, min, step, defaultValue }) => {
    const element = document.createElement('merch-quantity-select');
    element.setAttribute('title', `${title}`);
    element.setAttribute('min', `${min}`);
    element.setAttribute('max', '10');
    element.setAttribute('step', `${step}`);
    if (defaultValue !== undefined && defaultValue !== null && `${defaultValue}` !== '') {
        element.setAttribute('default-value', `${defaultValue}`);
    }
    return element.outerHTML;
};

/**
 * Parses a serialized merch quantity selector HTML value.
 * @param {string} value
 * @returns {{ title: string, min: string, step: string, defaultValue: string }}
 */
export const parseQuantitySelectValue = (value) => {
    if (!value) return { title: '', min: '1', step: '1', defaultValue: '' };
    const parser = new DOMParser();
    const documentRoot = parser.parseFromString(value, 'text/html');
    const element = documentRoot.querySelector('merch-quantity-select');
    return {
        title: `${element?.getAttribute('title') ?? ''}`,
        min: `${element?.getAttribute('min') ?? '1'}`,
        step: `${element?.getAttribute('step') ?? '1'}`,
        defaultValue: `${element?.getAttribute('default-value') ?? ''}`,
    };
};

/**
 * Settings custom value editor for merch quantity select markup.
 */
export class QuantitySelectField extends LitElement {
    static properties = {
        value: { type: String },
        title: { type: String, state: true },
        min: { type: String, state: true },
        step: { type: String, state: true },
        defaultValue: { type: String, state: true },
        errorField: { type: String, state: true },
        layout: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: block;
        }

        .fields {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        :host([layout='vertical']) .fields {
            display: flex;
            flex-direction: column;
        }

        sp-field-group {
            width: 100%;
        }
    `;

    constructor() {
        super();
        this.value = '';
        this.title = '';
        this.min = '1';
        this.step = '1';
        this.defaultValue = '';
        this.errorField = null;
        this.layout = 'grid';
        this.disabled = false;
    }

    willUpdate(changedProperties) {
        if (!changedProperties.has('value')) return;
        const parsed = parseQuantitySelectValue(this.value);
        this.title = parsed.title;
        this.min = parsed.min;
        this.step = parsed.step;
        this.defaultValue = parsed.defaultValue;
    }

    #dispatchChange() {
        this.value = createQuantitySelectValue({
            title: this.title,
            min: this.min,
            step: this.step,
            defaultValue: this.defaultValue,
        });
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #validate(blurredField) {
        const minRaw = (this.min ?? '').trim();
        const defaultRaw = (this.defaultValue ?? '').trim();
        if (!minRaw || !defaultRaw) {
            this.errorField = null;
            return;
        }
        const minNum = Number.parseInt(minRaw, 10);
        const defaultNum = Number.parseInt(defaultRaw, 10);
        if (Number.isNaN(minNum) || Number.isNaN(defaultNum)) {
            this.errorField = null;
            return;
        }
        this.errorField = minNum > defaultNum ? blurredField : null;
    }

    #handleTitleChange = (event) => {
        this.title = event.target.value;
        this.#dispatchChange();
    };

    #handleMinChange = (event) => {
        this.min = event.target.value;
        this.#dispatchChange();
        if (this.errorField) this.#validate(this.errorField);
    };

    #handleStepChange = (event) => {
        this.step = event.target.value;
        this.#dispatchChange();
    };

    #handleDefaultValueChange = (event) => {
        this.defaultValue = event.target.value;
        this.#dispatchChange();
        if (this.errorField) this.#validate(this.errorField);
    };

    #handleMinBlur = () => {
        this.#validate('min');
    };

    #handleStartBlur = () => {
        this.#validate('defaultValue');
    };

    #suppressNativeChange = (event) => {
        event.stopPropagation();
    };

    render() {
        const warningMessage = 'Minimum quantity must be less than or equal to start quantity.';
        return html`
            <div class="fields">
                <sp-field-group>
                    <sp-field-label>Quantity selector title</sp-field-label>
                    <sp-textfield
                        id="quantity-selector-title"
                        size="m"
                        ?disabled=${this.disabled}
                        .value=${this.title}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleTitleChange}
                    ></sp-textfield>
                </sp-field-group>
                <sp-field-group>
                    <sp-field-label>Start quantity</sp-field-label>
                    <sp-textfield
                        id="quantity-selector-start"
                        size="m"
                        ?disabled=${this.disabled}
                        pattern="[0-9]*"
                        inputmode="numeric"
                        .value=${this.defaultValue}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleDefaultValueChange}
                        @blur=${this.#handleStartBlur}
                    ></sp-textfield>
                    ${this.errorField === 'defaultValue'
                        ? html`<sp-help-text variant="negative" size="s">${warningMessage}</sp-help-text>`
                        : nothing}
                </sp-field-group>
                <sp-field-group>
                    <sp-field-label>Minimum quantity</sp-field-label>
                    <sp-textfield
                        id="quantity-selector-minimum"
                        size="m"
                        ?disabled=${this.disabled}
                        pattern="[0-9]*"
                        inputmode="numeric"
                        .value=${this.min}
                        @change=${this.#suppressNativeChange}
                        @input=${this.#handleMinChange}
                        @blur=${this.#handleMinBlur}
                    ></sp-textfield>
                    ${this.errorField === 'min'
                        ? html`<sp-help-text variant="negative" size="s">${warningMessage}</sp-help-text>`
                        : nothing}
                </sp-field-group>
            </div>
            <sp-field-group>
                <sp-field-label>Step</sp-field-label>
                <sp-textfield
                    id="quantity-selector-step"
                    size="m"
                    ?disabled=${this.disabled}
                    pattern="[0-9]*"
                    .value=${this.step}
                    @change=${this.#suppressNativeChange}
                    @input=${this.#handleStepChange}
                ></sp-textfield>
            </sp-field-group>
        `;
    }
}

customElements.define('quantity-select-field', QuantitySelectField);
