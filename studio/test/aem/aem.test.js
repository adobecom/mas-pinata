import { expect } from '@esm-bundle/chai';
import { AEM, filterByTags } from '../../src/aem/aem.js';

describe('aem.js', () => {
    const aem = new AEM('test');

    describe('filterByTags', () => {
        it('should filter tags with AND/OR logic', () => {
            const items = [
                {
                    id: 'item1',
                    tags: [{ id: 'mas:plan_type/abm' }, { id: 'mas:status/draft' }],
                },
                {
                    id: 'item2',
                    tags: [{ id: 'mas:plan_type/m2m' }, { id: 'mas:status/draft' }],
                },
                {
                    id: 'item3',
                    tags: [{ id: 'mas:plan_type/abm' }, { id: 'mas:plan_type/m2m' }],
                },
            ];

            // OR logic within same root
            const sameRootTags = ['mas:plan_type/abm', 'mas:plan_type/m2m'];
            const sameRootResult = items.filter(filterByTags(sameRootTags)).map((i) => i.id);
            expect(sameRootResult).to.deep.equal(['item1', 'item2', 'item3']);

            // AND logic between different roots
            const diffRootTags = ['mas:plan_type/abm', 'mas:status/draft'];
            const diffRootResult = items.filter(filterByTags(diffRootTags)).map((i) => i.id);
            expect(diffRootResult).to.deep.equal(['item1']);
        });
    });

    describe('method: searchFragment', () => {
        it('should fetch content fragments with multiple calls', async () => {
            window.fetch = async (url) => {
                if (url.includes('cursor1')) {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                {
                                    id: 2,
                                    fields: [{ name: 'variant', value: 'v2' }],
                                },
                            ],
                        }),
                    };
                } else {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                {
                                    id: 1,
                                    fields: [{ name: 'variant', value: 'v1' }],
                                },
                            ],
                            cursor: 'cursor1',
                        }),
                    };
                }
            };

            const result = await aem.searchFragment('some-query');

            const actual = [];

            for await (const items of result) {
                actual.push(...items);
            }

            expect(actual).to.deep.equal([
                { id: 1, fields: [{ name: 'variant', value: 'v1' }] },
                { id: 2, fields: [{ name: 'variant', value: 'v2' }] },
            ]);
        });
    });

    describe('method: searchFragment - title filters', () => {
        it('should include properties and fields filters when query is provided', async () => {
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ items: [] }),
                };
            };

            const result = aem.searchFragment({ path: '/content/dam', query: 'photo' });
            for await (const _ of result) { /* consume generator */ }

            const searchParams = new URLSearchParams(capturedUrl.split('?')[1]);
            const parsedQuery = JSON.parse(searchParams.get('query'));

            expect(parsedQuery.filter.fullText).to.deep.equal({
                text: 'photo',
                queryMode: 'EDGES',
            });
            expect(parsedQuery.filter.properties).to.deep.equal([
                {
                    property: 'jcr:title',
                    value: 'photo',
                    operation: 'CONTAINS',
                },
            ]);
            expect(parsedQuery.filter.fields).to.deep.equal([
                {
                    name: 'title',
                    value: 'photo',
                    operation: 'CONTAINS',
                },
            ]);
        });

        it('should not include properties or fields filters when query is empty', async () => {
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ items: [] }),
                };
            };

            const result = aem.searchFragment({ path: '/content/dam' });
            for await (const _ of result) { /* consume generator */ }

            const searchParams = new URLSearchParams(capturedUrl.split('?')[1]);
            const parsedQuery = JSON.parse(searchParams.get('query'));

            expect(parsedQuery.filter.properties).to.be.undefined;
            expect(parsedQuery.filter.fields).to.be.undefined;
            expect(parsedQuery.filter.fullText).to.be.undefined;
        });
    });

    describe('method: getFragmentTranslations', () => {
        it('should fetch translations', async () => {
            window.fetch = async () => ({
                ok: true,
                json: async () => ({ languageCopies: [] }),
            });

            const result = await aem.getFragmentTranslations('test-id');
            expect(result.languageCopies).to.be.an('array');
        });
    });
});
