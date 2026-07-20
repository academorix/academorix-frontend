/**
 * @file link-tag.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Descriptor for a single `<link>` tag contributed by a
 *   route's `head` field.
 */

/**
 * A single `<link>` tag that will be appended to the document head
 * while the route is active.
 *
 * @example
 * ```typescript
 * {rel: 'preload', href: '/fonts/inter.woff2', as: 'font', crossOrigin: 'anonymous'}
 * ```
 */
export interface ILinkTag {
  /** The `rel` attribute — `preload`, `preconnect`, `alternate`, etc. */
  readonly rel: string;

  /** URL the link points to. */
  readonly href: string;

  /**
   * Resource type hint for the preload / prefetch — required for the
   * browser to fetch the resource with the correct `Accept` header.
   */
  readonly as?: "font" | "style" | "script" | "image" | "fetch" | "document";

  /** MIME type (e.g. `'font/woff2'`). */
  readonly type?: string;

  /**
   * CORS credentials mode. Fonts served from a different origin need
   * `'anonymous'` even when the request itself is anonymous.
   */
  readonly crossOrigin?: "anonymous" | "use-credentials";

  /** Language of the linked resource — used with `rel="alternate"`. */
  readonly hreflang?: string;

  /** Media query the link applies to (e.g. `'(prefers-color-scheme: dark)'`). */
  readonly media?: string;

  /** Subresource Integrity hash. */
  readonly integrity?: string;

  /** Explicit `sizes` attribute — mostly for favicons. */
  readonly sizes?: string;
}
