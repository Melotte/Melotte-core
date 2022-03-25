"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFS = void 0;
// Managing IPFS instances
const ipfs_http_client_1 = require("ipfs-http-client");
// IPFS should be downloaded or provided in melotte bianries. 
// Melotte should provide a config file for user
class IPFS {
    constructor() {
        Object.defineProperty(this, "ipfs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "p2pCapable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    start() {
        // TODO: check and run IPFS binary
        this.ipfs = (0, ipfs_http_client_1.create)();
    }
    async checkConfig() {
        // Config could be checked via http for better robustness
        const configAll = await this.ipfs.config.getAll();
        console.log(configAll);
    }
    async setConfig() {
        // Some config has to be set at runtime
        //{
        //   host: 'localhost',
        //   port: '5001',
        //   protocol: 'http:',
        //   pathname: '/api/v0',
        //   'api-path': '/api/v0'
        // }
        const endp = await this.ipfs.getEndpointConfig(), commands = await this.ipfs.commands();
        // @ts-expect-error
        this.p2pCapable = commands?.Subcommands.some(x => x?.Name === "p2p");
    }
    enableP2P() {
        // Configure custom P2P protocol
        // Maybe via command line ?
    }
}
exports.IPFS = IPFS;
//# sourceMappingURL=index.js.map