import {IPFS} from "ipfs-core-types/src/";
import {Info} from "./info"
import {IPLDLog} from "../ipld-log"
import {EJDB2} from "ejdb2_node";

// Database or indices
export class Database {
    version: string;
    type: "Ejdb" | string;
    instance: unknown;
    parameter: string | Buffer; // Static identifier of a database. A p2p database always has a pubsub topic
}

export function initDatabases(ipfs: IPFS) {
    // Connect to databases if required
}
export abstract class DatabaseAdapter {
    constructor(protected ipfs: IPFS) { }
    abstract import(log: IPLDLog): boolean; // Build indices for a site the first time
    abstract update(log: IPLDLog): boolean; // Detected changes on IPLD log
    abstract export(): IPLDLog;
    abstract rebuild(log: IPLDLog): boolean; // In case something wrong happened
}
export class Ejdb extends DatabaseAdapter {
    import(log: IPLDLog): boolean {
        // Traverse the logs and generate a database
        return true
    }
    update(log: IPLDLog): boolean {
        return true
    }
    export(): IPLDLog {
        return new IPLDLog(this.ipfs)
    }
    rebuild(log: IPLDLog): boolean {
        return true
    }
}

// Operations on IPLDLog is imported into sqlite
// Similar to ZeroNet
export class Sqlite {

}

