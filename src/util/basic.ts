export function zero_array(length: number) {
  return [...Array(length)].map(() => 0)
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) // The maximum is exclusive and the minimum is inclusive
}

const hex_letters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
export function toHexString(n: number): string {
  let r = ''
  while (n > 0) {
    r = hex_letters[n % hex_letters.length] + r
    n = Math.trunc(n / 16)
  }
  return r
}

export function fromHexString(input: string): Uint8Array {
  const result = []
  for (let i = 0; i < input.length; i += 2) {
    const substring = input.substring(i, i + 2)
    const indices = [...substring].map((v) => hex_letters.findIndex((lv) => v.toUpperCase() == lv))
    if (indices[0] === -1 || indices[1] === -1) {
      throw new Error(`Unacceptable char in hexstring ${input}: ${substring}`)
    }
    result.push(indices[1] + indices[0] * 16)
  }
  return Uint8Array.from(result)
}

export interface Base64Options {
  extra_chars: string
  padding: boolean
}

export function fromBase64String(input: string, options?: Partial<Base64Options>): Uint8Array {
  return Uint8Array.from([...window.atob(input)].map((v) => v.charCodeAt(0)))
}

export function toBase64String(input: Uint8Array, options?: Partial<Base64Options>): string {
  let encoded = window.btoa(String.fromCharCode(...input))
  if (options !== undefined && options.padding !== undefined && !options.padding) {
    encoded = encoded.replaceAll('=', '')
  }
  if (options !== undefined && options.extra_chars !== undefined) {
    encoded = encoded.replaceAll('=', '')
  }

  return encoded
}
