import { getRandomInt } from "./basic";

import { Polynomial, HandlerType } from "./polynomial";
import { GF256Element } from "./GF256";

const GF256Handler: HandlerType<GF256Element> = {
  add: (a, b) => a.add(b),
  sub: (a, b) => a.add(b),
  mul: (a, b) => a.mul(b),
  div: (a, b) => a.div(b),
  zero: () => new GF256Element(0),
  one: () => new GF256Element(1),
};

type GF256Polynomial = Polynomial<GF256Element>;

/**
 * @param x_values X values of the points used for interpolating the polynomial
 * @param y_values Y values of the points used for interpolating the polynomial
 * @returns Coefficients for polynomial in order [x^0, x^1,...]
 */
function get_polynomial(
  x_values: GF256Element[],
  y_values: GF256Element[]
): GF256Polynomial {
  if (x_values.length === 1) {
    return new Polynomial(y_values, GF256Handler);
  }
  function lagrange_base(index: number): GF256Polynomial {
    const filtered_points = x_values.filter((_, v_index) => v_index !== index);
    const denominator = filtered_points
      .map((v) => x_values[index].add(v))
      .reduce((a, b) => a.mul(b));

    const numerator = filtered_points
      .map((v) => new Polynomial([v, new GF256Element(1)], GF256Handler))
      .reduce((a, b) => a.multiply(b));

    return numerator.multiply(
      new Polynomial([new GF256Element(1).div(denominator)], GF256Handler)
    );
  }

  return y_values
    .map((v, index) =>
      lagrange_base(index).multiply(new Polynomial([v], GF256Handler))
    )
    .reduce((a, b) => a.add(b));
}

export class SSS {
  polynomials: GF256Polynomial[];

  constructor(polynomials: GF256Polynomial[]) {
    this.polynomials = polynomials;
  }

  public static from_secret(secret: Uint8Array, threshold: number): SSS {
    const polynomials = Array.from(secret)
      .map((v) => [
        new GF256Element(v),
        ...[...Array(threshold - 1)].map(
          () => new GF256Element(getRandomInt(0, 256))
        ),
      ])
      .map((v) => new Polynomial(v, GF256Handler));
    return new SSS(polynomials);
  }

  public static from_shares(shares: Uint8Array[], share_ids: number[]): SSS {
    // `shares[0]` is the share of the first user, `transposed_shares[0]` is the first byte of each share
    const transposed_shares = Array.from(shares[0]).map((_, colIndex) =>
      shares.map((row) => row[colIndex])
    );
    const polynomials = transposed_shares.map((share_bytes) =>
      get_polynomial(
        share_ids.map((shareID) => new GF256Element(shareID)),
        share_bytes.map((shareByte) => new GF256Element(shareByte))
      )
    );
    return new SSS(polynomials);
  }

  get_share(id: number): Uint8Array {
    return Uint8Array.from(
      this.polynomials.map((v) => v.evaluate(new GF256Element(id)).bits)
    );
  }

  get_secret(): Uint8Array {
    return this.get_share(0);
  }
}
