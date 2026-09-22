import { expect } from '@esm-bundle/chai';
import { elementUpdated } from '@open-wc/testing-helpers';
import '../../src/placeholders/mas-placeholders-item.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Placeholder } from '../../src/aem/placeholder.js';

function createPlaceholder({ key = 'greeting', value = 'Hello', richTextValue = [] } = {}) {
    return new Placeholder({
        path: '/content/dam/mas/acom/en_US/dictionary/greeting',
        fields: [
            { name: 'key', values: [key] },
            { name: 'value', values: [value] },
            { name: 'richTextValue', values: richTextValue },
        ],
    });
}

describe('mas-placeholders-item', () => {
    let element;

    async function createElement(overrides = {}) {
        const placeholderStore = new FragmentStore(createPlaceholder(overrides));
        element = document.createElement('mas-placeholders-item');
        element.placeholderStore = placeholderStore;
        element.editing = true;
        element.toggleEditing = () => {};
        element.toggleDropdown = () => {};
        element.updatePending = () => {};
        document.body.appendChild(element);
        await elementUpdated(element);
        return element;
    }

    afterEach(() => {
        element?.remove();
    });

    function getValueField() {
        return element.querySelector('sp-table-cell.value sp-textfield');
    }

    async function typeValue(value) {
        const field = getValueField();
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await elementUpdated(element);
    }

    const cases = [
        { input: '10.000', expected: 'Use a comma for thousands: 10,000' },
        { input: '1.000.000', expected: 'Use a comma for thousands: 1,000,000' },
        { input: '10.000 and 1.000.000', expected: 'Use a comma for thousands: 10,000' },
        { input: '2.0', expected: '' },
        { input: 'www.adobe.com', expected: '' },
        { input: 'version 1.5.3', expected: '' },
        { input: '10,000 assets', expected: '' },
        { input: 'Close', expected: '' },
        { input: 'Save today', expected: '' },
    ];

    for (const { input, expected } of cases) {
        it(`sets valueError to "${expected}" for input "${input}"`, async () => {
            await createElement();
            await typeValue(input);
            expect(element.valueError).to.equal(expected);
        });
    }

    it('renders an inline error beneath the Value field when the pattern is detected', async () => {
        await createElement();
        await typeValue('10.000');
        const errorEl = element.querySelector('.placeholder-value-error');
        expect(errorEl).to.exist;
        expect(errorEl.textContent).to.equal('Use a comma for thousands: 10,000');
    });

    it('renders no inline error when the value is valid', async () => {
        await createElement();
        await typeValue('www.adobe.com');
        expect(element.querySelector('.placeholder-value-error')).to.not.exist;
    });

    it('does not render an inline error beneath the Key field', async () => {
        await createElement();
        await typeValue('10.000');
        expect(element.querySelector('sp-table-cell.key .placeholder-value-error')).to.not.exist;
    });

    it('disables the approve-button while a valueError is present', async () => {
        await createElement();
        await typeValue('10.000');
        const approveButton = element.querySelector('.approve-button');
        expect(approveButton.disabled).to.be.true;
    });

    it('enables the approve-button once the value becomes valid and has changes', async () => {
        await createElement();
        await typeValue('www.adobe.com');
        const approveButton = element.querySelector('.approve-button');
        expect(approveButton.disabled).to.be.false;
    });

    it('disables the approve-button when valueError is set even without hasChanges', async () => {
        await createElement();
        expect(element.placeholder.hasChanges).to.be.false;
        element.valueError = 'Use a comma for thousands: 10,000';
        await elementUpdated(element);
        const approveButton = element.querySelector('.approve-button');
        expect(approveButton.disabled).to.be.true;
    });

    it('leaves valueError empty for rich-text placeholders', async () => {
        await createElement({ richTextValue: ['<p>10.000</p>'] });
        expect(element.placeholder.isRichText).to.be.true;
        expect(element.valueError).to.equal('');
    });

    it('clears the error when editing is cancelled', async () => {
        await createElement();
        await typeValue('10.000');
        expect(element.valueError).to.not.equal('');
        const cancelButton = element.querySelector('.reject-button');
        cancelButton.click();
        await elementUpdated(element);
        expect(element.valueError).to.equal('');
    });
});
