const SIGN_ALGO = 'ECDSA'
const SIGN_CURVE = 'P-256'
const SIGN_SIGNATURE_BYTE_COUNT = 64
const SIGN_PUBKEY_BYTE_COUNT = 32
const SIGN_PREFIX = '~'
const ID_PREFIX = '$'
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
    const privateKey = await crypto.subtle.exportKey('pkcs8', keypair.privateKey)

    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKey,
      { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
      true,
      ['sign']
    )
    const signature = await crypto.subtle.sign(SIGN_ALGO, key, this.get_signable_data())
    const publicKey = await crypto.subtle.exportKey('spki', keypair.publicKey)
    const pubkey = await crypto.subtle.importKey(
      'spki',
      publicKey,
      { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
      true,
      ['verify']
    )

    this.signature_info = { signature, pubkey }
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
      const data = [...window.atob(data_str)].map((v) => v.charCodeAt(0))
      const share_id = data[0]
      const pubkey_raw = Uint8Array.from(data.slice(1, 1 + SIGN_PUBKEY_BYTE_COUNT))
      const pubkey = await crypto.subtle.importKey(
        'spki',
        pubkey_raw,
        { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
        true,
        ['verify']
      )
      const signature = Uint8Array.from(
        data.slice(1, 1 + SIGN_PUBKEY_BYTE_COUNT + SIGN_SIGNATURE_BYTE_COUNT)
      )
      const share_data = Uint8Array.from(
        data.slice(1 + SIGN_PUBKEY_BYTE_COUNT + SIGN_SIGNATURE_BYTE_COUNT)
      )
      const result = new ShareFormatter(share_id, share_data)
      result.signature_info = { pubkey, signature }
      return result
    }
    if (input.startsWith(ID_PREFIX)) {
      const data_str = input.slice(1)
      const data = [...window.atob(data_str)].map((v) => v.charCodeAt(0))
      return new ShareFormatter(data[0], Uint8Array.from(data.slice(1)))
    }

    const data = [...window.atob(input)].map((v) => v.charCodeAt(0))
    return new ShareFormatter(undefined, Uint8Array.from(data.slice(1)))
  }

  async toString(): Promise<string> {
    if (this.share_id === undefined) {
      return window.btoa(String.fromCharCode(...this.share_data))
    }
    if (this.signature_info === undefined) {
      const output = Uint8Array.from([this.share_id, ...this.share_data])
      return ID_PREFIX + window.btoa(String.fromCharCode(...output))
    }
    const pubkey_raw = await crypto.subtle.exportKey('spki', this.signature_info.pubkey)

    const output = Uint8Array.from([
      this.share_id,
      ...new Uint8Array(pubkey_raw),
      ...new Uint8Array(this.signature_info.signature),
      ...this.share_data
    ])
    return SIGN_PREFIX + window.btoa(String.fromCharCode(...output))
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
