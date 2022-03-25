// Managing IPFS instances
import {CID, create, IPFSHTTPClient} from 'ipfs-http-client'

// IPFS should be downloaded or provided in melotte bianries. 
// Melotte should provide a config file for user
export class IPFS {
    public ipfs: IPFSHTTPClient;
    public p2pCapable: boolean;
    start() {
        // TODO: check and run IPFS binary
        this.ipfs = create()
    }
    async checkConfig() {
        // Config could be checked via http for better robustness
        const configAll = await this.ipfs.config.getAll()
        console.log(configAll)
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
        const endp = await this.ipfs.getEndpointConfig(),
            commands = await this.ipfs.commands()

        // @ts-expect-error
        this.p2pCapable = commands?.Subcommands.some(x => x?.Name === "p2p")
    }
    enableP2P() {
        // Configure custom P2P protocol
        // Maybe via command line ?
    }
}
