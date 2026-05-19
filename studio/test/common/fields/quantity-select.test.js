import { expect } from '@esm-bundle/chai';
import {
    createQuantitySelectValue,
    parseQuantitySelectValue,
} from '../../../src/common/fields/quantity-select.js';

describe('quantity-select serialization', () => {
    it('parseQuantitySelectValue returns defaults when value is empty', () => {
        expect(parseQuantitySelectValue('')).to.deep.equal({
            title: '',
            min: '1',
            step: '1',
            defaultValue: '',
        });
    });

    it('parseQuantitySelectValue extracts default-value when present', () => {
        const html = '<merch-quantity-select title="Pick" min="2" step="1" default-value="4"></merch-quantity-select>';
        expect(parseQuantitySelectValue(html)).to.deep.equal({
            title: 'Pick',
            min: '2',
            step: '1',
            defaultValue: '4',
        });
    });

    it('parseQuantitySelectValue defaults defaultValue to empty when missing', () => {
        const html = '<merch-quantity-select title="" min="3" step="1"></merch-quantity-select>';
        expect(parseQuantitySelectValue(html).defaultValue).to.equal('');
    });

    it('createQuantitySelectValue omits default-value attribute when empty', () => {
        const html = createQuantitySelectValue({
            title: 'Quantity',
            min: '1',
            step: '1',
            defaultValue: '',
        });
        expect(html).to.not.include('default-value');
        expect(html).to.include('min="1"');
    });

    it('createQuantitySelectValue writes default-value attribute when provided', () => {
        const html = createQuantitySelectValue({
            title: 'Quantity',
            min: '2',
            step: '1',
            defaultValue: '4',
        });
        expect(html).to.include('default-value="4"');
    });

    it('round-trips title, min, step, and defaultValue through create + parse', () => {
        const config = { title: 'Pick a number', min: '2', step: '3', defaultValue: '5' };
        const html = createQuantitySelectValue(config);
        expect(parseQuantitySelectValue(html)).to.deep.equal(config);
    });
});
