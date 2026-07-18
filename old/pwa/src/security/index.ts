/**
 * @file index.ts
 * @module @academorix/pwa/security
 *
 * @description
 * Public barrel for the security-headers builder + CSP composer.
 */

export { buildContentSecurityPolicy, DEFAULT_CSP_INPUT } from "./csp.util";
export type { CspInput } from "./csp.util";

export { DEFAULT_PERMISSIONS_POLICY, getSecurityHeaders } from "./security-headers.util";
export type { FrameOptionsValue, SecurityHeadersOptions } from "./security-headers.util";
