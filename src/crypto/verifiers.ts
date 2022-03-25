import {keys} from 'libp2p-crypto'

const unmarshal = keys.supportedKeys.secp256k1.unmarshalSecp256k1PublicKey

export async function verify(signature: Buffer, publicKey: Buffer, data: Buffer) {
    if(!signature) {
        throw new Error('No signature given')
    }
    if(!publicKey) {
        throw new Error('Given publicKey was undefined')
    }
    if(!data) {
        throw new Error('Given input data was undefined')
    }

    if(!Buffer.isBuffer(data)) {
        data = Buffer.from(data)
    }

    const isValid = (key, msg, sig) => key.verify(msg, sig)

    let res = false
    try {
        const pubKey = unmarshal(publicKey)
        res = await isValid(pubKey, data, signature)
    } catch(e) {
        // Catch error: sig length wrong
    }
    return res
}