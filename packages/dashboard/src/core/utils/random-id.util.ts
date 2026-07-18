/**
 * @file random-id.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Small crypto-random UUID helper. Uses
 *   `crypto.randomUUID` when the runtime exposes it (every current
 *   browser + Node ≥ 19); falls back to a `Math.random` shim for
 *   ancient jsdom test environments.
 *
 *   The fallback is not cryptographically secure — the playground
 *   uses it only when the runtime lacks `crypto.randomUUID`, and
 *   production always has the WebCrypto API available.
 */

/**
 * Return a fresh UUID string. Uses `crypto.randomUUID` when
 * available, or a `Math.random` shim otherwise.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback — good enough for the playground; never used in prod.
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
