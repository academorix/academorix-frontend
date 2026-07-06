/**
 * @file index.ts
 * @module @academorix/pwa/manifest
 *
 * @description
 * Public barrel for the manifest builder + types.
 */

export { buildManifest } from "./build-manifest.util";
export type { BuildManifestInput } from "./build-manifest.util";
export type {
  ManifestIcon,
  ManifestShortcut,
  ManifestTranslation,
  WebAppManifest,
} from "./manifest.type";
