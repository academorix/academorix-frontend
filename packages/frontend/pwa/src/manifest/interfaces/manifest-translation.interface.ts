/**
 * @file manifest-translation.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Per-locale translated fields.
 *
 *   W3C `translations` draft. Chromium 100+, Edge 100+, Samsung
 *   Internet 16+, and Android all read `translations`; browsers that
 *   don't fall back to the top-level fields.
 *
 *   The shape is a permissive `Partial<Pick<...>>` covering every
 *   field the W3C spec allows to be localised — name, short_name,
 *   description, lang, dir, categories, keywords, shortcuts, and
 *   screenshots — plus a `[key: string]: unknown` tail so callers can
 *   add plugin-specific translated fields without a cast.
 */

import type { IWebAppManifest } from "./web-app-manifest.interface";

/**
 * Per-locale translated manifest fields.
 *
 * Keyed by BCP-47 tag (`'ar-EG'`, `'en-US'`, ...) inside the
 * caller's translations map.
 */
export type IManifestTranslation = Partial<
  Pick<
    IWebAppManifest,
    | "name"
    | "short_name"
    | "description"
    | "lang"
    | "dir"
    | "categories"
    | "keywords"
    | "shortcuts"
    | "screenshots"
  >
> & {
  /** Free-form extensions per locale — plugin-specific translations. */
  readonly [key: string]: unknown;
};
