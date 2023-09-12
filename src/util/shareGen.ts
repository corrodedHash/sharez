import SSSWorker from './shareGenWorker?worker'

const worker = new SSSWorker()
worker.onmessage = function (e) {
  console.log('From worker', e)
}

worker.postMessage('Hello')
