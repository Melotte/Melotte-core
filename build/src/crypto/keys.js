"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keystore = exports.KeypairSerialize = exports.createStore = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
const level_1 = tslib_1.__importDefault(require("level"));
const elliptic_1 = require("elliptic");
const secp256k1_1 = tslib_1.__importDefault(require("secp256k1"));
const verifiers_1 = require("./verifiers");
const libp2p_crypto_1 = require("libp2p-crypto");
// Reference https://github.com/orbitdb/orbit-db-keystore/blob/main/src/keystore.js
const unmarshal = libp2p_crypto_1.keys.supportedKeys.secp256k1.unmarshalSecp256k1PrivateKey;
const ec = new elliptic_1.ec('secp256k1');
function createStore(path = './keystore') {
    (0, fs_1.mkdirSync)(path, { recursive: true });
    return (0, level_1.default)(path);
}
exports.createStore = createStore;
class KeypairSerialize {
    constructor() {
        Object.defineProperty(this, "same", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    static toString(k) {
        if (typeof k === "string")
            return k;
        if (typeof k !== "object")
            throw "Unexpected ";
        return JSON.stringify({
            publicKey: k.publicKey.toString('hex'),
            privateKey: k.privateKey.toString('hex')
        });
    }
    static fromString(k) {
        if (typeof k === "string") {
            const o = JSON.parse(k);
            return {
                privateKey: Buffer.from(o.privateKey, 'hex'),
                publicKey: Buffer.from(o.publicKey, 'hex')
            };
        }
        else {
            throw "Unexpected";
        }
    }
}
exports.KeypairSerialize = KeypairSerialize;
class Keystore {
    constructor(input = {}) {
        Object.defineProperty(this, "_store", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (typeof input === 'string') {
            this._store = createStore(input);
        }
        else if (typeof input.open === 'function') {
            this._store = input;
        }
        else if (typeof input.store === 'string') {
            this._store = createStore(input.store);
        }
        else {
            this._store = input.store || createStore();
        }
        this._cache = input.cache || new lru_cache_1.default({ max: 100 });
    }
    async open() {
        if (this._store) {
            await this._store.open();
            return;
        }
        throw Error('Keystore: No store found to open');
    }
    async close() {
        if (!this._store)
            return;
        await this._store.close();
    }
    async hasKey(id) {
        if (!id) {
            throw new Error('id needed to check a key');
        }
        if (this._store.status && this._store.status !== 'open') {
            return null;
        }
        let hasKey = false;
        try {
            const storedKey = this._cache.get(id) || KeypairSerialize.fromString(await this._store.get(id));
            hasKey = storedKey !== undefined && storedKey !== null;
        }
        catch (e) {
            // Catches 'Error: ENOENT: no such file or directory, open <path>'
            console.error('Error: ENOENT: no such file or directory');
        }
        return hasKey;
    }
    async createKey(id, { entropy } = {}) {
        if (!id) {
            throw new Error('id needed to create a key');
        }
        if (this._store.status && this._store.status !== 'open') {
            return null;
        }
        // Throws error if seed is lower than 192 bit length.
        const keys = await unmarshal(ec.genKeyPair({ entropy }).getPrivate().toArrayLike(Buffer));
        const pubKey = keys.public.marshal();
        const decompressedKey = secp256k1_1.default.publicKeyConvert(Buffer.from(pubKey), false);
        const key = {
            publicKey: Buffer.from(decompressedKey),
            privateKey: Buffer.from(keys.marshal())
        };
        try {
            await this._store.put(id, KeypairSerialize.toString(key));
        }
        catch (e) {
            console.log(e);
        }
        this._cache.set(id, key);
        return keys;
    }
    async getKey(id) {
        if (!id) {
            throw new Error('id needed to get a key');
        }
        if (!this._store) {
            await this.open();
        }
        if (this._store.status && this._store.status !== 'open') {
            return null;
        }
        const cachedKey = this._cache.get(id);
        let storedKey;
        try {
            storedKey = cachedKey || KeypairSerialize.fromString(await this._store.get(id));
        }
        catch (e) {
            // ignore ENOENT error
        }
        if (!storedKey) {
            return null;
        }
        const deserializedKey = cachedKey || storedKey;
        if (!deserializedKey) {
            return null;
        }
        if (!cachedKey) {
            this._cache.set(id, deserializedKey);
        }
        console.log(deserializedKey);
        return unmarshal(Buffer.from(deserializedKey.privateKey));
    }
    async sign(key, data) {
        if (!key) {
            throw new Error('No signing key given');
        }
        if (!data) {
            throw new Error('Given input data was undefined');
        }
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(data);
        }
        return Buffer.from(await key.sign(data));
    }
    getPublic(keys, { decompress = true, format = "buffer" } = {}) {
        const formats = ['hex', 'buffer'];
        if (formats.indexOf(format) === -1) {
            throw new Error('Supported formats are `hex` and `buffer`');
        }
        let pubKey = keys.public.marshal();
        if (decompress) {
            pubKey = secp256k1_1.default.publicKeyConvert(Buffer.from(pubKey), false);
        }
        pubKey = Buffer.from(pubKey);
        return format === 'buffer' ? pubKey : pubKey.toString('hex');
    }
    async verify(signature, publicKey, data) {
        return Keystore.verify(signature, publicKey, data);
    }
    static async verify(signature, publicKey, data) {
        const cached = Keystore.verifiedCache.get(signature);
        let res = false;
        if (!cached) {
            const verified = await (0, verifiers_1.verify)(signature, publicKey, data);
            res = verified;
            if (verified) {
                Keystore.verifiedCache.set(signature, { publicKey, data });
            }
        }
        else {
            const compare = (cached, data) => {
                return Buffer.isBuffer(data) ? Buffer.compare(cached, data) === 0 : cached === data;
            };
            res = cached.publicKey === publicKey && compare(cached.data, data);
        }
        return res;
    }
}
exports.Keystore = Keystore;
Object.defineProperty(Keystore, "verifiedCache", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new lru_cache_1.default({
        max: 1000
    })
});
//# sourceMappingURL=keys.js.map