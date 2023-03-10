import { getRandomInt } from "./basic";
import { multiplicative_inverse } from "./numbertheory";
import { evaluate_polynomial, multiply_polynomials } from "./polynomial";

export const MODULUS = 257;

/**
 * @param x_values X values of the points used for interpolating the polynomial
 * @param y_values Y values of the points used for interpolating the polynomial
 * @returns Coefficients for polynomial in order [x^0, x^1,...]
 */
export function get_polynomial(x_values: number[], y_values: number[]): number[] {
  if (x_values.length === 1) {
    return [y_values[0]];
  }
  function lagrange_base(index: number): number[] {
    const filtered_points = x_values.filter((_, v_index) => v_index !== index);
    const denominator = filtered_points
      .map((v) => (x_values[index] + (MODULUS - v)) % MODULUS)
      .reduce((a, b) => (a * b) % MODULUS);

    const numerator = filtered_points
      .map((v) => [MODULUS - v, 1])
      .reduce((a, b) => multiply_polynomials(a, b, MODULUS));
    const inverted_denominator = multiplicative_inverse(denominator, MODULUS);
    if (inverted_denominator === undefined) {
      throw new Error(
        `Denominator ${denominator} cannot be inverted in ${MODULUS}`
      );
    }
    return numerator.map((v) => (v * inverted_denominator) % MODULUS);
  }

  return y_values
    .map((v, index) => lagrange_base(index).map((lv) => (lv * v) % MODULUS))
    .reduce((a, b) => a.map((v, i) => (v + b[i]) % MODULUS));
}

function share_byte(input_byte: number, shareCount: number): number[] {
  const share_points = [...Array(shareCount - 1)].map(() =>
    getRandomInt(0, 257)
  );
  share_points.unshift(input_byte);
  const p = get_polynomial(Array.from(share_points.keys()), share_points);
  const last_share_point = evaluate_polynomial(p, shareCount, MODULUS);
  if (last_share_point === MODULUS - 1) {
    /// If we cannot fit the point in a byte, try again
    return share_byte(input_byte, shareCount);
  }
  share_points.shift();
  share_points.push(last_share_point);
  return share_points;
}

export function create_shares(
  input: Uint8Array,
  shareCount: number
): Uint8Array[] {
  if (input.length === 0) {
    return [...Array(shareCount)].map(() => Uint8Array.from([]));
  }
  const byte_shares = Array.from(input).map((v) => share_byte(v, shareCount));
  return byte_shares[0]?.map((_, colIndex) =>
    Uint8Array.from(byte_shares.map((row) => row[colIndex]))
  );
}
