import {MgmtChain} from "../mgmt/"
import * as SiteDB from "./database"
import {Entry} from "./entry"
export class Site {
    public database?: SiteDB.Database[]
    constructor(public mgmt: MgmtChain) {

    }
}

export {Entry} from "./entry"