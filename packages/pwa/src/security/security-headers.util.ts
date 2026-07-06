/**
 * @file security-headers.util.ts
 * @module @academorix/pwa/security/security-headers.util
 *
 * @description
 * Baseline security-header bundle for both Academorix apps. The
 * dashboard's `vercel.json` and the marketing app's Next.js
 * middleware / `next.config.ts` both consume this via
 * {@link getSecurityHeaders}, so bumping a directive updates both
 * apps in one place.
 *
 * ## Directives shipped
 *
 *  - `Strict-Transport-Security` — force HTTPS for 2 years incl.
 *    subdomains + preload registration.
 *  - `X-Content-Type-Options: nosniff` — stops MIME sniffing.
 *  - `X-Frame-Options` — default `DENY`. Marketing overrides to
 *    `SAMEORIGIN` (allows in-app previews).
 *  - `Referrer-Policy` — `strict-origin-when-cross-origin` (the
 *    modern web-security baseline).
 *  - `Permissions-Policy` — turns off browser APIs we don't use.
 *  - `Content-Security-Policy` — composed from {@link buildContentSecurityPolicy}.
 *
 * ## Not shipped
 *
 *  - `X-XSS-Protection` — deprecated, browsers ignore it. Modern
 *    protection is CSP.
 *  - `Expect-CT` — deprecated as of Chrome 107 (CT is now enforced
 *    unconditionally).
 */

import { buildContentSecurityPolicy } from "./csp.util";

import type { CspInput } from "./csp.util";

/** `X-Frame-Options` value. */
export type FrameOptionsValue = "DENY" | "SAMEORIGIN";

/** Options passed to {@link getSecurityHeaders}. */
export interface SecurityHeadersOptions {
  /** CSP input passed through to {@link buildContentSecurityPolicy}. */
  readonly csp?: CspInput;
  /** `X-Frame-Options` value. Default `"DENY"`. */
  readonly frameOptions?: FrameOptionsValue;
  /**
   * Whether to emit `Strict-Transport-Security`. Default `true`.
   * Set to `false` during local dev over HTTP to avoid polluting the
   * browser's HSTS cache.
   */
  readonly enableHsts?: boolean;
  /**
   * `Permissions-Policy` value. Default disables camera, mic,
   * geolocation, payment, USB, and other high-impact APIs. Pass an
   * override string to allow specific APIs on specific surfaces.
   */
  readonly permissionsPolicy?: string;
  /**
   * Extra headers to merge on top of the baseline. Keys are header
   * names (case-preserved). Overrides win over the baseline.
   */
  readonly extra?: Readonly<Record<string, string>>;
}

/**
 * The default `Permissions-Policy` — locks down every powerful API
 * we don't use. Sensible baseline for a data-heavy admin app +
 * a marketing site.
 */
export const DEFAULT_PERMISSIONS_POLICY: string = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "midi=()",
  "sync-xhr=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
  "fullscreen=(self)",
  "picture-in-picture=(self)",
].join(", ");

/**
 * Returns the composed baseline as an object keyed by header name.
 * Consumers spread this into `vercel.json` `headers[].headers` or
 * a Next.js middleware `NextResponse`.
 *
 * @example
 * ```ts
 * // vercel.json builder
 * const headers = Object.entries(
 *   getSecurityHeaders({
 *     csp: {
 *       connectSrc: ["'self'", "https://api.academorix.app", "wss://reverb.academorix.app"],
 *     },
 *   }),
 * ).map(([key, value]) => ({ key, value }));
 * ```
 */
export function getSecurityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
  const {
    csp,
    frameOptions = "DENY",
    enableHsts = true,
    permissionsPolicy = DEFAULT_PERMISSIONS_POLICY,
    extra,
  } = options;

  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(csp),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": frameOptions,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": permissionsPolicy,
  };

  if (enableHsts) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      headers[key] = value;
    }
  }

  return headers;
}
