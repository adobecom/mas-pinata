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
        // These assert request serialization only — the OR/property filter schema is unverifiable
        // from docs, so true server behavior is proven by a live probe and the Nala E2E spec.
        const parseFilter = (url) => {
            const params = new URL(url, 'http://test').searchParams;
            return JSON.parse(params.get('query')).filter;
        };

        const stubSinglePage = (items = []) => {
            const calls = [];
            window.fetch = async (url) => {
                calls.push(url);
                return { ok: true, json: async () => ({ items }) };
            };
            return calls;
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

        it('ORs fullText, jcr:title, and the title content field for a normal query', async () => {
            const calls = stubSinglePage([]);
            for await (const _ of aem.searchFragment({ path: '/x', query: 'photo' })) {
                // drain
            }
            expect(calls).to.have.lengthOf(1);
            const filter = parseFilter(calls[0]);
            expect(filter.path).to.equal('/x');
            expect(filter.any).to.be.an('array').with.lengthOf(3);

            const fullTextBranch = filter.any.find((b) => b.fullText);
            expect(fullTextBranch.fullText.text).to.equal(encodeURIComponent('photo'));
            expect(fullTextBranch.fullText.queryMode).to.equal('EDGES');

            const propBranch = filter.any.find((b) => b.properties);
            expect(propBranch.properties).to.deep.equal([
                { name: 'jcr:title', value: 'photo', operator: 'CONTAINS', caseSensitive: false },
            ]);

            const fieldBranch = filter.any.find((b) => b.fields);
            expect(fieldBranch.fields).to.deep.equal([
                { name: 'title', value: 'photo', operator: 'CONTAINS', caseSensitive: false },
            ]);
        });

        it('omits all text conditions when the query is empty', async () => {
            const calls = stubSinglePage([]);
            for await (const _ of aem.searchFragment({ path: '/x' })) {
                // drain
            }
            const filter = parseFilter(calls[0]);
            expect(filter.any).to.equal(undefined);
            expect(filter.fullText).to.equal(undefined);
            expect(filter.path).to.equal('/x');
        });

        it('falls back to fullText-only for a 1–2 char query', async () => {
            const calls = stubSinglePage([]);
            for await (const _ of aem.searchFragment({ path: '/x', query: 'ph' })) {
                // drain
            }
            const filter = parseFilter(calls[0]);
            expect(filter.any).to.equal(undefined);
            expect(filter.fullText.text).to.equal(encodeURIComponent('ph'));
            expect(filter.fullText.queryMode).to.equal('EDGES');
        });

        it('preserves tag, model, status, and createdBy filters alongside the text OR branch', async () => {
            const calls = stubSinglePage([]);
            for await (const _ of aem.searchFragment({
                path: '/x',
                query: 'photo',
                tags: ['mas:status/draft'],
                modelIds: ['m1'],
                status: 'PUBLISHED',
                createdBy: ['user@adobe.com'],
            })) {
                // drain
            }
            const filter = parseFilter(calls[0]);
            expect(filter.any).to.be.an('array').with.lengthOf(3);
            expect(filter.tags).to.deep.equal(['mas:status/draft']);
            expect(filter.modelIds).to.deep.equal(['m1']);
            expect(filter.status).to.deep.equal(['PUBLISHED']);
            expect(filter.created.by).to.deep.equal(['user@adobe.com', 'USER@ADOBE.COM']);
        });

        it('degrades to fullText-only and retries once when AEM rejects the OR filter', async () => {
            const calls = [];
            window.fetch = async (url) => {
                calls.push(url);
                if (parseFilter(url).any) {
                    return { ok: false, status: 400, statusText: 'Bad Request', json: async () => ({}) };
                }
                return { ok: true, json: async () => ({ items: [] }) };
            };

            const pages = [];
            for await (const items of aem.searchFragment({ path: '/x', query: 'photo' })) {
                pages.push(items);
            }

            expect(calls).to.have.lengthOf(2);
            expect(parseFilter(calls[0]).any).to.be.an('array').with.lengthOf(3);
            const retryFilter = parseFilter(calls[1]);
            expect(retryFilter.any).to.equal(undefined);
            expect(retryFilter.fullText.text).to.equal(encodeURIComponent('photo'));
            expect(retryFilter.fullText.queryMode).to.equal('EDGES');
            expect(pages).to.deep.equal([[]]);
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
