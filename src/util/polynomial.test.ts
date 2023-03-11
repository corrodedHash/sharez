import { expect, test } from "vitest";
import { Polynomial, HandlerType, interpolate } from "./polynomial";

const IntegerHandler: HandlerType<number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  div: (a, b) => a / b,
  mul: (a, b) => a * b,
  zero: () => 0,
  one: () => 1,
};

test("Polynomial sanity check", () => {
  const xp1 = new Polynomial([1, 1], IntegerHandler);
  const xm1 = new Polynomial([1, -1], IntegerHandler);
  const b = new Polynomial([0, -1, 0, 1], IntegerHandler);
  expect(xp1.multiply(xm1)).toEqual(new Polynomial([1, 0, -1], IntegerHandler));
  expect(xp1.multiply(xm1)).toEqual(new Polynomial([1, 0, -1], IntegerHandler));
  expect(b.multiply(new Polynomial([2], IntegerHandler))).toEqual(
    new Polynomial([0, -2, 0, 2], IntegerHandler)
  );
  expect(xp1.evaluate(0)).toEqual(1);
});

test("Interpolation", () => {
  expect(interpolate([-1, 0, 1], [2, 1, 2], IntegerHandler)).toEqual(
    new Polynomial([1, 0, 1], IntegerHandler)
  );
  const cubic = interpolate([-1, 0, 1, 2], [-1, 0, 1, 8], IntegerHandler);
  cubic.coefficients = cubic.coefficients.map(Math.round);
  expect(cubic).toEqual(new Polynomial([0, 0, 0, 1], IntegerHandler));
});
