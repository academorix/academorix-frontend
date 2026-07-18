/**
 * @file index.js
 * @module @stackra/ui/icons/gravity-ui
 * @description Standalone entry point for the Gravity UI icon set.
 *
 *   Exposes the raw Iconify-compatible JSON collection for consumers
 *   that need the icons **outside** of the `<Iconify />` component —
 *   for example, custom pickers, docs viewers, server-rendered SVG
 *   sprites, or scripted catalog generation.
 *
 *   ## Relationship to `@stackra/ui/icons/iconify`
 *
 *   The `Iconify` component already imports this JSON and registers it
 *   with Iconify's global collection at module load. Consumers who use
 *   `<Iconify />` do **not** need this subpath — the icons are already
 *   available by bare name (`<Iconify icon="star" />`).
 *
 *   Use this subpath when you want to:
 *   - Feed the icon list to a custom picker without pulling in React.
 *   - Register the collection with a different Iconify runtime
 *     (server-side, workers, non-React frameworks).
 *   - Generate an SVG sprite at build time.
 *
 *   ## Shape
 *
 *   The exported `icons` object is a valid Iconify JSON collection:
 *
 *   ```js
 *   {
 *     "prefix": "gravity-ui",
 *     "width": 16,
 *     "height": 16,
 *     "icons": { "star": { "body": "<path .../>" }, ... }
 *   }
 *   ```
 *
 *   `metadata` and `chars` are exported for API parity with Iconify's
 *   standard icon-set packages, but are currently empty because the
 *   Gravity UI set ships as a flat name → body map without categories
 *   or Unicode character mappings.
 *
 * @example
 * ```js
 * import { addCollection } from '@iconify/react';
 * import { icons } from '@stackra/ui/icons/gravity-ui';
 *
 * addCollection(icons);
 * ```
 *
 * @example
 * ```js
 * // Enumerate icon names for a picker UI
 * import { icons } from '@stackra/ui/icons/gravity-ui';
 *
 * const names = Object.keys(icons.icons).sort();
 * ```
 */

// Import assertions (`with { type: 'json' }`) are the ESM standard for
// JSON modules. Requires Node.js 22+ and bundlers that understand the
// spec (tsup ≥ 8, Vite 8, Rolldown, esbuild ≥ 0.20).
import icons from "./icons.json" with { type: "json" };

/**
 * Iconify JSON collection for the Gravity UI icon set.
 *
 * Pass directly to `addCollection()` from `@iconify/react` (or any
 * other Iconify runtime) to register every glyph in one call.
 *
 * @type {import('@iconify/types').IconifyJSON}
 */
export { icons };

/**
 * Reserved for the Iconify metadata block (category tags, aliases,
 * palette flags, etc.). Empty for Gravity UI — kept as an export so
 * this module matches the shape of Iconify's official icon packages
 * and downstream code can destructure `{ icons, metadata, chars }`
 * uniformly.
 *
 * @type {Record<string, unknown>}
 */
export const metadata = {};

/**
 * Reserved for Unicode character mappings used by icon fonts. Empty
 * for Gravity UI (SVG-only set); kept for shape parity with Iconify's
 * font-oriented icon packages.
 *
 * @type {Record<string, string>}
 */
export const chars = {};
