import { expect, test, assert } from 'vitest'
import { getRandomInt } from './basic'

import { ShareFormatter } from './ShareFormatter'

test('Sanity test for ShareFormatter', () => {
  for (let i = 0; i < 30; i++) {
    const data = Uint8Array.from([...Array(5)].map(() => getRandomInt(0, 256)))
    const share_id = getRandomInt(1, 256)
    const shared_formatter = new ShareFormatter(share_id, data)
    const shared = shared_formatter.toString()
    assert(shared.startsWith('$'))
    expect(ShareFormatter.fromString(shared), `${share_id} ${shared} ${data}`).toEqual(
      shared_formatter
    )
  }
})
