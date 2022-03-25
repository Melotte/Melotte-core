import {IPFS} from "ipfs-core-types/src/";
import {CID} from "ipfs-http-client";
import {encode, decode} from '@ipld/dag-cbor'

// Basic IPLDLog
export class IPLDLog {
    public readonly version = "1";
    public heads: Set_<CID>;
    public knownIds = new Set_<IPLDAuthor>();
    public knownCIDs = new Set_<CID>();
    public knownBlocks = new Set_<LogBlock>();
    constructor(protected ipfs: IPFS, public author?: IPLDAuthor, public cursor?: LogBlock) {

    }
    async fetchChain(entry: LogBlock, maxDepth: number) {
        // Fetch a part of the chain. Use graph sync in the future
        // Depth as in tree
        for(const next of entry.next) {
            const {value} = await this.ipfs.dag.get(next)
            const block: LogBlock = LogBlock.from(value)
            block.CID = next
            this.knownCIDs.add(next)
            block.reverseNext.add(entry.CID) // Entry points to the next block
            this.knownBlocks.add(block)
            if(maxDepth > 1)
                await this.fetchChain(block, maxDepth - 1)
        }
    }
    // One pubsub per chain, so the new heads should be on this chain
    onHeadsArrival(newheads: CID) {
        // Traverse the chain
    }
    async draftBlock(payload: any): Promise<LogBlock> {
        const n = new LogBlock(payload, this.author, this.heads)
        await n.init()
        n.CID = await this.ipfs.dag.put(n.rawObject)
        return n
    }
    advanceState() {
        // Advance current log state
    }
    proposeVerify() {
        // Start verifying new blocks based on current state
        // Mgmt and usual log verify differently
        // Cursor block and everything before it are treated as valid
        for(const c of this.cursor.reverseNext) { // Might be branches ahead
            const block: LogBlock = this.knownBlocks.get(c)
            if(!block.isVerified) {
                continue;
            }
            if(block.timestamp > Date.now()) {
                continue; // Rejected
            } else {
                // The block claims to be created in the past.

            }
        }
    }
    validateTimestamp(time: number) {

    }
}

// Set based on toString
class Set_<T> {
    private map = new Map<string, T>();
    has(v: T) {
        return this.map.has(v.toString())
    }
    add(v: T) {
        this.map.set(v.toString(), v)
    }
    get(k: CID | string | IPLDAuthor) {
        return this.map.get(k.toString())
    }
    [Symbol.iterator]() {
        return this.map.values()
    }
}

export class LogBlock implements BaseLogBlock {
    timestamp: number;
    private verified_: boolean;
    private verifiedComputed: boolean;
    reverseNext: Set_<CID>;
    CID: CID;
    signature: Buffer;
    constructor(public payload: any, public id: IPLDAuthor, public next = new Set_<CID>()) {
        this.timestamp = Date.now()
    }
    async init() {
        this.signature = await this.id.sign(this.payloadToBuffer())
    }
    static from(data: any) {
        return data as LogBlock
    }
    async isVerified(): Promise<boolean> {
        if(this.verifiedComputed)
            return this.verified_
        else {
            this.verifiedComputed = true
            return this.verified_ = await this.id.verify(this.signature, this.payloadToBuffer())
        }
    }
    payloadToBuffer(): Buffer {
        return Buffer.from(encode(this.payload))
    }
    get rawObject() {
        return {
            timestamp: this.timestamp,
            signature: this.signature,
            payload: this.payload,
            id: this.id.IdSerialized,
            next: this.next
        }
    }
    toString() {
        return this.CID.toString()
    }
}

export interface BaseLogBlock {
    payload: any;
    next: Set_<CID>; // Next blocks on the chain
}

export abstract class IPLDAuthor {
    abstract verify(signature: Buffer, data: Buffer): Promise<boolean>;
    sign?(data: Buffer): Promise<Buffer>;
    IdString?: string;   // Id often means publickey
    IdSerialized: Buffer;
    toString() {
        if(this.IdString)
            return this.IdString
        else
            return this.IdString = this.IdSerialized.toString("base64")
    }
}