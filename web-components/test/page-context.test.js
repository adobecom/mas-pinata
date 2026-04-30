import { expect } from '@esm-bundle/chai';
import {
    EVENT_MAS_PAGE_CONTEXT_READY,
    PAGE_CONTEXT_GLOBAL,
    PAGE_CONTEXT_TIMEOUT_MS,
    getPageContext,
    interpolateFields,
    interpolateTokens,
    whenPageContextReady,
} from '../src/page-context.js';

const clearContext = () => {
    delete window[PAGE_CONTEXT_GLOBAL];
};

describe('page-context constants', () => {
    it('exports the canonical global name', () => {
        expect(PAGE_CONTEXT_GLOBAL).to.equal('masPageContext');
    });

    it('exports the canonical ready event name', () => {
        expect(EVENT_MAS_PAGE_CONTEXT_READY).to.equal(
            'mas:page-context:ready',
        );
    });

    it('exports a sane default timeout under the merch-card load timeout', () => {
        expect(PAGE_CONTEXT_TIMEOUT_MS).to.be.a('number');
        expect(PAGE_CONTEXT_TIMEOUT_MS).to.be.below(20000);
    });
});

describe('interpolateTokens', () => {
    it('substitutes a single token', () => {
        const result = interpolateTokens('Get {{product_name}} today', {
            product_name: 'Photoshop',
        });
        expect(result).to.equal('Get Photoshop today');
    });

    it('substitutes multiple tokens', () => {
        const result = interpolateTokens(
            '{{product_name}} from {{product_family}}',
            { product_name: 'Photoshop', product_family: 'Creative Cloud' },
        );
        expect(result).to.equal('Photoshop from Creative Cloud');
    });

    it('leaves single-brace expressions alone', () => {
        const result = interpolateTokens('Hello {single}', {
            single: 'world',
        });
        expect(result).to.equal('Hello {single}');
    });

    it('returns empty string for missing key', () => {
        const result = interpolateTokens('Get {{product_name}} today', {
            other_key: 'x',
        });
        expect(result).to.equal('Get  today');
    });

    it('returns empty string when context is null', () => {
        const result = interpolateTokens('Get {{product_name}} today', null);
        expect(result).to.equal('Get  today');
    });

    it('returns empty string when context is undefined', () => {
        const result = interpolateTokens(
            'Get {{product_name}} today',
            undefined,
        );
        expect(result).to.equal('Get  today');
    });

    it('returns the original value when not a string', () => {
        expect(interpolateTokens(42, { x: 'y' })).to.equal(42);
        expect(interpolateTokens(null, { x: 'y' })).to.equal(null);
        expect(interpolateTokens(undefined, { x: 'y' })).to.equal(undefined);
        const obj = { foo: 'bar' };
        expect(interpolateTokens(obj, { x: 'y' })).to.equal(obj);
    });

    it('fast path: returns input unchanged when no {{ present', () => {
        const value = 'no tokens here';
        expect(interpolateTokens(value, { product_name: 'x' })).to.equal(
            value,
        );
    });

    it('coerces non-string replacement values via String()', () => {
        const result = interpolateTokens('count: {{n}}', { n: 5 });
        expect(result).to.equal('count: 5');
    });

    it('handles whitespace inside the braces', () => {
        const result = interpolateTokens('{{ product_name }}', {
            product_name: 'Photoshop',
        });
        expect(result).to.equal('Photoshop');
    });

    it('supports arbitrary keys (extensibility)', () => {
        const result = interpolateTokens(
            'Try {{anything_authors_invent}} now',
            { anything_authors_invent: 'XYZ' },
        );
        expect(result).to.equal('Try XYZ now');
    });
});

describe('interpolateFields', () => {
    it('substitutes only listed fields', () => {
        const fields = {
            cardTitle: 'Get {{product_name}}',
            description: 'Buy {{product_name}}',
            unlistedField: 'Skip {{product_name}}',
        };
        interpolateFields(
            fields,
            { product_name: 'Photoshop' },
            ['cardTitle', 'description'],
        );
        expect(fields.cardTitle).to.equal('Get Photoshop');
        expect(fields.description).to.equal('Buy Photoshop');
        expect(fields.unlistedField).to.equal('Skip {{product_name}}');
    });

    it('preserves non-string values (numbers, objects, undefined)', () => {
        const fields = {
            num: 42,
            obj: { foo: 'bar' },
            none: undefined,
        };
        interpolateFields(
            fields,
            { product_name: 'x' },
            ['num', 'obj', 'none'],
        );
        expect(fields.num).to.equal(42);
        expect(fields.obj).to.deep.equal({ foo: 'bar' });
        expect(fields.none).to.equal(undefined);
    });

    it('maps array-of-strings fields element-by-element', () => {
        const fields = {
            ctas: ['Buy {{product_name}}', 'Try {{product_name}}'],
        };
        interpolateFields(
            fields,
            { product_name: 'Photoshop' },
            ['ctas'],
        );
        expect(fields.ctas).to.deep.equal([
            'Buy Photoshop',
            'Try Photoshop',
        ]);
    });

    it('is a no-op when no listed key has a token', () => {
        const fields = { cardTitle: 'Static title' };
        interpolateFields(
            fields,
            { product_name: 'x' },
            ['cardTitle'],
        );
        expect(fields.cardTitle).to.equal('Static title');
    });

    it('substitutes with empty string when context is null', () => {
        const fields = { description: 'Buy {{product_name}}' };
        interpolateFields(fields, null, ['description']);
        expect(fields.description).to.equal('Buy ');
    });

    it('handles empty fieldNames array gracefully', () => {
        const fields = { description: 'Buy {{product_name}}' };
        interpolateFields(fields, { product_name: 'x' }, []);
        expect(fields.description).to.equal('Buy {{product_name}}');
    });

    it('handles null fields gracefully', () => {
        expect(() =>
            interpolateFields(null, { x: 'y' }, ['a']),
        ).to.not.throw();
    });
});

describe('getPageContext', () => {
    afterEach(clearContext);

    it('returns null when global is unset', () => {
        clearContext();
        expect(getPageContext()).to.equal(null);
    });

    it('returns the global object when set', () => {
        const ctx = { product_name: 'Photoshop' };
        window[PAGE_CONTEXT_GLOBAL] = ctx;
        expect(getPageContext()).to.equal(ctx);
    });
});

describe('whenPageContextReady', () => {
    afterEach(clearContext);

    it('resolves immediately when global is pre-set', async () => {
        const ctx = { product_name: 'Photoshop' };
        window[PAGE_CONTEXT_GLOBAL] = ctx;
        const result = await whenPageContextReady(50);
        expect(result).to.equal(ctx);
    });

    it('resolves on mas:page-context:ready event', async () => {
        clearContext();
        const promise = whenPageContextReady(2000);
        // Simulate MEP setting the global and dispatching the event
        await new Promise((r) => setTimeout(r, 10));
        window[PAGE_CONTEXT_GLOBAL] = { product_name: 'Illustrator' };
        document.dispatchEvent(
            new CustomEvent(EVENT_MAS_PAGE_CONTEXT_READY),
        );
        const result = await promise;
        expect(result).to.deep.equal({ product_name: 'Illustrator' });
    });

    it('resolves with null on timeout', async () => {
        clearContext();
        const result = await whenPageContextReady(20);
        expect(result).to.equal(null);
    });
});
