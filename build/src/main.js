"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./site/database");
const ipfs_1 = require("./ipfs");
async function start() {
    const IpfsAdapter = new ipfs_1.IPFS();
    IpfsAdapter.start();
    (0, database_1.initDatabases)(IpfsAdapter.ipfs);
}
start();
//# sourceMappingURL=main.js.map