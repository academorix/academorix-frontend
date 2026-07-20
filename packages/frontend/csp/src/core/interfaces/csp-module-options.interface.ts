/**
 * @file csp-module-options.interface.ts
 * @module @stackra/csp/core/interfaces
 * @description Configuration object passed to `CspModule.forRoot()`.
 *
 *   Each property maps to a CSP directive. Values are arrays of sources.
 *   The special source `'nonce'` is replaced with `'nonce-<generated>'`
 *   at runtime.
 */

import type { CspSource } from '../types/csp-source.type';

/**
 * Configuration options for `CspModule.forRoot()`.
 *
 * @example
 * ```typescript
 * CspModule.forRoot({
 *   defaultSrc: ["'self'"],
 *   scriptSrc: ["'self'", "'nonce'", 'https://www.googletagmanager.com'],
 *   styleSrc: ["'self'", "'unsafe-inline'"],
 *   imgSrc: ["'self'", 'data:'],
 *   connectSrc: ["'self'", 'https://api.example.com'],
 * });
 * ```
 */
export interface CspModuleOptions {
  // ── Fetch Directives ──────────────────────────────────────────────────

  /**
   * Fallback for all fetch directives not explicitly set.
   *
   * @default ["'self'"]
   */
  defaultSrc?: CspSource[];

  /**
   * Valid sources for JavaScript execution. Include `'nonce'` to enable
   * per-request nonce injection.
   *
   * @default ["'self'", "'nonce'"]
   */
  scriptSrc?: CspSource[];

  /**
   * Valid sources for stylesheets. `'unsafe-inline'` is often needed for
   * CSS-in-JS and component libraries.
   *
   * @default ["'self'", "'unsafe-inline'"]
   */
  styleSrc?: CspSource[];

  /**
   * Valid sources for images.
   *
   * @default ["'self'", 'data:']
   */
  imgSrc?: CspSource[];

  /**
   * Valid sources for fetch, XHR, WebSocket, and EventSource connections.
   *
   * @default ["'self'"]
   */
  connectSrc?: CspSource[];

  /**
   * Valid sources for fonts.
   *
   * @default ["'self'"]
   */
  fontSrc?: CspSource[];

  /**
   * Valid sources for `<frame>` and `<iframe>`.
   *
   * @default ["'none'"]
   */
  frameSrc?: CspSource[];

  /**
   * Valid sources for `<object>`, `<embed>`, and `<applet>`.
   *
   * @default ["'none'"]
   */
  objectSrc?: CspSource[];

  /**
   * Valid sources for web workers and nested browsing contexts.
   *
   * @default ["'self'"]
   */
  workerSrc?: CspSource[];

  /**
   * Valid sources for media (`<audio>`, `<video>`).
   *
   * @default ["'self'"]
   */
  mediaSrc?: CspSource[];

  /**
   * Valid sources for the `<base>` element.
   *
   * @default ["'self'"]
   */
  baseUri?: CspSource[];

  /**
   * Valid targets for form submissions.
   *
   * @default ["'self'"]
   */
  formAction?: CspSource[];

  // ── Behavior ──────────────────────────────────────────────────────────

  /**
   * Report violations to this URI. Enables the `report-uri` directive.
   */
  reportUri?: string;

  /**
   * When `true`, uses `Content-Security-Policy-Report-Only` instead of
   * `Content-Security-Policy`. Violations are reported but not enforced.
   *
   * @default false
   */
  reportOnly?: boolean;

  /**
   * Enable nonce generation. When `true`, a cryptographic nonce is
   * generated per policy and `'nonce'` placeholders are replaced with
   * `'nonce-<value>'`.
   *
   * @default true
   */
  nonce?: boolean;

  /**
   * Enable the `upgrade-insecure-requests` directive. Instructs browsers
   * to upgrade HTTP requests to HTTPS.
   *
   * @default false
   */
  upgradeInsecureRequests?: boolean;
}
