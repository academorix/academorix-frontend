/**
 * @file slugify.util.ts
 * @module @stackra/routing/core/utils
 * @description Slugify a string into a URL-safe segment.
 *
 *   Thin wrapper over `@stackra/support`'s `Str.slug(...)`. Reserved as
 *   a routing-scoped helper so consumers can `import { slugify } from
 *   '@stackra/routing'` without pulling the full support surface into
 *   an inline call.
 */

import { Str } from "@stackra/support";

/**
 * Convert a string into a URL-safe slug.
 *
 * Delegates to `Str.slug(...)` from `@stackra/support`. Kept here as a
 * routing-scoped alias so route-registration code — which typically
 * imports from `@stackra/routing` already — doesn't have to pull in
 * the full support surface for a single call.
 *
 * @param source - Input string.
 * @returns Slugified string (lowercase, kebab-case, unicode-normalised).
 *
 * @example
 * ```typescript
 * slugify('Hello, World!'); // → 'hello-world'
 * slugify('Café — Français'); // → 'cafe-francais'
 * ```
 */
export function slugify(source: string): string {
  return Str.slug(source);
}
