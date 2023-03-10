import { expect, test } from "vitest";
import { Polynomial, HandlerType } from "./polynomial";

const IntegerHandler: HandlerType<number> = {
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  zero: () => 0,
};

test("Polynomial sanity check", () => {
  const xp1 = new Polynomial([1, 1], IntegerHandler);
  const xm1 = new Polynomial([1, -1], IntegerHandler);

  expect(xp1.multiply(xm1)).toEqual(new Polynomial([1, 0, -1], IntegerHandler));
});
