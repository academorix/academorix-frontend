/**
 * @file robots-directive.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Robots directive union for the `<meta name="robots">` tag.
 */

/**
 * Robots directive. Either a raw string (`'index, follow'`) or a
 * structured object that the service serializes.
 */
export type IRobotsDirective =
  | string
  | {
      /** When `false`, emits `noindex`. */
      readonly index?: boolean;
      /** When `false`, emits `nofollow`. */
      readonly follow?: boolean;
      /** When `true`, emits `noarchive`. */
      readonly noarchive?: boolean;
      /** When `true`, emits `nosnippet`. */
      readonly nosnippet?: boolean;
      /** Max snippet length — emits `max-snippet:<N>`. */
      readonly maxSnippet?: number;
      /** Max image-preview size — emits `max-image-preview:<size>`. */
      readonly maxImagePreview?: "none" | "standard" | "large";
    };
