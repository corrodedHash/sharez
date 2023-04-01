const SIGN_ALGO = 'ECDSA'
const SIGN_CURVE = 'P-256'
export class ShareFormatter {
  share_id: number | undefined
  share_data: Uint8Array
  public_key: CryptoKey | undefined
  signature: ArrayBuffer | undefined

  constructor(share_id: number | undefined, share_data: Uint8Array) {
    this.share_id = share_id
    this.share_data = share_data
  }
  private get_signable_data(): Uint8Array {
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
    this.public_key = await crypto.subtle.importKey(
      'spki',
      publicKey,
      { name: SIGN_ALGO, namedCurve: SIGN_CURVE },
      true,
      ['verify']
    )

    this.signature = signature
  }

  async verify() {
    if (this.public_key === undefined || this.signature === undefined) {
      throw new Error('Cannot verify share with no public key information')
    }
    return await crypto.subtle.verify(
      SIGN_ALGO,
      this.public_key,
      this.signature,
      this.get_signable_data()
    )
  }

  static fromString(input: string): ShareFormatter {
    if (input.startsWith('$')) {
      const data_str = input.slice(1)
      const data = [...atob(data_str)].map((v) => v.charCodeAt(0))
      return new ShareFormatter(data[0], Uint8Array.from(data.slice(1)))
    }

    const data = [...atob(input)].map((v) => v.charCodeAt(0))
    return new ShareFormatter(undefined, Uint8Array.from(data.slice(1)))
  }

  toString(): string {
    if (this.share_id === undefined) {
      return btoa(String.fromCharCode(...this.share_data))
    }
    const output = Uint8Array.from([this.share_id, ...this.share_data])
    return '$' + btoa(String.fromCharCode(...output))
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
