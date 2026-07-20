/**
 * @file csp-service.interface.ts
 * @module @stackra/contracts/interfaces/csp
 * @description Cross-package contract for the CSP service.
 *
 *   Consumed by `@stackra/ssr` to set the `Content-Security-Policy`
 *   header and per-request nonce on server-rendered responses without
 *   depending on the `@stackra/csp` runtime. Inject via
 *   `@Inject(CSP_SERVICE)`.
 */

/**
 * A generated CSP policy with its nonce.
 */
export interface ICspPolicyResult {
  /**
   * The generated nonce value (without the `nonce-` prefix). Pass this to
   * `<NonceProvider>` and to `renderToReadableStream({ nonce })`. Empty
   * string when nonce generation is disabled.
   */
  readonly nonce: string;

  /** The full CSP header value ready to be set on the response. */
  readonly header: string;

  /**
   * The header name — `Content-Security-Policy` or
   * `Content-Security-Policy-Report-Only` based on config.
   */
  readonly headerName: string;
}

/**
 * The CSP service contract.
 */
export interface ICspService {
  /** Generate a fresh CSP policy with a new nonce (use per SSR request). */
  generatePolicy(): ICspPolicyResult;

  /** Get a cached policy (generate once, reuse — SPA mode). */
  getPolicy(): ICspPolicyResult;

  /** Reset the cached policy, forcing regeneration on next `getPolicy()`. */
  resetPolicy(): void;
}
