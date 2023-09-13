import { SSS } from 'sharez'
import SSSWorker from './shareGenWorker?worker'
import { type GeneratorCommand } from './shareGenWorker'

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
