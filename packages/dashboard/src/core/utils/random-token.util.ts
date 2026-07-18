/**
 * @file random-token.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Generate a random opaque token as a lowercase hex
 *   string. Used for embed tokens + unlock session keys — high entropy
 *   is important because these are secrets.
 *
 *   The fallback shim (used only when the runtime lacks
 *   `crypto.getRandomValues`) is NOT cryptographically secure and is
 *   never used in production browsers.
 */

import { randomId } from "./random-id.util";

/**
 * Return a fresh 32-byte hex token (64 chars).
 *
 * Uses `crypto.getRandomValues` when available. Falls back to a
 * `Math.random`-based shim for ancient jsdom environments.
 */
export function randomToken(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);

    crypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback shim — never used in prod.
  return randomId().replaceAll("-", "");
}
