import { expect, test } from "vitest";
import { SSS } from "./sss";

test("Secret sharing sanity check", () => {
  const share_gen = SSS.from_secret(Uint8Array.from([1]), 2);
  const shares = [share_gen.get_share(17), share_gen.get_share(101)];
  const reconstructed = SSS.from_shares(shares, [17, 101]);
  console.log(reconstructed.polynomials[0].coefficients);
  console.log(share_gen.polynomials[0].coefficients);
  expect(reconstructed.get_secret()).toEqual(Uint8Array.from([1]));
});
