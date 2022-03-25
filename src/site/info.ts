// Metadata about a site
import {Database} from "./database"

export interface Info {
    name: string;
    databases: Database[],
}