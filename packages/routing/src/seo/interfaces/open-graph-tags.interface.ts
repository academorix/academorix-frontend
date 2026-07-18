/**
 * @file open-graph-tags.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description OpenGraph metadata (`og:*`).
 *
 *   Family exception per code-standards: the outer `IOpenGraphTags`
 *   and the nested `IOpenGraphImage` live in one file because the
 *   image shape is only ever used as an element of the outer's
 *   `images` list.
 */

/**
 * OpenGraph image descriptor.
 */
export interface IOpenGraphImage {
  /** Absolute or relative URL. */
  readonly url: string;
  /** Alt text for accessibility + fallback. */
  readonly alt?: string;
  /** Width in pixels. */
  readonly width?: number;
  /** Height in pixels. */
  readonly height?: number;
  /** MIME type (e.g. `'image/webp'`). */
  readonly type?: string;
}

/**
 * OpenGraph metadata. Rendered as `<meta property="og:...">`.
 */
export interface IOpenGraphTags {
  /** Title override. */
  readonly title?: string;
  /** Description override. */
  readonly description?: string;
  /** Content type (`website`, `article`, `product`, …). */
  readonly type?: string;
  /** Absolute URL of the page. */
  readonly url?: string;
  /** Site name (e.g. `'Acme'`). */
  readonly siteName?: string;
  /** Locale (e.g. `'en_US'`). */
  readonly locale?: string;
  /** Images. */
  readonly images?: readonly IOpenGraphImage[];
  /** Any extra `og:*` keys not covered above. */
  readonly extra?: Readonly<Record<string, string>>;
}
