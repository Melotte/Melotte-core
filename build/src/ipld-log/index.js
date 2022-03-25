"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPLDAuthor = exports.LogBlock = exports.IPLDLog = void 0;
const dag_cbor_1 = require("@ipld/dag-cbor");
// Basic IPLDLog
class IPLDLog {
    constructor(ipfs, author, cursor) {
        Object.defineProperty(this, "ipfs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ipfs
        });
        Object.defineProperty(this, "author", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: author
        });
        Object.defineProperty(this, "cursor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cursor
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "1"
        });
        Object.defineProperty(this, "heads", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "knownIds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set_()
        });
        Object.defineProperty(this, "knownCIDs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set_()
        });
        Object.defineProperty(this, "knownBlocks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set_()
        });
    }
    async fetchChain(entry, maxDepth) {
        // Fetch a part of the chain. Use graph sync in the future
        // Depth as in tree
        for (const next of entry.next) {
            const { value } = await this.ipfs.dag.get(next);
            const block = LogBlock.from(value);
            block.CID = next;
            this.knownCIDs.add(next);
            block.reverseNext.add(entry.CID); // Entry points to the next block
            this.knownBlocks.add(block);
            if (maxDepth > 1)
                await this.fetchChain(block, maxDepth - 1);
        }
    }
    // One pubsub per chain, so the new heads should be on this chain
    onHeadsArrival(newheads) {
        // Traverse the chain
    }
    async draftBlock(payload) {
        const n = new LogBlock(payload, this.author, this.heads);
        await n.init();
        n.CID = await this.ipfs.dag.put(n.rawObject);
        return n;
    }
    advanceState() {
        // Advance current log state
    }
    proposeVerify() {
        // Start verifying new blocks based on current state
        // Mgmt and usual log verify differently
        // Cursor block and everything before it are treated as valid
        for (const c of this.cursor.reverseNext) { // Might be branches ahead
            const block = this.knownBlocks.get(c);
            if (!block.isVerified) {
                continue;
            }
            if (block.timestamp > Date.now()) {
                continue; // Rejected
            }
            else {
                // The block claims to be created in the past.
            }
        }
    }
    validateTimestamp(time) {
    }
}
exports.IPLDLog = IPLDLog;
// Set based on toString
class Set_ {
    constructor() {
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    has(v) {
        return this.map.has(v.toString());
    }
    add(v) {
        this.map.set(v.toString(), v);
    }
    get(k) {
        return this.map.get(k.toString());
    }
    [Symbol.iterator]() {
        return this.map.values();
    }
}
class LogBlock {
    constructor(payload, id, next = new Set_()) {
        Object.defineProperty(this, "payload", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: payload
        });
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "next", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: next
        });
        Object.defineProperty(this, "timestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "verified_", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "verifiedComputed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reverseNext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "CID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "signature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.timestamp = Date.now();
    }
    async init() {
        this.signature = await this.id.sign(this.payloadToBuffer());
    }
    static from(data) {
        return data;
    }
    async isVerified() {
        if (this.verifiedComputed)
            return this.verified_;
        else {
            this.verifiedComputed = true;
            return this.verified_ = await this.id.verify(this.signature, this.payloadToBuffer());
        }
    }
    payloadToBuffer() {
        return Buffer.from((0, dag_cbor_1.encode)(this.payload));
    }
    get rawObject() {
        return {
            timestamp: this.timestamp,
            signature: this.signature,
            payload: this.payload,
            id: this.id.IdSerialized,
            next: this.next
        };
    }
    toString() {
        return this.CID.toString();
    }
}
exports.LogBlock = LogBlock;
class IPLDAuthor {
    constructor() {
        Object.defineProperty(this, "IdString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Id often means publickey
        Object.defineProperty(this, "IdSerialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    toString() {
        if (this.IdString)
            return this.IdString;
        else
            return this.IdString = this.IdSerialized.toString("base64");
    }
}
exports.IPLDAuthor = IPLDAuthor;
//# sourceMappingURL=index.js.map