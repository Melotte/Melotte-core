
import {mkdirSync} from "fs"
import LRU from 'lru-cache'
import LevelDB from "level"
import {ec as EC} from 'elliptic'
import secp256k1 from 'secp256k1'
import {verify} from './verifiers'
import {keys} from 'libp2p-crypto'

// Reference https://github.com/orbitdb/orbit-db-keystore/blob/main/src/keystore.js

const unmarshal = keys.supportedKeys.secp256k1.unmarshalSecp256k1PrivateKey
const ec = new EC('secp256k1')
export function createStore(path = './keystore'): LevelDB.LevelDB {
    mkdirSync(path, {recursive: true})
    return LevelDB(path)
}

// Multikey ? 
// Shouldn't think about it. If keychain comes out, just refactor the verification process and remove this module.

export interface Keypair {
    publicKey: Buffer,
    privateKey?: Buffer,
    data?: Buffer
}

export class KeypairSerialize {same
    static toString(k: Keypair): string {
        if(typeof k === "string")
            return k
        if(typeof k !== "object")
            throw "Unexpected "
        return JSON.stringify({
            publicKey: k.publicKey.toString('hex'),
            privateKey: k.privateKey.toString('hex')
        })
    }
    static fromString(k: string | unknown): Keypair {
        if(typeof k === "string") {
            const o = JSON.parse(k)
            return {
                privateKey: Buffer.from(o.privateKey, 'hex'),
                publicKey: Buffer.from(o.publicKey, 'hex')
            }
        } else {
            throw "Unexpected"
        }
    }
}

export interface Parameters {
    open?(): Promise<void>,
    store?: string | object,
    cache?: LRU<string, Keypair>,
    close?(): Promise<void>,
    readonly status?: "new" | "opening" | "open" | "closing" | "closed",
    _db?: any;
    put?(),
    get?()
}

export class Keystore {
    private static verifiedCache: LRU<Buffer, Keypair> = new LRU({
        max: 1000
    })
    public _store: LevelDB.LevelDB<string, string> | Parameters
    public _cache: LRU<string, Keypair>
    constructor(input: string | Parameters = {}) {
        if(typeof input === 'string') {
            this._store = createStore(input)
        } else if(typeof input.open === 'function') {
            this._store = input
        } else if(typeof input.store === 'string') {
            this._store = createStore(input.store)
        } else {
            this._store = input.store || createStore()
        }
        this._cache = (input as {cache?: LRU<string, Keypair>}).cache || new LRU({max: 100})
    }
    async open() {
        if(this._store) {
            await this._store.open()
            return
        }
        throw Error('Keystore: No store found to open')
    }
    async close() {
        if(!this._store) return
        await this._store.close()
    }
    async hasKey(id: string): Promise<boolean> {
        if(!id) {
            throw new Error('id needed to check a key')
        }
        if(this._store.status && this._store.status !== 'open') {
            return null
        }
        let hasKey = false
        try {
            const storedKey = this._cache.get(id) || KeypairSerialize.fromString(await this._store.get(id))
            hasKey = storedKey !== undefined && storedKey !== null
        } catch(e) {
            // Catches 'Error: ENOENT: no such file or directory, open <path>'
            console.error('Error: ENOENT: no such file or directory')
        }

        return hasKey
    }
    async createKey(id: string, {entropy}: {entropy?: Buffer | string} = {}): Promise<keys.supportedKeys.secp256k1.Secp256k1PrivateKey> {
        if(!id) {
            throw new Error('id needed to create a key')
        }
        if(this._store.status && this._store.status !== 'open') {
            return null
        }

        // Throws error if seed is lower than 192 bit length.
        const keys = await unmarshal(ec.genKeyPair({entropy}).getPrivate().toArrayLike(Buffer))
        const pubKey = keys.public.marshal()
        const decompressedKey = secp256k1.publicKeyConvert(Buffer.from(pubKey), false)
        const key = {
            publicKey: Buffer.from(decompressedKey),
            privateKey: Buffer.from(keys.marshal())
        }

        try {
            await this._store.put(id, KeypairSerialize.toString(key))
        } catch(e) {
            console.log(e)
        }
        this._cache.set(id, key)

        return keys
    }
    async getKey(id: string): Promise<keys.supportedKeys.secp256k1.Secp256k1PrivateKey | null> {
        if(!id) {
            throw new Error('id needed to get a key')
        }
        if(!this._store) {
            await this.open()
        }
        if(this._store.status && this._store.status !== 'open') {
            return null
        }
        const cachedKey = this._cache.get(id)
        let storedKey
        try {
            storedKey = cachedKey || KeypairSerialize.fromString(await this._store.get(id))
        } catch(e) {
            // ignore ENOENT error
        }

        if(!storedKey) {
            return null
        }

        const deserializedKey = cachedKey || storedKey
        if(!deserializedKey) {
            return null
        }

        if(!cachedKey) {
            this._cache.set(id, deserializedKey)
        }
        console.log(deserializedKey)
        return unmarshal(Buffer.from(deserializedKey.privateKey))
    }

    async sign(key: keys.supportedKeys.secp256k1.Secp256k1PrivateKey, data: Buffer) {
        if(!key) {
            throw new Error('No signing key given')
        }

        if(!data) {
            throw new Error('Given input data was undefined')
        }

        if(!Buffer.isBuffer(data)) {
            data = Buffer.from(data)
        }

        return Buffer.from(await key.sign(data))
    }
    getPublic(keys, {decompress = true, format = "buffer"} = {}) {
        const formats = ['hex', 'buffer']
        if(formats.indexOf(format) === -1) {
            throw new Error('Supported formats are `hex` and `buffer`')
        }
        let pubKey = keys.public.marshal()
        if(decompress) {
            pubKey = secp256k1.publicKeyConvert(Buffer.from(pubKey), false)
        }
        pubKey = Buffer.from(pubKey)
        return format === 'buffer' ? pubKey : pubKey.toString('hex')
    }

    async verify(signature: Buffer, publicKey: Buffer, data: Buffer) {
        return Keystore.verify(signature, publicKey, data)
    }
    static async verify(signature: Buffer, publicKey: Buffer, data: Buffer) {
        const cached = Keystore.verifiedCache.get(signature)
        let res = false
        if(!cached) {
            const verified = await verify(signature, publicKey, data)
            res = verified
            if(verified) {
                Keystore.verifiedCache.set(signature, {publicKey, data})
            }
        } else {
            const compare = (cached, data) => {
                return Buffer.isBuffer(data) ? Buffer.compare(cached, data) === 0 : cached === data
            }
            res = cached.publicKey === publicKey && compare(cached.data, data)
        }
        return res
    }
}