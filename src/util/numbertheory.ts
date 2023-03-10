export function egcd(a: number, b: number): number[] {
  if (a < b) [a, b] = [b, a];
  let s = 0,
    old_s = 1;
  let t = 1,
    old_t = 0;
  let r = b,
    old_r = a;
  while (r != 0) {
    const q = Math.floor(old_r / r);
    [r, old_r] = [old_r - q * r, r];
    [s, old_s] = [old_s - q * s, s];
    [t, old_t] = [old_t - q * t, t];
  }

  return [old_s, old_t, old_r];
}

export function multiplicative_inverse(
  n: number,
  modulus: number
): number | undefined {
  const [_, n_inv, gcd] = egcd(modulus, n % modulus);
  if (gcd !== 1) return undefined;
  return ((n_inv % modulus) + modulus) % modulus;
}
