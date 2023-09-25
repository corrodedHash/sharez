import { SSS, type Share } from 'sharez'
import SSSWorker from './shareGenWorker?worker'
import { type GeneratorCommand, type RecoverCommand, type ShareCommand } from './shareGenWorker'
import { ObsoleteResolve } from './lastEval'

export async function createGen(
  text: string,
  count: number,
  { signal }: { signal?: AbortSignal }
): Promise<SSS> {
  const encoder = new TextEncoder()
  const secret = encoder.encode(text)
  return await new Promise((resolve, reject) => {
    const worker = new SSSWorker()
    const cmd: GeneratorCommand = { cmd: 'generator', secret, count }
    signal?.addEventListener('abort', () => {
      worker.terminate()
      reject(new ObsoleteResolve())
    })
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

/** Wraps a worker in an iterator, such that we can iterate over promises of the next message of the worker
 *
 * @param worker The web worker that should be wrapped
 * @returns A `next` function, which can be called to await the next message
 */
function continuousWorkerMessages<T>(worker: Worker): { next(): Promise<T> } {
  const conditionVariable = {
    hit: undefined as undefined | ((v: T) => void),
    abort: undefined as undefined | ((e: any) => void)
  }
  const resolvedShares = [] as T[]

  worker.addEventListener('message', (e) => {
    resolvedShares.push(e.data)
    if (conditionVariable.hit !== undefined) {
      const c = conditionVariable.hit
      conditionVariable.hit = undefined
      conditionVariable.abort = undefined
      c(e.data)
    }
  })

  worker.addEventListener('error', (e) => {
    if (conditionVariable.abort !== undefined) conditionVariable.abort(e)
    console.warn('Worker encountered error')
  })

  const next = () =>
    new Promise((resolve: (arg0: T) => void, reject) => {
      console.assert(conditionVariable.hit === undefined)
      const r = resolvedShares.pop()
      if (r !== undefined) {
        resolve(r)
        return
      }
      conditionVariable.hit = (v) => {
        const g = resolvedShares.pop()
        console.assert(g === v, `${g} != ${v}`)
        resolve(v)
      }
      conditionVariable.abort = reject
    })
  return {
    next
  }
}

export async function* shares(
  sss: SSS,
  xValues: number[],
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<Share> {
  const worker = new SSSWorker()
  const { next: nextWorkerMessage } = continuousWorkerMessages<Share>(worker)

  signal?.addEventListener('abort', () => worker.terminate())

  const cmd: ShareCommand = { cmd: 'share', sss: JSON.stringify(sss), xValues }
  worker.postMessage(cmd)

  for (let i = 0; i < xValues.length; i += 1) {
    const rcvPromise = nextWorkerMessage().then((v) => v)
    const nextResult = await rcvPromise
    yield nextResult
    if (signal !== undefined && signal.aborted) {
      return
    }
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
