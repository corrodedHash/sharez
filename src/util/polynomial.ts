import { zero_array } from "./basic";

export type HandlerType<T> = {
  mul: (a: T, b: T) => T;
  add: (a: T, b: T) => T;
  zero: () => T;
};

export class Polynomial<T> {
  coefficients: T[];
  handler: HandlerType<T>;
  constructor(coefficients: T[], handler: HandlerType<T>) {
    this.coefficients = coefficients;
    this.handler = handler;
  }

  multiply(other: Polynomial<T>): Polynomial<T> {
    const result_length =
      this.coefficients.length + other.coefficients.length - 1;
    const new_coeffs = this.coefficients
      .map((x, x_index) => {
        const r = other.coefficients.map((y) => this.handler.mul(x, y));
        const front = zero_array(x_index).map(this.handler.zero);
        const back = zero_array(
          result_length - other.coefficients.length - x_index
        ).map(this.handler.zero);
        return front.concat(r, back);
      })
      .reduce((a, b) => a.map((v, vi) => this.handler.add(v, b[vi])));
    return new Polynomial(new_coeffs, this.handler);
  }

  add(other: Polynomial<T>): Polynomial<T> {
    const result_coefficients = zero_array(
      Math.max(this.coefficients.length, other.coefficients.length)
    ).map(this.handler.zero);
    for (let i = 0; i < result_coefficients.length; i++) {
      result_coefficients[i] = this.handler.add(
        this.coefficients[i] ?? this.handler.zero(),
        other.coefficients[i] ?? this.handler.zero()
      );
    }
    return new Polynomial(result_coefficients, this.handler);
  }

  evaluate(x: T): T {
    const x_powers = [x];

    for (const _ in this.coefficients.slice(1)) {
      x_powers.push(this.handler.mul(x_powers[x_powers.length - 1], x));
    }
    return this.coefficients
      .map((v, i) => this.handler.mul(v, x_powers[i]))
      .reduce((a, b) => this.handler.add(a, b));
  }
}
