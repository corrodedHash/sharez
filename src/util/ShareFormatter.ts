import { fromBase64String, toBase64String } from './basic'

const SIGN_ALGO = 'ECDSA'
const SIGN_CURVE = 'P-256'
const SIGN_SIGNATURE_BYTE_COUNT = 64
const SIGN_PUBKEY_BYTE_COUNT = 65
const SIGN_PREFIX = '~'
const ID_PREFIX = '$'

const SIGN_PUBKEY_SHARE_FORMAT = 'raw'
export class ShareFormatter {
  share_data: Uint8Array
  share_id: number | undefined
  signature_info: { pubkey: CryptoKey; signature: ArrayBuffer } | undefined

  constructor(share_id: number | undefined, share_data: Uint8Array) {
    this.share_id = share_id
    this.share_data = share_data
  }

  private get_signable_data(): Uint8Array {
    if (this.share_id === undefined) throw new Error('Cannot sign data without shareid')
    return Uint8Array.from([this.share_id ?? 255, ...this.share_data])
  }

  async sign(keypair: CryptoKeyPair) {
    if (this.share_id === undefined) throw new Error('Cannot sign share without id')
    const signature = await crypto.subtle.sign(
      { name: SIGN_ALGO, hash: { name: 'SHA-256' } },
      keypair.privateKey,
      this.get_signable_data()
    )
    const publicKey = await crypto.subtle.exportKey('spki', keypair.publicKey)
    const pubkey = await crypto.subtle.importKey(
      'spki',
      publicKey,
      { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
      true,
      ['verify']
    )

    this.signature_info = { signature: new Uint8Array(signature), pubkey }
  }

  async verify() {
    if (this.signature_info === undefined) {
      throw new Error('Cannot verify share with no public key information')
    }
    return await crypto.subtle.verify(
      SIGN_ALGO,
      this.signature_info.pubkey,
      this.signature_info.signature,
      this.get_signable_data()
    )
  }

  static async fromString(input: string): Promise<ShareFormatter> {
    if (input.startsWith(SIGN_PREFIX)) {
      const data_str = input.slice(1)
      const data = fromBase64String(data_str)
      const share_id = data[0]
      const pubkey_raw = data.slice(1, 1 + SIGN_PUBKEY_BYTE_COUNT)
      const signature = data.slice(
        1 + SIGN_PUBKEY_BYTE_COUNT,
        1 + SIGN_PUBKEY_BYTE_COUNT + SIGN_SIGNATURE_BYTE_COUNT
      )

      const share_data = data.slice(1 + SIGN_PUBKEY_BYTE_COUNT + SIGN_SIGNATURE_BYTE_COUNT)

      const pubkey = await crypto.subtle.importKey(
        SIGN_PUBKEY_SHARE_FORMAT,
        pubkey_raw,
        { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
        true,
        ['verify']
      )
      const result = new ShareFormatter(share_id, share_data)
      result.signature_info = { pubkey, signature: new Uint8Array(signature) }
      return result
    }

    if (input.startsWith(ID_PREFIX)) {
      const data_str = input.slice(1)
      const data = fromBase64String(data_str)
      return new ShareFormatter(data[0], Uint8Array.from(data.slice(1)))
    }

    const data = fromBase64String(input)
    return new ShareFormatter(undefined, data.slice(1))
  }

  async toString(): Promise<string> {
    if (this.share_id === undefined) {
      return toBase64String(this.share_data)
    }
    if (this.signature_info === undefined) {
      const output = Uint8Array.from([this.share_id, ...this.share_data])
      return ID_PREFIX + window.btoa(String.fromCharCode(...output))
    }
    const pubkey_raw = await crypto.subtle.exportKey(
      SIGN_PUBKEY_SHARE_FORMAT,
      this.signature_info.pubkey
    )
    const output = Uint8Array.from([
      this.share_id,
      ...new Uint8Array(pubkey_raw),
      ...new Uint8Array(this.signature_info.signature),
      ...this.share_data
    ])
    return SIGN_PREFIX + toBase64String(output)
  }
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
    true,
    ['sign', 'verify']
  )
  return keyPair
}

async function getPublicKey(privateKey: CryptoKey): Promise<CryptoKey> {
  const x = await crypto.subtle.exportKey('jwk', privateKey)
  delete x.d
  x.key_ops = ['verify']
  return await crypto.subtle.importKey(
    'jwk',
    x,
    { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
    true,
    ['verify']
  )
}

export async function fromRawPrivateKey(privateKey_raw: Uint8Array): Promise<CryptoKeyPair> {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKey_raw,
    { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
    true,
    ['sign']
  )
  const publicKey = await getPublicKey(privateKey)

  return { privateKey, publicKey }
}
