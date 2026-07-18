/**
 * @file twitter-tags.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Twitter card metadata (`twitter:*`).
 */

/**
 * Twitter card metadata. Rendered as `<meta name="twitter:...">`.
 */
export interface ITwitterTags {
  /** Card variant. */
  readonly card?: "summary" | "summary_large_image" | "app" | "player";
  /** `@site` handle. */
  readonly site?: string;
  /** `@creator` handle. */
  readonly creator?: string;
  /** Title. */
  readonly title?: string;
  /** Description. */
  readonly description?: string;
  /** Image URL. */
  readonly image?: string;
  /** Alt text for the image. */
  readonly imageAlt?: string;
}
