"use strict";
// Execution of WASM scripts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MgmtExec = exports.Script = exports.Exec = void 0;
const stream_1 = require("stream");
class Exec extends stream_1.EventEmitter {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activeScripts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
exports.Exec = Exec;
class Script {
    constructor(binary, hooks) {
        Object.defineProperty(this, "binary", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: binary
        });
        Object.defineProperty(this, "hooks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hooks
        });
    }
}
exports.Script = Script;
exports.MgmtExec = new Exec(); // Executer for management chain, which is global
//# sourceMappingURL=index.js.map