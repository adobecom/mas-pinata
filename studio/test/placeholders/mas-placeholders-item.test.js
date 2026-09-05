import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Events from '../../src/events.js';
import { getPlaceholderCode } from '../../src/placeholders/mas-placeholders-item.js';
import '../../src/placeholders/mas-placeholders-item.js';

const makePlaceholderStore = (key = 'test') => ({
    get: () => ({ key, status: 'Draft', isRichText: false, hasChanges: false }),
    updateField: sinon.stub(),
    discardChanges: sinon.stub(),
    subscribe: sinon.stub(),
    unsubscribe: sinon.stub(),
});

function mountItem({ key = 'test', activeDropdown = false } = {}) {
    const el = document.createElement('mas-placeholders-item');
    el.placeholderStore = makePlaceholderStore(key);
    el.editing = false;
    el.disabled = false;
    el.activeDropdown = activeDropdown;
    el.toggleEditing = sinon.stub();
    el.toggleDropdown = sinon.stub();
    el.updatePending = sinon.stub();
    document.body.appendChild(el);
    return el;
}

describe('getPlaceholderCode', () => {
    it('returns {{key}} for a given key', () => {
        expect(getPlaceholderCode('test')).to.equal('{{test}}');
        expect(getPlaceholderCode('save-today')).to.equal('{{save-today}}');
        expect(getPlaceholderCode('')).to.equal('{{}}');
    });
});

describe('MasPlaceholdersItem', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        document.body.querySelectorAll('mas-placeholders-item').forEach((el) => el.remove());
    });

    describe('dropdown items when activeDropdown=true', () => {
        it('renders exactly three .dropdown-item entries labelled Publish, Copy Code, Delete in order', async () => {
            const el = mountItem({ activeDropdown: true });
            await el.updateComplete;

            const items = el.querySelectorAll('.dropdown-item');
            expect(items.length).to.equal(3);
            expect(items[0].querySelector('span').textContent).to.equal('Publish');
            expect(items[1].querySelector('span').textContent).to.equal('Copy Code');
            expect(items[2].querySelector('span').textContent).to.equal('Delete');
        });

        it('does not render Copy Code in editing mode', async () => {
            const el = mountItem({ activeDropdown: true });
            el.editing = true;
            await el.updateComplete;

            const items = el.querySelectorAll('.dropdown-item');
            expect(items.length).to.equal(0);
        });
    });

    describe('onCopyCode', () => {
        it('writes {{key}} to the clipboard, calls toggleDropdown, and emits a positive toast', async () => {
            const toastSpy = sandbox.spy();
            Events.toast.subscribe(toastSpy);

            const writeTextStub = sandbox.stub().resolves();
            sandbox.stub(navigator, 'clipboard').value({ writeText: writeTextStub });

            const el = mountItem({ key: 'test', activeDropdown: true });
            await el.updateComplete;

            const copyItem = [...el.querySelectorAll('.dropdown-item')].find(
                (n) => n.querySelector('span').textContent === 'Copy Code',
            );
            copyItem.click();
            await new Promise((r) => setTimeout(r, 10));

            expect(writeTextStub.calledOnce).to.be.true;
            expect(writeTextStub.firstCall.args[0]).to.equal('{{test}}');
            expect(el.toggleDropdown.calledOnce).to.be.true;
            expect(el.toggleDropdown.firstCall.args[0]).to.equal('test');
            expect(toastSpy.calledOnce).to.be.true;
            expect(toastSpy.firstCall.args[0]).to.deep.equal({
                variant: 'positive',
                content: 'Placeholder code copied to clipboard',
            });

            Events.toast.unsubscribe(toastSpy);
        });

        it('emits a negative toast when writeText rejects and does not rethrow', async () => {
            const toastSpy = sandbox.spy();
            Events.toast.subscribe(toastSpy);

            const writeTextStub = sandbox.stub().rejects(new Error('permission denied'));
            sandbox.stub(navigator, 'clipboard').value({ writeText: writeTextStub });

            const el = mountItem({ key: 'test', activeDropdown: true });
            await el.updateComplete;

            const copyItem = [...el.querySelectorAll('.dropdown-item')].find(
                (n) => n.querySelector('span').textContent === 'Copy Code',
            );
            copyItem.click();
            await new Promise((r) => setTimeout(r, 10));

            expect(toastSpy.calledOnce).to.be.true;
            expect(toastSpy.firstCall.args[0]).to.deep.equal({
                variant: 'negative',
                content: 'Failed to copy placeholder code.',
            });

            Events.toast.unsubscribe(toastSpy);
        });

        it('does not call toggleEditing when Copy Code is clicked', async () => {
            sandbox.stub(navigator, 'clipboard').value({ writeText: sandbox.stub().resolves() });

            const el = mountItem({ key: 'test', activeDropdown: true });
            await el.updateComplete;

            const copyItem = [...el.querySelectorAll('.dropdown-item')].find(
                (n) => n.querySelector('span').textContent === 'Copy Code',
            );
            copyItem.click();
            await new Promise((r) => setTimeout(r, 10));

            expect(el.toggleEditing.called).to.be.false;
        });
    });
});
