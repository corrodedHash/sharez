import { expect, test } from 'vitest'
import { GF256Element as GF } from './GF256'

test('Sanity for GF256', () => {
  expect(new GF(10).pow(2)).toEqual(new GF(10).mul(new GF(10)))
  expect(new GF(0b111).add(new GF(0b1010))).toEqual(new GF(0b1101))
  expect(new GF(7).div(new GF(7))).toEqual(new GF(1))
})
