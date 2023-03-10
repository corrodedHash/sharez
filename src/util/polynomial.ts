import { zero_array } from "./basic";

export function multiply_polynomials(
  a: number[],
  b: number[],
  modulus?: number
): number[] {
  const result_length = a.length + b.length - 1;
  const mul = (a: number, b: number) =>
    modulus === undefined ? a * b : (a * b) % modulus;
  const add = (a: number, b: number) =>
    modulus === undefined ? a + b : (a + b) % modulus;
  return a
    .map((x, x_index) => {
      const r = b.map((y) => mul(x, y));
      const front = zero_array(x_index);
      const back = zero_array(result_length - b.length - x_index);
      return front.concat(r, back);
    })
    .reduce((a, b) => a.map((v, vi) => add(v, b[vi])));
}
/**
 *
 * @param p Coefficients of the polynomial, in order [x^0, x^1, ...]
 * @param x The point at which to evaluate the polynomial
 * @param modulus If not `undefined`, return the result modulo `modulus`
 * @returns The evaluated point `x` in the polynomial `p`
 */
export function evaluate_polynomial(
  p: number[],
  x: number,
  modulus?: number
): number {
  if (x == 0) return p[0];
  const x_powers = [1];

  const mul = (x: number, y: number) =>
    modulus === undefined ? x * y : (x * y) % modulus;
  const add = (x: number, y: number) =>
    modulus === undefined ? x + y : (x + y) % modulus;

  for (const _ in p.slice(1)) {
    x_powers.push(mul(x_powers[x_powers.length - 1], x));
  }
  return p.map((v, i) => mul(v, x_powers[i])).reduce((a, b) => add(a, b));
}
