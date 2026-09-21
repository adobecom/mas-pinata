import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/placeholders/mas-placeholders-item.js';

const KEY = 'my-placeholder-key';

const createStore = () => ({
    get: () => ({ key: KEY, value: 'value', status: 'Draft', updatedBy: 'Fred', updatedAt: '', isRichText: false }),
    subscribe: () => {},
    unsubscribe: () => {},
});

const renderItem = (onCopyCode) =>
    fixture(html`
        <mas-placeholders-item
            .placeholderStore=${createStore()}
            .activeDropdown=${true}
            .toggleDropdown=${() => {}}
            .onCopyCode=${onCopyCode}
        ></mas-placeholders-item>
    `);

describe('mas-placeholders-item row menu', () => {
    it('renders a Copy Code item in the row menu', async () => {
        const el = await renderItem(sinon.stub());
        const item = el.querySelector('.dropdown-item.copy-code');
        expect(item).to.exist;
        expect(item.textContent).to.include('Copy Code');
    });

    it('clicking Copy Code calls onCopyCode with the row key', async () => {
        const onCopyCode = sinon.stub();
        const el = await renderItem(onCopyCode);
        el.querySelector('.dropdown-item.copy-code').click();
        expect(onCopyCode.calledOnceWith(KEY)).to.be.true;
    });
});
