import {OrbitDB_} from "orbit-db"


export interface Database {
    version: string;
    type: enum;
    disconnect();
    open(); // Open an database for the site
}

export enum DatabaseType {
    OrbitDB,
}

export class OrbitDB extends OrbitDB_ implements Database {
    constructor() {
        super()
    }
}