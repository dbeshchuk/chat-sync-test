import * as secp from '@noble/secp256k1'
import { bytesToHex } from '@noble/hashes/utils.js'

export const generatePubKey = async (): Promise<string> => {
  const secretKey = secp.utils.randomSecretKey()
  const pubKey33b = secp.getPublicKey(secretKey)

  return '0x' + bytesToHex(pubKey33b)
}
