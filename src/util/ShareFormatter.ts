import { fromBase64String, toBase64String } from './basic'

const SIGN_ALGO = 'ECDSA'
const SIGN_CURVE = 'P-256'

const SHRZ_PREFIX = 'shrz'

const SIGN_PUBKEY_SHARE_FORMAT = 'raw'
const SIGN_HASH = 'SHA-256'
export class ShareFormatter {
  share_data: Uint8Array
  share_id: number | undefined
  signature_info: { pubkey: CryptoKey; signature: ArrayBuffer } | undefined

  constructor(share_id: number | undefined, share_data: Uint8Array) {
    this.share_id = share_id
    this.share_data = share_data
  }

  private get_signable_data(): Uint8Array {
    if (this.share_id === undefined || this.share_id === null)
      throw new Error('Cannot sign data without shareid')
    return Uint8Array.from([this.share_id, ...this.share_data])
  }

  async sign(keypair: CryptoKeyPair) {
    if (this.share_id === undefined) throw new Error('Cannot sign share without id')
    const signature = await crypto.subtle.sign(
      { name: SIGN_ALGO, hash: { name: SIGN_HASH } },
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
      { name: SIGN_ALGO, hash: { name: SIGN_HASH } },
      this.signature_info.pubkey,
      this.signature_info.signature,
      this.get_signable_data()
    )
  }

  static async fromString(input: string): Promise<ShareFormatter> {
    const sharez_regex =
      /^shrz:(?<share_id>[0-9]+):(?<data>[a-zA-Z0-9-_]+)(?::(?<signature>[a-zA-Z0-9-_]+)(?::(?<pubkey>[a-zA-Z0-9-_]+))?)?$/

    const share_match = sharez_regex.exec(input)
    if (share_match === null) throw new Error('Input not a share')
    if (share_match.groups === undefined) throw new Error('Could not match share parts')
    const { share_id, data, signature, pubkey } = share_match.groups

    const imported_data = fromBase64String(data)
    const imported_share_id = parseInt(share_id)
    const imported_signature = signature ? fromBase64String(signature) : undefined
    const imported_pubkey = pubkey ? fromBase64String(pubkey) : undefined

    const built_pubkey = imported_pubkey
      ? await crypto.subtle.importKey(
          SIGN_PUBKEY_SHARE_FORMAT,
          imported_pubkey,
          { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
          true,
          ['verify']
        )
      : undefined

    const signature_info =
      built_pubkey && imported_signature
        ? { pubkey: built_pubkey, signature: imported_signature }
        : undefined
    const result = new ShareFormatter(imported_share_id, imported_data)
    result.signature_info = signature_info
    return result
  }

  async toString(): Promise<string> {
    if (this.share_id === undefined) {
      return toBase64String(this.share_data)
    }
    const str_share_id = this.share_id.toString()
    const str_share_data = toBase64String(this.share_data)
    const str_signature = this.signature_info
      ? toBase64String(new Uint8Array(this.signature_info.signature))
      : undefined

    const str_pubkey = this.signature_info
      ? toBase64String(
          new Uint8Array(
            await crypto.subtle.exportKey(SIGN_PUBKEY_SHARE_FORMAT, this.signature_info.pubkey)
          )
        )
      : undefined

    let result = `${SHRZ_PREFIX}:${str_share_id}:${str_share_data}`
    if (str_signature !== undefined) {
      result += ':' + str_signature
      if (str_pubkey !== undefined) {
        result += ':' + str_pubkey
      }
    }
    return result
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
