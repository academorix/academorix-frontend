/**
 * @file sha256-hex.util.ts
 * @module @stackra/dashboard/core/utils
 * @description SHA-256 hex digest via the SubtleCrypto API. Returns
 *   lowercase hex.
 *
 *   The backend spec upgrades to Argon2id; the playground ships
 *   SHA-256 because it's available in every modern browser without
 *   bundling an Argon2 implementation. That's OK — the playground
 *   never stores real passwords.
 */

/**
 * Compute the SHA-256 hex digest of a UTF-8 string.
 *
 * @param input - String to hash.
 * @returns Lowercase hex digest.
 * @throws {Error} When the runtime lacks SubtleCrypto.
 */
export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Unrealistic in the browser today, but documented so a caller
    // can decide what to do rather than seeing an opaque TypeError.
    throw new Error("SubtleCrypto is required to hash embed passwords.");
  }

  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
