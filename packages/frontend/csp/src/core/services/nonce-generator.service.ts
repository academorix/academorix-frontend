/**
 * @file nonce-generator.service.ts
 * @module @stackra/csp/core/services
 * @description Generates cryptographically secure nonces for CSP headers.
 *
 *   Uses `crypto.randomUUID()` when available, falls back to
 *   `crypto.getRandomValues()` for older environments.
 */

import { Injectable } from "@stackra/container";
import { Str } from "@stackra/support";

/**
 * Generates cryptographically secure nonces for CSP.
 *
 * Each call produces a unique, unpredictable value suitable for use in
 * `script-src 'nonce-<value>'` directives.
 *
 * @example
 * ```typescript
 * const generator = new NonceGenerator();
 * const nonce = generator.generate(); // "a1b2c3d4e5f6..."
 * ```
 */
@Injectable()
export class NonceGenerator {
  /**
   * Generate a cryptographically secure nonce string.
   *
   * Delegates to `Str.uuid()` (which handles the `crypto.randomUUID` /
   * `crypto.getRandomValues` fallback in one place) and strips the
   * UUID's dashes to fit the CSP nonce format.
   *
   * @returns A unique nonce string.
   */
  public generate(): string {
    return Str.uuid().replace(/-/g, "");
  }
}
