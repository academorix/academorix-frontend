/**
 * @file csp-source.type.ts
 * @module @stackra/csp/core/types
 * @description CSP directive source value.
 *
 *   Can be a keyword (`'self'`, `'unsafe-inline'`, `'nonce'`) or a
 *   URL/pattern. The special value `'nonce'` is replaced with the actual
 *   nonce at generation time.
 */

/**
 * CSP directive source value.
 *
 * Can be a keyword (`'self'`, `'unsafe-inline'`, `'nonce'`) or a
 * URL/pattern. The special value `'nonce'` is replaced with the actual
 * nonce at generation time.
 */
export type CspSource = string;
