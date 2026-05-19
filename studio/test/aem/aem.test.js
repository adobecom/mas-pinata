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

        it('should issue two fetch calls when query is 3+ chars and deduplicate results', async () => {
            const fetchCalls = [];
            window.fetch = async (url) => {
                fetchCalls.push(url);
                const params = new URLSearchParams(url.split('?')[1]);
                const query = JSON.parse(params.get('query'));
                if (query.filter.fullText) {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                { id: 'frag-1', title: 'Photoshop Plans' },
                                { id: 'frag-2', title: 'Lightroom' },
                            ],
                        }),
                    };
                }
                if (query.filter.title) {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                { id: 'frag-1', title: 'Photoshop Plans' },
                                { id: 'frag-3', title: 'Photography Bundle' },
                            ],
                        }),
                    };
                }
                return { ok: true, json: async () => ({ items: [] }) };
            };

            const result = aem.searchFragment({ path: '/content', query: 'Photo' });
            const actual = [];
            for await (const items of result) {
                actual.push(...items);
            }

            expect(fetchCalls.length).to.equal(2);
            expect(actual).to.deep.equal([
                { id: 'frag-1', title: 'Photoshop Plans' },
                { id: 'frag-2', title: 'Lightroom' },
                { id: 'frag-3', title: 'Photography Bundle' },
            ]);
        });

        it('should not issue title search when query is empty', async () => {
            const fetchCalls = [];
            window.fetch = async (url) => {
                fetchCalls.push(url);
                return {
                    ok: true,
                    json: async () => ({ items: [{ id: 'frag-1' }] }),
                };
            };

            const result = aem.searchFragment({ path: '/content', query: '' });
            const actual = [];
            for await (const items of result) {
                actual.push(...items);
            }

            expect(fetchCalls.length).to.equal(1);
            expect(actual).to.deep.equal([{ id: 'frag-1' }]);
        });

        it('should not issue title search when query is shorter than 3 chars', async () => {
            const fetchCalls = [];
            window.fetch = async (url) => {
                fetchCalls.push(url);
                return {
                    ok: true,
                    json: async () => ({ items: [{ id: 'frag-1' }] }),
                };
            };

            const result = aem.searchFragment({ path: '/content', query: 'ab' });
            const actual = [];
            for await (const items of result) {
                actual.push(...items);
            }

            expect(fetchCalls.length).to.equal(1);
            expect(actual).to.deep.equal([{ id: 'frag-1' }]);
        });

        it('should only paginate fullText search on subsequent pages', async () => {
            const fetchCalls = [];
            window.fetch = async (url) => {
                fetchCalls.push(url);
                const params = new URLSearchParams(url.split('?')[1]);
                const query = JSON.parse(params.get('query'));
                if (query.filter.title) {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [{ id: 'title-1', title: 'Title Match' }],
                        }),
                    };
                }
                if (params.get('cursor') === 'page2') {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [{ id: 'frag-3', title: 'Page 2' }],
                        }),
                    };
                }
                return {
                    ok: true,
                    json: async () => ({
                        items: [{ id: 'frag-1', title: 'Page 1' }],
                        cursor: 'page2',
                    }),
                };
            };

            const result = aem.searchFragment({ path: '/content', query: 'test' });
            const actual = [];
            for await (const items of result) {
                actual.push(...items);
            }

            // First page: fullText + title (2 calls), second page: fullText only (1 call)
            expect(fetchCalls.length).to.equal(3);
            expect(actual).to.deep.equal([
                { id: 'frag-1', title: 'Page 1' },
                { id: 'title-1', title: 'Title Match' },
                { id: 'frag-3', title: 'Page 2' },
            ]);
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
