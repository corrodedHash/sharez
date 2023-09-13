import { SSS, ShareEncoder } from 'sharez'

export interface GeneratorCommand {
  cmd: 'generator'
  secret: Uint8Array
  count: number
}

export interface ShareCommand {
  cmd: 'share'
  sss: string
  xValue: number
}

export type WorkerCommand = GeneratorCommand | ShareCommand

onmessage = async(e) => {
  const d: WorkerCommand = e.data
  switch (d.cmd) {
    case 'generator': {
      const sss = SSS.from_secret(d.secret, d.count)
      postMessage(JSON.stringify(sss))

      break
    }
    case 'share': {
      const sss = SSS.from_json(d.sss)
      postMessage(await new ShareEncoder().encode(sss.share(d.xValue)))
    }
  }
}
