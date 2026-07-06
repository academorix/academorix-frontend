/**
 * @file index.ts
 * @module @academorix/pwa
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/pwa/manifest"} — `buildManifest(input)`
 *    + `WebAppManifest`, `ManifestIcon`, `ManifestShortcut`,
 *    `ManifestTranslation` types.
 *  - {@link "@academorix/pwa/workbox"} — `getRuntimeCaching(options)`
 *    + `RuntimeCachingRule` shape.
 *  - {@link "@academorix/pwa/security"} — `buildContentSecurityPolicy`,
 *    `getSecurityHeaders`, `DEFAULT_CSP_INPUT`,
 *    `DEFAULT_PERMISSIONS_POLICY`.
 *  - {@link "@academorix/pwa/vite"} — `getVitePwaOptions(input)`
 *    for `vite-plugin-pwa` consumers (dashboard).
 *  - {@link "@academorix/pwa/serwist"} — `getSerwistOptions(input)`
 *    for Serwist consumers (landing-page).
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/pwa.config.ts
 * import { buildManifest, getRuntimeCaching, getVitePwaOptions } from "@academorix/pwa";
 *
 * export const PWA_PLUGIN_OPTIONS = getVitePwaOptions({
 *   manifest: {
 *     name: "Academorix",
 *     shortName: "Academorix",
 *     description: "…",
 *     lang: "en-US",
 *     themeColor: "#0EA5E9",
 *     backgroundColor: "#FFFFFF",
 *     icons: MANIFEST_ICONS,
 *     shortcuts: MANIFEST_SHORTCUTS,
 *     translations: PWA_MANIFEST_TRANSLATIONS,
 *   },
 * });
 * ```
 */

export { buildManifest } from "./manifest";
export type {
  BuildManifestInput,
  ManifestIcon,
  ManifestShortcut,
  ManifestTranslation,
  WebAppManifest,
} from "./manifest";

export { getRuntimeCaching } from "./workbox";
export type { RuntimeCachingOptions, RuntimeCachingRule } from "./workbox";

export {
  buildContentSecurityPolicy,
  DEFAULT_CSP_INPUT,
  DEFAULT_PERMISSIONS_POLICY,
  getSecurityHeaders,
} from "./security";
export type { CspInput, FrameOptionsValue, SecurityHeadersOptions } from "./security";

export { DEFAULT_NAVIGATE_FALLBACK_DENYLIST, getVitePwaOptions } from "./vite";
export type { GetVitePwaOptionsInput } from "./vite";

export { getSerwistOptions } from "./serwist";
export type { GetSerwistOptionsInput } from "./serwist";
