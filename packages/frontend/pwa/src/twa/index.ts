/**
 * @file index.ts
 * @module @stackra/pwa/twa
 * @description Public API for the Bubblewrap TWA config builder.
 *
 *   Emits the `twa-manifest.json` Bubblewrap consumes to bootstrap an
 *   Android APK/AAB from a PWA.
 */

export { getBubblewrapConfig } from "./utils";
export type { IBubblewrapConfigInput, ITwaManifest } from "./interfaces";
