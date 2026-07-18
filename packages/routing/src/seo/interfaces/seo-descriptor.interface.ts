/**
 * @file seo-descriptor.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description The per-route SEO descriptor.
 *
 *   Routes attach a descriptor via `page.seo` (or the layout /
 *   defineRoute equivalents). `SeoService` walks the match chain,
 *   resolves function-valued descriptors via `resolveValue`, and
 *   merges the descriptors inside → out.
 */

import type { IAlternateLink } from "./alternate-link.interface";
import type { IJsonLd } from "./json-ld.interface";
import type { IOpenGraphTags } from "./open-graph-tags.interface";
import type { IRobotsDirective } from "./robots-directive.interface";
import type { ITwitterTags } from "./twitter-tags.interface";

/**
 * The per-route SEO descriptor.
 *
 * Every field is optional; missing fields inherit from ancestor routes
 * and finally from the site-wide config defaults.
 */
export interface ISeoDescriptor {
  /** Page title. Combined with `titleTemplate` if present. */
  readonly title?: string;
  /**
   * Template for the title (e.g. `'%s | Acme'`). When a route sets
   * `title`, the resolved `<title>` becomes
   * `template.replace('%s', title)`.
   */
  readonly titleTemplate?: string;
  /** Meta description. */
  readonly description?: string;
  /** Canonical URL — `<link rel="canonical">`. */
  readonly canonical?: string;
  /** Robots directive. */
  readonly robots?: IRobotsDirective;
  /** Keywords — joined into one `<meta name="keywords">`. */
  readonly keywords?: readonly string[];
  /** OpenGraph tags. */
  readonly openGraph?: IOpenGraphTags;
  /** Twitter card tags. */
  readonly twitter?: ITwitterTags;
  /**
   * Schema.org JSON-LD — one document or many. Accumulates down the
   * match chain (children append, they don't replace).
   */
  readonly jsonLd?: IJsonLd | readonly IJsonLd[];
  /** Alternate-language links. */
  readonly alternates?: readonly IAlternateLink[];
  /** Arbitrary extra `<meta>` tags. */
  readonly meta?: readonly Readonly<Record<string, string>>[];
}
