import { SSS } from 'sharez'

export interface GeneratorCommand {
  cmd: 'generator'
  secret: Uint8Array
  count: number
}

export type WorkerCommand = GeneratorCommand

onmessage = (e) => {
  const d: WorkerCommand = e.data
  switch (d.cmd) {
    case 'generator': {
      const sss = SSS.from_secret(d.secret, d.count)
      postMessage(JSON.stringify(sss))

      break
    }
  }
}
