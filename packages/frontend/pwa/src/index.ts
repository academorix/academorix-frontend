/**
 * @file index.ts
 * @module @stackra/pwa
 * @description Root barrel. Prefer the subpath entries:
 *   - `@stackra/pwa` (core DI + services + tokens)
 *   - `@stackra/pwa/react` (web hooks + components)
 *   - `@stackra/pwa/manifest` (Web App Manifest builder)
 *   - `@stackra/pwa/workbox` (curated runtime-caching rules)
 *   - `@stackra/pwa/vite` (vite-plugin-pwa + assets-generator builders)
 *   - `@stackra/pwa/twa` (Bubblewrap Android TWA config builder)
 *   - `@stackra/pwa/testing` (mocks + factories)
 *
 *   Push notifications, in-app centres, and native push tokens live
 *   in `@stackra/notifications`.
 */

export * from "./core";
