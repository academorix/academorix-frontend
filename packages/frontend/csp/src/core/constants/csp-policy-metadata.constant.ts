/**
 * @file csp-policy-metadata.constant.ts
 * @module @stackra/csp/core/constants
 * @description Metadata key for the `@CspPolicy()` decorator.
 *
 *   Used by the `CspPolicyLoader` to discover classes decorated with
 *   `@CspPolicy()` at bootstrap time and register their CSP contributions.
 */

/**
 * Metadata key stored on classes decorated with `@CspPolicy()`.
 */
export const CSP_POLICY_METADATA = "CSP_POLICY_METADATA";
