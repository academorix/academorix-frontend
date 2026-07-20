/**
 * @file seo-config.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Site-wide SEO defaults.
 *
 *   Passed to `SeoModule.forRoot(config)` and used as the base layer
 *   in the descriptor merge. Route descriptors override outward-in,
 *   with `defaults` sitting at the outermost layer.
 */

import type { ISeoDescriptor } from "./seo-descriptor.interface";

/**
 * Site-wide SEO configuration.
 */
export interface ISeoConfig {
  /**
   * Default descriptor applied to every page (title template,
   * `og:site_name`, robots).
   */
  readonly defaults?: ISeoDescriptor;
  /**
   * Absolute site origin (e.g. `'https://acme.com'`). Relative
   * canonical / OG URLs are resolved against it.
   */
  readonly baseUrl?: string;
}
