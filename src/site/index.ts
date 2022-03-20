import {MgmtChain} from "../mgmt/"
import * as SiteDB from "./database"

export class Site {
    constructor(public mgmt: MgmtChain, public database: SiteDB.Database[]) {
        
    }
}