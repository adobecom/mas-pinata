const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Preferences action', function () {
    this.timeout(5000);
    let mockState;
    let mockIms;
    let mockLogger;
    let stateInitStub;
    let preferencesAction;

    function baseParams(overrides = {}) {
        return {
            __ow_headers: {
                authorization: 'Bearer good-token',
            },
            __ow_method: 'GET',
            ...overrides,
        };
    }

    beforeEach(() => {
        mockState = {
            get: sinon.stub().resolves(null),
            put: sinon.stub().resolves(),
            delete: sinon.stub().resolves(),
        };
        mockIms = {
            validateToken: sinon.stub(),
        };
        mockLogger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };
        stateInitStub = sinon.stub().resolves(mockState);
        const ImsConstructorStub = sinon.stub().returns(mockIms);

        preferencesAction = proxyquire('../../src/preferences/index.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
            '@adobe/aio-lib-state': {
                init: stateInitStub,
            },
            '@adobe/aio-lib-ims': {
                Ims: ImsConstructorStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return { savedViews: [] } on GET when state has no value for the user', async () => {
        mockIms.validateToken.resolves({ valid: true, token: { user_id: 'user-1' } });
        mockState.get.resolves(null);

        const result = await preferencesAction.main(baseParams());

        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.equal({ savedViews: [] });
        expect(mockState.get).to.have.been.calledOnceWith('mas-prefs:user-1');
    });

    it('should return the parsed preferences blob on GET when state has valid data', async () => {
        const stored = {
            savedViews: [
                {
                    id: 'v1',
                    name: 'View 1',
                    filters: {},
                    sort: {},
                    viewMode: 'card',
                    isDefault: false,
                },
            ],
        };
        mockIms.validateToken.resolves({ valid: true, token: { user_id: 'user-1' } });
        mockState.get.resolves({ value: JSON.stringify(stored) });

        const result = await preferencesAction.main(baseParams());

        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.equal(stored);
        expect(mockState.get).to.have.been.calledOnceWith('mas-prefs:user-1');
    });

    it('should persist savedViews on PUT and return 200 with the count', async () => {
        const savedViews = [
            {
                id: 'v1',
                name: 'View 1',
                filters: {},
                sort: {},
                viewMode: 'card',
                isDefault: true,
            },
        ];
        mockIms.validateToken.resolves({ valid: true, token: { user_id: 'user-1' } });

        const result = await preferencesAction.main(
            baseParams({ __ow_method: 'PUT', savedViews }),
        );

        expect(result.statusCode).to.equal(200);
        expect(result.body.count).to.equal(1);
        expect(mockState.put).to.have.been.calledOnceWith(
            'mas-prefs:user-1',
            JSON.stringify({ savedViews }),
            { ttl: 30 * 24 * 60 * 60 },
        );
    });

    it('should reject PUT when more than one saved view has isDefault: true', async () => {
        const savedViews = [
            {
                id: 'v1',
                name: 'View 1',
                filters: {},
                sort: {},
                viewMode: 'card',
                isDefault: true,
            },
            {
                id: 'v2',
                name: 'View 2',
                filters: {},
                sort: {},
                viewMode: 'list',
                isDefault: true,
            },
        ];
        mockIms.validateToken.resolves({ valid: true, token: { user_id: 'user-1' } });

        const result = await preferencesAction.main(
            baseParams({ __ow_method: 'PUT', savedViews }),
        );

        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('only one saved view may have isDefault: true');
        expect(mockState.put).to.not.have.been.called;
    });

    it('should return 401 when IMS reports the token is invalid', async () => {
        mockIms.validateToken.resolves({ valid: false });

        const result = await preferencesAction.main(baseParams());

        expect(result.error.statusCode).to.equal(401);
        expect(result.error.body.error).to.include('Invalid IMS token');
    });

    it('should return 400 when the Authorization header is missing entirely', async () => {
        const result = await preferencesAction.main({ __ow_headers: {}, __ow_method: 'GET' });

        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('authorization');
    });

    it('should return 405 when the HTTP method is not GET or PUT', async () => {
        mockIms.validateToken.resolves({ valid: true, token: { user_id: 'user-1' } });

        const result = await preferencesAction.main(
            baseParams({ __ow_method: 'DELETE' }),
        );

        expect(result.error.statusCode).to.equal(405);
        expect(result.error.body.error).to.include('DELETE');
    });
});
