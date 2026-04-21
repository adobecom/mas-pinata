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
        const parseSearchQuery = (url) => {
            const params = new URLSearchParams(url.split('?')[1]);
            return JSON.parse(params.get('query'));
        };

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

            const result = await aem.searchFragment({ path: '/some-path', query: 'some-query' });

            const actual = [];

            for await (const items of result) {
                actual.push(...items);
            }

            expect(actual).to.deep.equal([
                { id: 1, fields: [{ name: 'variant', value: 'v1' }] },
                { id: 2, fields: [{ name: 'variant', value: 'v2' }] },
            ]);
        });

        it('should scope fullText to Fragment Title plus content fields when a query is provided', async () => {
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ items: [] }),
                };
            };

            const result = aem.searchFragment({ path: '/x', query: 'Embedded Print' });
            for await (const _ of result) {
                // drain the generator so the request is issued
            }

            const searchQuery = parseSearchQuery(capturedUrl);
            expect(searchQuery.filter.fullText.text).to.equal(encodeURIComponent('Embedded Print'));
            expect(searchQuery.filter.fullText.queryMode).to.equal('EDGES');
            expect(searchQuery.filter.fullText.queryFields).to.deep.equal(['title', 'description', 'elements/*']);
        });

        it('should omit fullText when no query is provided', async () => {
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ items: [] }),
                };
            };

            const result = aem.searchFragment({ path: '/x' });
            for await (const _ of result) {
                // drain the generator so the request is issued
            }

            const searchQuery = parseSearchQuery(capturedUrl);
            expect(searchQuery.filter.fullText).to.be.undefined;
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
