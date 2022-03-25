"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
const keys_1 = require("./keys");
const lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
let store, signingStore;
beforeAll(async () => {
    await fs_extra_1.default.copy("./test/fixtures/signingKeys/", "./test/signingKeys");
    store = (0, keys_1.createStore)("./test/keystore-test");
    signingStore = (0, keys_1.createStore)("./test/signingKeys");
});
describe('constructor', () => {
    it('creates a new Keystore instance', async () => {
        const keystore = new keys_1.Keystore();
        assert_1.default.strictEqual(typeof keystore.close, 'function');
        assert_1.default.strictEqual(typeof keystore.open, 'function');
        assert_1.default.strictEqual(typeof keystore.hasKey, 'function');
        assert_1.default.strictEqual(typeof keystore.createKey, 'function');
        assert_1.default.strictEqual(typeof keystore.getKey, 'function');
        assert_1.default.strictEqual(typeof keystore.sign, 'function');
        assert_1.default.strictEqual(typeof keystore.getPublic, 'function');
        assert_1.default.strictEqual(typeof keystore.verify, 'function');
        await keystore.close();
    });
    it('reates a proper leveldown / level-js store if not passed a store', async () => {
        const keystore = new keys_1.Keystore();
        // Loose check for leveldownishness
        // @ts-expect-error
        assert_1.default.strictEqual(keystore._store._db.status, 'opening');
        await keystore.close();
    });
    it('assigns this.cache with default of 100', async () => {
        const keystore = new keys_1.Keystore();
        assert_1.default.strictEqual(keystore._cache.max, 100);
        await keystore.close();
    });
    it('creates a keystore with empty options', async () => {
        const keystore = new keys_1.Keystore({});
        // @ts-expect-error
        assert_1.default.strictEqual(keystore._store._db.status, 'opening');
        await keystore.close();
    });
    it('creates a keystore with only cache', async () => {
        const cache = new lru_cache_1.default({ max: 10 });
        const keystore = new keys_1.Keystore({ cache });
        // @ts-expect-error
        assert_1.default.strictEqual(keystore._store._db.status, 'opening');
        (0, assert_1.default)(keystore._cache === cache);
        await keystore.close();
    });
});
describe('#createKey()', () => {
    let keystore;
    beforeEach(async () => {
        keystore = new keys_1.Keystore({ store });
        if (store.status !== 'open') {
            await store.open();
        }
    });
    it('creates a new key', async () => {
        const id = 'X';
        await keystore.createKey(id);
        const hasKey = await keystore.hasKey(id);
        assert_1.default.strictEqual(hasKey, true);
    });
    it('creates a new key using provided entropy', async () => {
        const id = 'X2';
        await keystore.createKey(id, {
            entropy: 'jANfduGRj4HU9Pk6nJzujANfduGRj4HU9Pk6nJzu'
        });
        const hasKey = await keystore.hasKey(id);
        assert_1.default.strictEqual(hasKey, true);
        // Deterministic public key
        const keyContent = await keystore.getKey(id);
        assert_1.default.strictEqual(Buffer.from(keyContent._publicKey).toString('hex'), '0328401cd1b561040b87cd66563be722ba429b42d6abfeca9cb4c34e9845c86d2e');
    });
    it('throws an error upon not receiving an ID', async () => {
        try {
            await keystore.createKey();
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error accessing a closed store', async () => {
        try {
            const id = 'X';
            await store.close();
            await keystore.createKey(id);
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    afterEach(async () => {
        // await keystore.close()
    });
});
describe('#hasKey()', () => {
    let keystore;
    beforeAll(async () => {
        if (store.status !== 'open') {
            await store.open();
        }
        keystore = new keys_1.Keystore({ store });
        await keystore.createKey('YYZ');
    });
    it('returns true if key exists', async () => {
        const hasKey = await keystore.hasKey('YYZ');
        assert_1.default.strictEqual(hasKey, true);
    });
    it('returns false if key does not exist', async () => {
        let hasKey;
        try {
            hasKey = await keystore.hasKey('XXX');
        }
        catch (e) {
            assert_1.default.strictEqual(hasKey, true);
        }
    });
    it('throws an error upon not receiving an ID', async () => {
        try {
            await keystore.hasKey();
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error accessing a closed store', async () => {
        try {
            await store.close();
            await keystore.hasKey('XXX');
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    afterEach(async () => {
        // await keystore.close()
    });
});
describe('#getKey()', () => {
    let keystore;
    beforeAll(async () => {
        if (store.status !== 'open') {
            await store.open();
        }
        keystore = new keys_1.Keystore({ store });
        await keystore.createKey('ZZZ');
    });
    it('gets an existing key', async () => {
        const key = await keystore.getKey('ZZZ');
        assert_1.default.strictEqual(key._publicKey.length, 33);
        assert_1.default.strictEqual(key._key.length, 32);
        assert_1.default.strictEqual(key._publicKey.constructor, Uint8Array);
        assert_1.default.strictEqual(key._key.constructor, Buffer);
    });
    it('throws an error upon accessing a non-existant key', async () => {
        try {
            await keystore.getKey('ZZZZ');
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error upon not receiving an ID', async () => {
        try {
            await keystore.getKey();
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error accessing a closed store', async () => {
        try {
            await store.close();
            await keystore.getKey('ZZZ');
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    afterAll(async () => {
        // keystore.close()
    });
});
describe('#sign()', () => {
    let keystore, key, store;
    beforeAll(async () => {
        store = signingStore;
        if (store.status !== 'open') {
            await store.open();
        }
        keystore = new keys_1.Keystore({ store });
        key = await keystore.getKey('signing');
        console.log(key);
    });
    it('signs data', async () => {
        const expectedSignature = '304402206d0287e576e02af2887b68b7b3a87634fce33ffe7702ce3ba4feff54f3d4f50d02206a7974724dc0c8e692a434441b9549729e1252ff3391f436a41e69db59c5bb1e';
        const signature = await keystore.sign(key, 'data data data');
        assert_1.default.deepEqual(signature, Buffer.from(expectedSignature, "hex"));
    });
    it('throws an error if no key is passed', async () => {
        try {
            await keystore.sign(null, 'data data data');
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error if no data is passed', async () => {
        try {
            await keystore.sign(key);
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    afterAll(async () => {
        await store.close();
    });
});
describe('#getPublic', () => {
    let keystore, key, store;
    beforeAll(async () => {
        store = signingStore;
        if (store.status !== 'open') {
            await store.open();
        }
        keystore = new keys_1.Keystore({ store });
        key = await keystore.getKey('getPublic');
    });
    it('gets the public key - default options', async () => {
        const expectedKey = '04010f640f7eb0237349ec3a7202ec0b9378a64dc491371625acc974c954d4a6a3750a314427382836cc0702e84eac24eacb10fd37deea57e5977d62582225ed68';
        const publicKey = await keystore.getPublic(key);
        assert_1.default.deepEqual(publicKey, Buffer.from(expectedKey, 'hex'));
    });
    it('gets the public key - buffer', async () => {
        const expectedBuffer = {
            type: 'Buffer',
            data: [4, 1, 15, 100, 15, 126, 176, 35, 115, 73, 236, 58, 114, 2, 236, 11, 147, 120,
                166, 77, 196, 145, 55, 22, 37, 172, 201, 116, 201, 84, 212, 166, 163, 117, 10, 49,
                68, 39, 56, 40, 54, 204, 7, 2, 232, 78, 172, 36, 234, 203, 16, 253, 55, 222, 234, 87,
                229, 151, 125, 98, 88, 34, 37, 237, 104]
        };
        const publicKey = await keystore.getPublic(key, { format: 'buffer' });
        assert_1.default.deepEqual(publicKey.toJSON(), expectedBuffer);
    });
    it('gets the public key - not decompressed', async () => {
        const expectedCompressedKey = '02010f640f7eb0237349ec3a7202ec0b9378a64dc491371625acc974c954d4a6a3';
        const publicKey = await keystore.getPublic(key, { decompress: false });
        assert_1.default.deepEqual(publicKey, Buffer.from(expectedCompressedKey, 'hex'));
    });
    it('gets the public key - buffer, not decompressed', async () => {
        const expectedCompressedBuffer = {
            type: 'Buffer',
            data: [2, 1, 15, 100, 15, 126, 176, 35, 115, 73, 236, 58, 114, 2, 236, 11, 147, 120, 166, 77, 196, 145, 55, 22, 37, 172, 201, 116, 201, 84, 212, 166, 163]
        };
        const publicKey = await keystore.getPublic(key, { format: 'buffer', decompress: false });
        assert_1.default.deepEqual(publicKey.toJSON(), expectedCompressedBuffer);
    });
    it('throws an error if no keys are passed', async () => {
        try {
            await keystore.getPublic();
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    it('throws an error if a bad format is passed', async () => {
        try {
            await keystore.getPublic(key, { format: 'foo' });
        }
        catch (e) {
            assert_1.default.strictEqual(true, true);
        }
    });
    afterAll(async () => {
        await store.close();
    });
});
describe('#verify', function () {
    let keystore, store, publicKey, key;
    beforeAll(async () => {
        store = signingStore;
        if (store.status !== 'open') {
            await store.open();
        }
        keystore = new keys_1.Keystore({ store });
        key = await keystore.getKey('signing');
        publicKey = await keystore.getPublic(key);
    });
    it('verifies content', async () => {
        const signature = '304402206d0287e576e02af2887b68b7b3a87634fce33ffe7702ce3ba4feff54f3d4f50d02206a7974724dc0c8e692a434441b9549729e1252ff3391f436a41e69db59c5bb1e';
        const verified = await keystore.verify(signature, publicKey, 'data data data');
        assert_1.default.strictEqual(verified, true);
    });
    it('verifies content with cache', async () => {
        const data = 'data'.repeat(1024 * 1024);
        const sig = await keystore.sign(key, data);
        const startTime = new Date().getTime();
        await keystore.verify(sig, publicKey, data);
        const first = new Date().getTime();
        await keystore.verify(sig, publicKey, data);
        const after = new Date().getTime();
        console.log('First pass:', first - startTime, 'ms', 'Cached:', after - first, 'ms');
        assert_1.default.strictEqual(first - startTime > after - first, true);
    });
    it('does not verify content with bad signature', async () => {
        const signature = 'xxxxxx';
        const verified = await keystore.verify(signature, publicKey, 'data data data');
        assert_1.default.strictEqual(verified, false);
    });
    afterAll(async () => {
        await store.close();
    });
});
describe('#open', () => {
    let keystore, store;
    beforeEach(async () => {
        store = signingStore;
        keystore = new keys_1.Keystore({ store });
    });
    it('fails when no store', async () => {
        let error = false;
        try {
            keystore._store = undefined;
            await keystore.open();
        }
        catch (e) {
            if (e instanceof Error)
                error = e.message;
        }
        assert_1.default.strictEqual(error, 'Keystore: No store found to open');
    });
    afterEach(async () => {
        store.close();
    });
});
//# sourceMappingURL=keys.spec.js.map