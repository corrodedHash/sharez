import { expect, test, assert } from 'vitest'
import { getRandomInt } from './basic'

import { ShareFormatter, generateKeyPair } from './ShareFormatter'

test('Sanity test for ShareFormatter', async () => {
  for (let i = 0; i < 30; i++) {
    const data = Uint8Array.from([...Array(5)].map(() => getRandomInt(0, 256)))
    const share_id = getRandomInt(1, 256)
    const shared_formatter = new ShareFormatter(share_id, data)
    const shared = await shared_formatter.toString()
    assert(shared.startsWith('$'))
    expect(await ShareFormatter.fromString(shared), `${share_id} ${shared} ${data}`).toEqual(
      shared_formatter
    )
  }
})

test('Test signing', async () => {
  const kp = await generateKeyPair()
  const data = Uint8Array.from([...Array(5)].map(() => getRandomInt(0, 256)))

  const share_id = getRandomInt(1, 256)
  const shared_formatter = new ShareFormatter(share_id, data)
  await shared_formatter.sign(kp)
  const shared = await shared_formatter.toString()
  const rebuilt = await ShareFormatter.fromString(shared)
  expect(rebuilt).toEqual(shared_formatter)
})
