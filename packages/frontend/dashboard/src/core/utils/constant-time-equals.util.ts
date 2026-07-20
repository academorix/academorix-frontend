/**
 * @file constant-time-equals.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Length-safe, constant-time string equality.
 *
 *   Runs in time proportional to the shorter input so an attacker
 *   cannot infer a password prefix by measuring response time on the
 *   unlock endpoint. Returns `false` immediately when lengths differ
 *   — that timing leak is inherent and acceptable, since length is
 *   not secret.
 */

/**
 * Compare two strings in constant time.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns `true` when the strings are equal, `false` otherwise.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  // Length mismatch short-circuits — the leak here (length isn't
  // secret) is intentional and matches what every constant-time
  // comparison library does.
  if (a.length !== b.length) return false;

  let mismatch = 0;

  for (let index = 0; index < a.length; index += 1) {
    // XOR every char code + fold into `mismatch` — any bit set
    // survives the fold, so we can inspect it once at the end.
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}
