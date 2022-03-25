"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sqlite = exports.Ejdb = exports.DatabaseAdapter = exports.initDatabases = exports.Database = void 0;
const ipld_log_1 = require("../ipld-log");
// Database or indices
class Database {
    constructor() {
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "instance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "parameter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Static identifier of a database. A p2p database always has a pubsub topic
    }
}
exports.Database = Database;
function initDatabases(ipfs) {
    // Connect to databases if required
}
exports.initDatabases = initDatabases;
class DatabaseAdapter {
    constructor(ipfs) {
        Object.defineProperty(this, "ipfs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ipfs
        });
    }
}
exports.DatabaseAdapter = DatabaseAdapter;
class Ejdb extends DatabaseAdapter {
    import(log) {
        // Traverse the logs and generate a database
        return true;
    }
    update(log) {
        return true;
    }
    export() {
        return new ipld_log_1.IPLDLog(this.ipfs);
    }
    rebuild(log) {
        return true;
    }
}
exports.Ejdb = Ejdb;
// Operations on IPLDLog is imported into sqlite
// Similar to ZeroNet
class Sqlite {
}
exports.Sqlite = Sqlite;
//# sourceMappingURL=database.js.map