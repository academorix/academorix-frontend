/**
 * @file csp.util.ts
 * @module @academorix/pwa/security/csp.util
 *
 * @description
 * `buildContentSecurityPolicy(input)` — composes a Content Security
 * Policy header value from a structured input object.
 *
 * The CSP is the security-header that stops the vast majority of XSS
 * + clickjacking + data-exfiltration attacks. It's HARD to get right
 * by hand (order matters, directive names differ from headers), so
 * we encode the sane defaults + let the caller override per app.
 *
 * ## Sources of truth
 *
 *  - MDN CSP reference — https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 *  - OWASP CSP cheatsheet — https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 *  - Vercel's default CSP — sane baseline for the marketing app.
 *
 * ## Output
 *
 * A single string in the header format:
 *
 * ```
 * default-src 'self'; script-src 'self' 'unsafe-inline' ...; ...
 * ```
 *
 * The header MUST be joined with `; ` (semicolon-space); commas
 * separate multiple `Content-Security-Policy` headers (which is
 * ORed by the browser). We use semicolons.
 */

/**
 * The structured CSP input. Every field is optional — defaults ship
 * a reasonable baseline. Values are arrays of "source expressions"
 * that end up joined with a space per directive.
 */
export interface CspInput {
  /** `default-src` — fallback for every unspecified directive. */
  readonly defaultSrc?: readonly string[];
  /** `script-src` — where JS may come from. */
  readonly scriptSrc?: readonly string[];
  /** `style-src` — where CSS may come from. */
  readonly styleSrc?: readonly string[];
  /** `img-src` — where images may come from. */
  readonly imgSrc?: readonly string[];
  /** `font-src` — where fonts may come from. */
  readonly fontSrc?: readonly string[];
  /** `connect-src` — where fetch/XHR/WebSocket may connect. */
  readonly connectSrc?: readonly string[];
  /** `frame-src` — where iframes may be embedded from. */
  readonly frameSrc?: readonly string[];
  /** `media-src` — where audio/video may come from. */
  readonly mediaSrc?: readonly string[];
  /** `worker-src` — where Web/Service Workers may load from. */
  readonly workerSrc?: readonly string[];
  /** `manifest-src` — where the Web App Manifest may load from. */
  readonly manifestSrc?: readonly string[];
  /** `frame-ancestors` — who may embed us. Default `'none'`. */
  readonly frameAncestors?: readonly string[];
  /** `form-action` — where forms may POST. */
  readonly formAction?: readonly string[];
  /** `base-uri` — what `<base>` may resolve to. */
  readonly baseUri?: readonly string[];
  /** `object-src` — where `<object>`/`<embed>` may load. Default `'none'`. */
  readonly objectSrc?: readonly string[];
  /**
   * Append `upgrade-insecure-requests`. Default `true` — always send
   * requests over HTTPS when we're on HTTPS.
   */
  readonly upgradeInsecureRequests?: boolean;
  /**
   * Append `block-all-mixed-content`. Default `false` — largely
   * superseded by `upgrade-insecure-requests`, but some CSP
   * validators still want it.
   */
  readonly blockAllMixedContent?: boolean;
  /**
   * Extra free-form directives merged after the standard ones.
   * `{ "report-uri": ["/csp-report"] }` etc.
   */
  readonly extra?: Readonly<Record<string, readonly string[]>>;
}

/**
 * The Academorix CSP baseline. Every app starts here and adds/removes
 * per surface (dashboard needs Reverb WebSockets + API origin;
 * marketing needs analytics origin + iframe embed targets).
 */
export const DEFAULT_CSP_INPUT: CspInput = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "data:"],
  connectSrc: ["'self'"],
  frameSrc: ["'self'"],
  mediaSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
  manifestSrc: ["'self'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: true,
} as const;

/** kebab-case directive name for each `CspInput` field. */
const DIRECTIVE_MAP: readonly [keyof CspInput, string][] = [
  ["defaultSrc", "default-src"],
  ["scriptSrc", "script-src"],
  ["styleSrc", "style-src"],
  ["imgSrc", "img-src"],
  ["fontSrc", "font-src"],
  ["connectSrc", "connect-src"],
  ["frameSrc", "frame-src"],
  ["mediaSrc", "media-src"],
  ["workerSrc", "worker-src"],
  ["manifestSrc", "manifest-src"],
  ["frameAncestors", "frame-ancestors"],
  ["formAction", "form-action"],
  ["baseUri", "base-uri"],
  ["objectSrc", "object-src"],
];

/**
 * Composes a CSP header value from `input`. Missing directives fall
 * back to {@link DEFAULT_CSP_INPUT}. Callers that want a completely
 * clean slate pass `{ }` and provide every directive themselves.
 *
 * @example
 * ```ts
 * const csp = buildContentSecurityPolicy({
 *   connectSrc: ["'self'", "wss://reverb.academorix.app", "https://api.academorix.app"],
 *   imgSrc: ["'self'", "data:", "https:", "blob:"],
 * });
 * ```
 */
export function buildContentSecurityPolicy(input: CspInput = {}): string {
  const merged: CspInput = { ...DEFAULT_CSP_INPUT, ...input };

  const directives: string[] = [];

  for (const [key, directive] of DIRECTIVE_MAP) {
    const values = merged[key] as readonly string[] | undefined;

    if (values && values.length > 0) {
      directives.push(`${directive} ${values.join(" ")}`);
    }
  }

  if (merged.upgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  if (merged.blockAllMixedContent) {
    directives.push("block-all-mixed-content");
  }

  if (merged.extra) {
    for (const [directive, values] of Object.entries(merged.extra)) {
      if (values.length > 0) {
        directives.push(`${directive} ${values.join(" ")}`);
      }
    }
  }

  return directives.join("; ");
}
