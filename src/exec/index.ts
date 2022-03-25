// Execution of WASM scripts

import {EventEmitter} from "stream";

export class Exec extends EventEmitter {
    public pool: Script[];
    public activeScripts: number;
}

export class Script {
    constructor(public binary: Buffer, public hooks: {[key: string]: string}) {
    }
}

export const MgmtExec: Exec = new Exec() // Executer for management chain, which is global