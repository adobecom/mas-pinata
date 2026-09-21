import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import '../../src/placeholders/mas-placeholders-item.js';

describe('mas-placeholders-item onCopyCode', () => {
    let sandbox;
    let element;
    let toastStub;
    let writeTextStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // showToast is an ES module export and cannot be stubbed; it delegates to Events.toast.emit.
        toastStub = sandbox.stub(Events.toast, 'emit');
        writeTextStub = sandbox.stub(navigator.clipboard, 'writeText');
        Store.search.set({ path: 'test-folder' });
        element = document.createElement('mas-placeholders-item');
        element.placeholderStore = { get: () => ({ key: 'test-key', locale: 'en_US' }) };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('shows "Copied 1 link" when the clipboard write succeeds', async () => {
        writeTextStub.resolves();
        await element.onCopyCode({ stopPropagation: () => {} });
        expect(toastStub.calledOnceWith({ variant: 'positive', content: 'Copied 1 link' })).to.be.true;
    });

    it('shows the failure toast when the clipboard write fails', async () => {
        writeTextStub.rejects(new Error('denied'));
        await element.onCopyCode({ stopPropagation: () => {} });
        expect(toastStub.calledOnceWith({ variant: 'negative', content: 'Failed to copy to clipboard' })).to.be.true;
    });
});
