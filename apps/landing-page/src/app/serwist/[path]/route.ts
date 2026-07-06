/**
 * @file route.ts
 * @module app/serwist/[path]/route
 *
 * @description
 * Catch-all Route Handler that serves the compiled service worker
 * and its supporting chunks. This is the Turbopack-native pattern
 * that `@serwist/turbopack` uses instead of emitting `public/sw.js`
 * at build time (which `@serwist/next` did via webpack — incompatible
 * with Next 16's default Turbopack bundler).
 *
 * ## Routing
 *
 *   `GET /serwist/sw.js`             → compiled service worker.
 *   `GET /serwist/<worker-chunk>.js` → satellite chunks Serwist emits.
 *
 * The `[path]` segment is a catch-all — Serwist declares which
 * static paths to prerender via the `generateStaticParams` re-export
 * so every emitted file is baked as a static asset at build time
 * (`dynamic: "force-static"`). Effectively the same wire behaviour
 * as a file in `public/`, delivered through Next's route pipeline.
 *
 * ## Client registration
 *
 * The SW is registered client-side by `<SerwistProvider swUrl="/
 * serwist/sw.js">` mounted inside `src/app/providers.tsx`, NOT via
 * a `<script>` tag in the layout. `SerwistProvider` handles the
 * `navigator.serviceWorker.register()` call, listens for updates,
 * and exposes a `Serwist` instance on `window.serwist`.
 */

import { createSerwistRoute } from "@serwist/turbopack";

/**
 * Build fingerprint reserved for a future offline shell entry.
 * Vercel injects `VERCEL_GIT_COMMIT_SHA` on every deploy; add
 * `additionalPrecacheEntries` back to `createSerwistRoute` if we
 * decide to precache locale-aware offline pages.
 */
// const revision =
//   process.env.VERCEL_GIT_COMMIT_SHA?.trim() ??
//   process.env.GITHUB_SHA?.trim() ??
//   crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    /**
     * Absolute path (relative to the project root) to the service
     * worker source. Serwist reads this file and compiles it with
     * esbuild every time it needs to serve the SW.
     */
    swSrc: "src/app/sw.ts",

    /**
     * Use the native `esbuild` binary rather than the WASM build.
     * Faster on macOS + Linux CI; Serwist auto-detects Windows and
     * flips this back to `esbuild-wasm` transparently.
     */
    useNativeEsbuild: true,
  },
);
