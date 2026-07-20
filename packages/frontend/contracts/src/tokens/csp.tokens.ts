/**
 * @file csp.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the Content-Security-Policy subsystem.
 *
 *   These tokens live in contracts (not `@stackra/csp`) so cross-package
 *   consumers — notably `@stackra/ssr`, which stamps the CSP header and
 *   nonce onto server-rendered responses — can inject the CSP service
 *   without depending on the runtime package. Same pattern as
 *   NETWORK_SERVICE, MIDDLEWARE_RESOLVER, LOGGER_MANAGER.
 */

/** Token for the CSP module configuration (root directive sources). */
export const CSP_CONFIG = Symbol.for("CSP_CONFIG");

/** Token for the CspService that builds the policy header + nonce. */
export const CSP_SERVICE = Symbol.for("CSP_SERVICE");

/** Token for the CspRegistry that collects feature-scoped contributions. */
export const CSP_REGISTRY = Symbol.for("CSP_REGISTRY");
