import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../src/placeholders/mas-placeholders.js';

const makeStore = (key) => ({ get: () => ({ key }) });

describe('MasPlaceholders handleCopyPlaceholderUrls', () => {
    let sandbox;
    let writeText;
    let context;
    let handle;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        const { default: Store } = await import('../../src/store.js');
        Store.search.set({ path: 'sandbox' });
        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));

        writeText = sandbox.stub().resolves();
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        const MasPlaceholders = customElements.get('mas-placeholders');
        context = {
            placeholders: [makeStore('key-one'), makeStore('key two&x'), makeStore('key-three')],
            selection: [],
        };
        handle = MasPlaceholders.prototype.handleCopyPlaceholderUrls.bind(context);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('copies a deep link for a single selected placeholder', async () => {
        await handle(['key-one']);

        expect(writeText.calledOnce).to.be.true;
        const url = writeText.firstCall.args[0];
        expect(url).to.include('#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=key-one');
    });

    it('copies newline-separated links for multiple placeholders', async () => {
        await handle(['key-one', 'key-three']);

        const urls = writeText.firstCall.args[0].split('\n');
        expect(urls).to.have.length(2);
        expect(urls[0]).to.include('search=key-one');
        expect(urls[1]).to.include('search=key-three');
    });

    it('does not write to the clipboard for an empty selection', async () => {
        await handle([]);

        expect(writeText.called).to.be.false;
    });

    it('percent-encodes special characters in the key', async () => {
        await handle(['key two&x']);

        const url = writeText.firstCall.args[0];
        expect(url).to.include('search=key+two%26x');
    });
});
