import { SSS, Share, ShareDecoder } from 'sharez'
import SSSWorker from './shareGenWorker?worker'
import { type GeneratorCommand, type RecoverCommand, type ShareCommand } from './shareGenWorker'

export async function createGen(text: string, count: number): Promise<SSS> {
  const encoder = new TextEncoder()
  const secret = encoder.encode(text)
  return await new Promise((resolve) => {
    const worker = new SSSWorker()
    const cmd: GeneratorCommand = { cmd: 'generator', secret, count }
    worker.onmessage = (e) => {
      try {
        resolve(SSS.from_json(e.data))
      } catch (ex) {
        console.warn('Create gen worker sent weird data', e, ex)
      }
    }
    worker.postMessage(cmd)
  })
}

export async function* shares(
  sss: SSS,
  xValues: number[],
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<Share> {
  const worker = new SSSWorker()
  const terminationToken = Symbol('Termination')
  signal?.addEventListener('abort', () => worker.terminate())

  const cmd: ShareCommand = { cmd: 'share', sss: JSON.stringify(sss), xValues }
  let receivedCount = 0
  worker.postMessage(cmd)

  while (receivedCount < xValues.length) {
    const rcvPromise = new Promise((resolve: (arg0: Share) => void, reject) => {
      const terminationCallback = () => reject(terminationToken)
      signal?.addEventListener('abort', terminationCallback)

      worker.onmessage = async (e) => {
        try {
          const share = await new ShareDecoder().decode(e.data)
          resolve(share)
          signal?.removeEventListener('abort', terminationCallback)
        } catch (ex) {
          console.warn('Share creator sent weird data', e, ex)
          throw ex
        }
      }
      worker.onerror = (error) => {
        reject(error)
      }
    })
    try {
      const nextResult = await rcvPromise
      yield nextResult
    } catch (ex) {
      if (ex === terminationToken) {
        return
      } else {
        throw ex
      }
    }
    receivedCount += 1
  }
}

export async function getSecret(data: [Uint8Array, number][]): Promise<SSS> {
  return new Promise((resolve) => {
    const worker = new SSSWorker()
    const cmd: RecoverCommand = { cmd: 'recover', info: data }
    worker.onmessage = async (e) => {
      const sss = SSS.from_json(e.data)
      resolve(sss)
    }
    worker.postMessage(cmd)
  })
}
