onmessage = (e) => {
  postMessage(JSON.stringify(e))
  console.log('blabla')
  console.log(e)
}
