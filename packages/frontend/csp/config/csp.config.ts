/**
 * @file csp.config.ts
 * @module @stackra/csp/config
 * @description Application-level Content-Security-Policy configuration.
 *   Copy into your app's `src/config/` and pass to `CspModule.forRoot()`.
 *
 *   Trimmed to reasonable defaults — add the origins your app actually
 *   loads (CDNs, analytics, payment iframes, API + realtime endpoints).
 */

import type { CspModuleOptions } from '@stackra/csp';

/**
 * CSP module configuration.
 */
export const cspConfig: CspModuleOptions = {
  /*
  |--------------------------------------------------------------------------
  | Script Sources
  |--------------------------------------------------------------------------
  |
  | Controls which scripts can execute. The 'nonce' placeholder is replaced
  | with a per-policy cryptographic nonce at generation time.
  |
  */
  scriptSrc: ["'self'", "'nonce'"],

  /*
  |--------------------------------------------------------------------------
  | Style Sources
  |--------------------------------------------------------------------------
  |
  | 'unsafe-inline' is required for most CSS-in-JS / component libraries.
  |
  */
  styleSrc: ["'self'", "'unsafe-inline'"],

  /*
  |--------------------------------------------------------------------------
  | Image Sources
  |--------------------------------------------------------------------------
  */
  imgSrc: ["'self'", 'data:', 'blob:'],

  /*
  |--------------------------------------------------------------------------
  | Connection Sources (fetch, XHR, WebSocket)
  |--------------------------------------------------------------------------
  */
  connectSrc: ["'self'"],

  /*
  |--------------------------------------------------------------------------
  | Font Sources
  |--------------------------------------------------------------------------
  */
  fontSrc: ["'self'"],

  /*
  |--------------------------------------------------------------------------
  | Frame / Object / Worker Sources
  |--------------------------------------------------------------------------
  */
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  workerSrc: ["'self'"],

  /*
  |--------------------------------------------------------------------------
  | Behavior
  |--------------------------------------------------------------------------
  */
  nonce: true,
  reportOnly: false,
  upgradeInsecureRequests: false,
};
