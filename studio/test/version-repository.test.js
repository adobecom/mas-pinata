import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { VersionRepository, isSystemAccount, readAudit, resolveActor } from '../src/version-repository.js';
import Events from '../src/events.js';

describe('VersionRepository', () => {
    let sandbox;
    let versionRepository;
    let mockRepository;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockRepository = {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub(),
                            getVersions: sandbox.stub(),
                            getVersion: sandbox.stub(),
                            save: sandbox.stub(),
                        },
                    },
                },
            },
        };
        versionRepository = new VersionRepository(mockRepository);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('loadVersionHistory', () => {
        it('should load fragment and version history', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: '2024-01-15T10:00:00Z',
                modifiedBy: 'user@example.com',
            };
            const versionsResponse = {
                items: [
                    { id: 'v1', version: '1.0', created: '2024-01-14T10:00:00Z' },
                    { id: 'v2', version: '2.0', created: '2024-01-13T10:00:00Z' },
                ],
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves(versionsResponse);

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.fragment).to.equal(fragment);
            expect(result.versions).to.have.lengthOf(3); // current + 2 historical
            expect(result.versions[0].isCurrent).to.be.true;
            expect(result.versions[0].version).to.equal('Current');
            expect(result.currentVersion.createdBy).to.equal('user@example.com');
        });

        it('should handle modified date as object with "at" property', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-15T10:00:00Z', by: 'user@example.com' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.created).to.equal('2024-01-15T10:00:00Z');
            expect(result.currentVersion.createdBy).to.equal('user@example.com');
        });

        it('should handle missing modified date', async () => {
            const fragment = { id: 'fragment-1' };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.created).to.be.a('string');
            expect(result.currentVersion.createdBy).to.equal('System');
        });

        it('should expose the full name alongside the user id when AEM provides it', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-15T10:00:00Z', by: 'alice@example.com', fullName: 'Alice Smith' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.createdBy).to.equal('alice@example.com');
            expect(result.currentVersion.createdByName).to.equal('Alice Smith');
        });

        it('should attribute publishing to the triggering user instead of the workflow service account', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-15T10:00:00Z', by: 'alice@example.com', fullName: 'Alice Smith' },
                published: { at: '2024-01-15T10:05:00Z', by: 'workflow-process-service' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.publishedAt).to.equal('2024-01-15T10:05:00Z');
            expect(result.currentVersion.publishedBy).to.equal('alice@example.com');
            expect(result.currentVersion.publishedByName).to.equal('Alice Smith');
        });

        it('should keep the real publisher when AEM already records a user', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-15T10:00:00Z', by: 'alice@example.com' },
                published: { at: '2024-01-15T10:05:00Z', by: 'bob@example.com', fullName: 'Bob Jones' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.publishedBy).to.equal('bob@example.com');
            expect(result.currentVersion.publishedByName).to.equal('Bob Jones');
        });

        it('should not credit a publish to an edit made after it', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-16T09:00:00Z', by: 'alice@example.com' },
                published: { at: '2024-01-15T10:05:00Z', by: 'workflow-process-service' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.publishedBy).to.equal('workflow-process-service');
        });

        it('should leave publish attribution unset when the fragment was never published', async () => {
            const fragment = {
                id: 'fragment-1',
                modified: { at: '2024-01-15T10:00:00Z', by: 'alice@example.com' },
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves({ items: [] });

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.currentVersion.publishedAt).to.be.undefined;
            expect(result.currentVersion.publishedBy).to.be.undefined;
        });

        it('should normalize historical versions recorded in the nested audit shape', async () => {
            const fragment = { id: 'fragment-1', modified: '2024-01-15T10:00:00Z', modifiedBy: 'alice@example.com' };
            const versionsResponse = {
                items: [
                    {
                        id: 'v1',
                        version: '1.0',
                        created: { at: '2024-01-14T10:00:00Z', by: 'bob@example.com', fullName: 'Bob Jones' },
                    },
                ],
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves(versionsResponse);

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.versions[1].created).to.equal('2024-01-14T10:00:00Z');
            expect(result.versions[1].createdBy).to.equal('bob@example.com');
            expect(result.versions[1].createdByName).to.equal('Bob Jones');
        });

        it('should attribute a workflow-created version to the user who modified it', async () => {
            const fragment = { id: 'fragment-1', modified: '2024-01-15T10:00:00Z', modifiedBy: 'alice@example.com' };
            const versionsResponse = {
                items: [
                    {
                        id: 'v1',
                        version: '1.0',
                        created: { at: '2024-01-14T10:05:00Z', by: 'workflow-process-service' },
                        modified: { at: '2024-01-14T10:00:00Z', by: 'carol@example.com', fullName: 'Carol Ray' },
                    },
                ],
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves(versionsResponse);

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.versions[1].createdBy).to.equal('carol@example.com');
            expect(result.versions[1].createdByName).to.equal('Carol Ray');
        });

        it('should preserve flat historical version fields', async () => {
            const fragment = { id: 'fragment-1', modified: '2024-01-15T10:00:00Z', modifiedBy: 'alice@example.com' };
            const versionsResponse = {
                items: [{ id: 'v1', version: '1.0', created: '2024-01-14T10:00:00Z', createdBy: 'bob@example.com' }],
            };

            mockRepository.aem.sites.cf.fragments.getById.resolves(fragment);
            mockRepository.aem.sites.cf.fragments.getVersions.resolves(versionsResponse);

            const result = await versionRepository.loadVersionHistory('fragment-1');

            expect(result.versions[1].created).to.equal('2024-01-14T10:00:00Z');
            expect(result.versions[1].createdBy).to.equal('bob@example.com');
            expect(result.versions[1].createdByName).to.be.undefined;
        });
    });

    describe('isSystemAccount', () => {
        it('should recognize workflow service accounts regardless of casing or padding', () => {
            expect(isSystemAccount('workflow-process-service')).to.be.true;
            expect(isSystemAccount('  Workflow-Process-Service ')).to.be.true;
            expect(isSystemAccount('workflow-service')).to.be.true;
        });

        it('should not treat real users or missing ids as system accounts', () => {
            expect(isSystemAccount('alice@example.com')).to.be.false;
            expect(isSystemAccount(undefined)).to.be.false;
            expect(isSystemAccount('')).to.be.false;
        });
    });

    describe('readAudit', () => {
        it('should read the nested audit shape', () => {
            const audit = readAudit({ at: '2024-01-15T10:00:00Z', by: 'alice@example.com', fullName: 'Alice Smith' });
            expect(audit).to.deep.equal({
                at: '2024-01-15T10:00:00Z',
                by: 'alice@example.com',
                fullName: 'Alice Smith',
            });
        });

        it('should read the flattened audit shape', () => {
            const audit = readAudit('2024-01-15T10:00:00Z', 'alice@example.com');
            expect(audit.at).to.equal('2024-01-15T10:00:00Z');
            expect(audit.by).to.equal('alice@example.com');
            expect(audit.fullName).to.be.undefined;
        });

        it('should fall back to the flattened user id when the nested entry omits it', () => {
            const audit = readAudit({ at: '2024-01-15T10:00:00Z' }, 'alice@example.com');
            expect(audit.by).to.equal('alice@example.com');
        });

        it('should return an empty audit for missing metadata', () => {
            expect(readAudit(undefined, undefined)).to.deep.equal({ at: undefined, by: undefined, fullName: undefined });
        });
    });

    describe('resolveActor', () => {
        it('should keep a real user recorded on the action', () => {
            const actor = resolveActor(
                { at: '2024-01-15T10:05:00Z', by: 'bob@example.com', fullName: 'Bob Jones' },
                { at: '2024-01-15T10:00:00Z', by: 'alice@example.com' },
            );
            expect(actor).to.deep.equal({ by: 'bob@example.com', fullName: 'Bob Jones', system: false });
        });

        it('should substitute the modifying user for a system account', () => {
            const actor = resolveActor(
                { at: '2024-01-15T10:05:00Z', by: 'workflow-process-service' },
                { at: '2024-01-15T10:00:00Z', by: 'alice@example.com', fullName: 'Alice Smith' },
            );
            expect(actor).to.deep.equal({ by: 'alice@example.com', fullName: 'Alice Smith', system: false });
        });

        it('should report a system actor when no modification precedes the action', () => {
            const actor = resolveActor({ at: '2024-01-15T10:05:00Z', by: 'workflow-process-service' }, undefined);
            expect(actor.by).to.equal('workflow-process-service');
            expect(actor.system).to.be.true;
        });

        it('should not substitute another system account', () => {
            const actor = resolveActor(
                { at: '2024-01-15T10:05:00Z', by: 'workflow-process-service' },
                { at: '2024-01-15T10:00:00Z', by: 'admin' },
            );
            expect(actor.by).to.equal('workflow-process-service');
            expect(actor.system).to.be.true;
        });

        it('should not substitute when timestamps are unusable', () => {
            const actor = resolveActor(
                { at: undefined, by: 'workflow-process-service' },
                { at: '2024-01-15T10:00:00Z', by: 'alice@example.com' },
            );
            expect(actor.by).to.equal('workflow-process-service');
            expect(actor.system).to.be.true;
        });
    });

    describe('loadVersionData', () => {
        it('should load version data by fragment and version ID', async () => {
            const versionData = {
                id: 'v1',
                title: 'Test Fragment',
                description: 'Test description',
                fields: [{ name: 'field1', values: ['value1'] }],
            };

            mockRepository.aem.sites.cf.fragments.getVersion.resolves(versionData);

            const result = await versionRepository.loadVersionData('fragment-1', 'v1');

            expect(result).to.equal(versionData);
            expect(mockRepository.aem.sites.cf.fragments.getVersion.calledWith('fragment-1', 'v1')).to.be.true;
        });

        it('should throw error when version data loading fails', async () => {
            mockRepository.aem.sites.cf.fragments.getVersion.rejects(new Error('Version not found'));

            try {
                await versionRepository.loadVersionData('fragment-1', 'v1');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Version not found');
            }
        });
    });

    describe('restoreVersion', () => {
        let toastEmitStub;

        beforeEach(() => {
            toastEmitStub = sandbox.stub(Events.toast, 'emit');
        });

        it('should restore version with fields only', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [{ name: 'field1', type: 'text', values: ['current'] }],
            };
            const versionData = {
                fields: [{ name: 'field1', values: ['restored'] }],
            };
            const normalizedFields = { field1: 'restored' };
            const denormalizedFields = [{ name: 'field1', type: 'text', values: ['restored'] }];

            mockRepository.aem.sites.cf.fragments.getVersion.resolves(versionData);
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns(denormalizedFields);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            expect(mockRepository.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedFragment.fields).to.deep.equal(denormalizedFields);
            expect(toastEmitStub.calledOnce).to.be.true;
            expect(toastEmitStub.firstCall.args[0].variant).to.equal('positive');
        });

        it('should restore fragment title and description from version', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [{ name: 'field1', type: 'text', values: ['current'] }],
            };
            const versionData = {
                title: 'Restored Title',
                description: 'Restored Description',
                fields: [{ name: 'field1', values: ['restored'] }],
            };
            const normalizedFields = {
                field1: 'restored',
                fragmentTitle: 'Restored Title',
                fragmentDescription: 'Restored Description',
            };
            const denormalizedFields = [{ name: 'field1', type: 'text', values: ['restored'] }];

            mockRepository.aem.sites.cf.fragments.getVersion.resolves(versionData);
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns(denormalizedFields);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            expect(mockRepository.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];

            // Verify title and description are restored
            expect(savedFragment.title).to.equal('Restored Title');
            expect(savedFragment.description).to.equal('Restored Description');
            expect(savedFragment.fields).to.deep.equal(denormalizedFields);
        });

        it('should not override title/description when not present in version', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [{ name: 'field1', type: 'text', values: ['current'] }],
            };
            const versionData = {
                fields: [{ name: 'field1', values: ['restored'] }],
            };
            // No fragmentTitle or fragmentDescription in normalized fields
            const normalizedFields = { field1: 'restored' };
            const denormalizedFields = [{ name: 'field1', type: 'text', values: ['restored'] }];

            mockRepository.aem.sites.cf.fragments.getVersion.resolves(versionData);
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns(denormalizedFields);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];

            // Title and description should remain from current fragment (spread operator)
            expect(savedFragment.title).to.equal('Current Title');
            expect(savedFragment.description).to.equal('Current Description');
        });

        it('should handle restore failure gracefully', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = { id: 'fragment-1', fields: [] };

            mockRepository.aem.sites.cf.fragments.getVersion.rejects(new Error('API Error'));

            const normalizeFields = sandbox.stub();
            const denormalizeFields = sandbox.stub();

            try {
                await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('API Error');
                expect(toastEmitStub.calledOnce).to.be.true;
                expect(toastEmitStub.firstCall.args[0].variant).to.equal('negative');
            }
        });

        it('should restore only title when description is not in version', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [],
            };
            const normalizedFields = {
                fragmentTitle: 'Restored Title Only',
            };

            mockRepository.aem.sites.cf.fragments.getVersion.resolves({ fields: [] });
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns([]);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedFragment.title).to.equal('Restored Title Only');
            expect(savedFragment.description).to.equal('Current Description');
        });

        it('should restore only description when title is not in version', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [],
            };
            const normalizedFields = {
                fragmentDescription: 'Restored Description Only',
            };

            mockRepository.aem.sites.cf.fragments.getVersion.resolves({ fields: [] });
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns([]);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedFragment.title).to.equal('Current Title');
            expect(savedFragment.description).to.equal('Restored Description Only');
        });

        it('should preserve current fragment variations field when restoring', async () => {
            const version = { id: 'v1', title: 'Version 1' };
            const currentVariations = ['/content/dam/mas/sandbox/en_AU/card-name-test'];
            const currentFragment = {
                id: 'fragment-1',
                title: 'Current Title',
                description: 'Current Description',
                fields: [
                    { name: 'field1', type: 'text', values: ['current'] },
                    {
                        name: 'variations',
                        type: 'content-fragment',
                        multiple: true,
                        values: currentVariations,
                    },
                ],
            };
            const versionData = {
                fields: [{ name: 'field1', values: ['restored'] }],
            };
            const normalizedFields = { field1: 'restored' };
            const denormalizedFieldsFromVersion = [{ name: 'field1', type: 'text', values: ['restored'] }];

            mockRepository.aem.sites.cf.fragments.getVersion.resolves(versionData);
            mockRepository.aem.sites.cf.fragments.save.resolves({});

            const normalizeFields = sandbox.stub().returns(normalizedFields);
            const denormalizeFields = sandbox.stub().returns(denormalizedFieldsFromVersion);

            await versionRepository.restoreVersion(version, currentFragment, normalizeFields, denormalizeFields);

            const savedFragment = mockRepository.aem.sites.cf.fragments.save.firstCall.args[0];
            const savedVariationsField = savedFragment.fields.find((f) => f.name === 'variations');
            expect(savedVariationsField).to.not.be.undefined;
            expect(savedVariationsField.values).to.deep.equal(currentVariations);
            expect(savedFragment.fields).to.have.lengthOf(2);
        });
    });

    describe('searchVersions', () => {
        const versions = [
            { version: '1.0', createdBy: 'alice@example.com', created: '2024-01-15', comment: 'Initial version' },
            { version: '2.0', createdBy: 'bob@example.com', created: '2024-01-16', comment: 'Added features' },
            { version: '3.0', createdBy: 'alice@example.com', created: '2024-01-17', comment: 'Bug fixes' },
        ];

        it('should return all versions when query is empty', () => {
            const result = versionRepository.searchVersions(versions, '');
            expect(result).to.deep.equal(versions);
        });

        it('should return all versions when query is null', () => {
            const result = versionRepository.searchVersions(versions, null);
            expect(result).to.deep.equal(versions);
        });

        it('should filter by version number', () => {
            const result = versionRepository.searchVersions(versions, '2.0');
            expect(result).to.have.lengthOf(1);
            expect(result[0].version).to.equal('2.0');
        });

        it('should filter by createdBy (case insensitive)', () => {
            const result = versionRepository.searchVersions(versions, 'ALICE');
            expect(result).to.have.lengthOf(2);
        });

        it('should filter by date', () => {
            const result = versionRepository.searchVersions(versions, '2024-01-16');
            expect(result).to.have.lengthOf(1);
            expect(result[0].version).to.equal('2.0');
        });

        it('should filter by comment', () => {
            const result = versionRepository.searchVersions(versions, 'features');
            expect(result).to.have.lengthOf(1);
            expect(result[0].comment).to.include('features');
        });

        it('should filter by author display name', () => {
            const named = [...versions, { version: '4.0', createdBy: 'dan@example.com', createdByName: 'Dan Fox' }];
            const result = versionRepository.searchVersions(named, 'dan fox');
            expect(result).to.have.lengthOf(1);
            expect(result[0].version).to.equal('4.0');
        });

        it('should filter by publisher', () => {
            const published = [...versions, { version: '4.0', publishedBy: 'erin@example.com', publishedByName: 'Erin Lee' }];
            expect(versionRepository.searchVersions(published, 'erin@example.com')).to.have.lengthOf(1);
            expect(versionRepository.searchVersions(published, 'Erin Lee')).to.have.lengthOf(1);
        });
    });
});
