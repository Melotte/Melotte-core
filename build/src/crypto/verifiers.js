"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const libp2p_crypto_1 = require("libp2p-crypto");
const unmarshal = libp2p_crypto_1.keys.supportedKeys.secp256k1.unmarshalSecp256k1PublicKey;
async function verify(signature, publicKey, data) {
    if (!signature) {
        throw new Error('No signature given');
    }
    if (!publicKey) {
        throw new Error('Given publicKey was undefined');
    }
    if (!data) {
        throw new Error('Given input data was undefined');
    }
    if (!Buffer.isBuffer(data)) {
        data = Buffer.from(data);
    }
    const isValid = (key, msg, sig) => key.verify(msg, sig);
    let res = false;
    try {
        const pubKey = unmarshal(publicKey);
        res = await isValid(pubKey, data, signature);
    }
    catch (e) {
        // Catch error: sig length wrong
    }
    return res;
}
exports.verify = verify;
//# sourceMappingURL=verifiers.js.map