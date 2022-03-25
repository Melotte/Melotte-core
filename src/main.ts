import {initDatabases} from "./site/database"
import {IPFS} from "./ipfs"

async function start() {
    const IpfsAdapter = new IPFS()
    IpfsAdapter.start()
    initDatabases(IpfsAdapter.ipfs)
}

start()