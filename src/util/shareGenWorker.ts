import { SSS, type Share } from 'sharez'

export interface GeneratorCommand {
  cmd: 'generator'
  secret: Uint8Array
  count: number
}

export interface ShareCommand {
  cmd: 'share'
  sss: string
  xValues: number[]
}

export interface RecoverCommand {
  cmd: 'recover'
  info: [Uint8Array, number][]
}

export type WorkerCommand = GeneratorCommand | ShareCommand | RecoverCommand

onmessage = async (e) => {
  const d: WorkerCommand = e.data
  switch (d.cmd) {
    case 'generator': {
      const sss = SSS.from_secret(d.secret, d.count)
      postMessage(JSON.stringify(sss))

      break
    }
    case 'share': {
      const sss = SSS.from_json(d.sss)
      d.xValues.forEach(async (xValue) => postMessage(sss.share(xValue)))

      break
    }
    case 'recover': {
      const shares: Share[] = d.info.map(([data, xValue]) => ({
        yValues: data,
        xValue
      }))
      postMessage(JSON.stringify(SSS.from_shares(shares)))
      break
    }
  }
}
