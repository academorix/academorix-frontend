/**
 * @file sw.ts
 * @module app/sw
 *
 * @description
 * Service worker source for the marketing app. Serwist (via
 * `@serwist/next`) compiles this file into `public/sw.js` at build
 * time — DO NOT import it from anywhere in the client bundle. Next
 * ignores the file as a route (no `page`/`layout`/`route`/etc.
 * suffix) so it lives under `src/app/` purely for co-location with
 * the routes it caches.
 *
 * ## Runtime caching
 *
 * `defaultCache` from `@serwist/next/worker` covers the sensible
 * defaults for Next.js apps: precached build assets, StaleWhile-
 * Revalidate for Google Fonts + images, and NetworkFirst for HTML
 * navigations. The marketing site is fully static from the browser's
 * perspective, so no additional strategies are needed today.
 *
 * ## Update flow
 *
 * `skipWaiting: true` + `clientsClaim: true` gives us immediate SW
 * activation once a new build lands. Combined with Next's cache-
 * busted asset URLs, users get the latest content on their next
 * navigation without a manual refresh prompt. The install prompt
 * component (`src/components/pwa/install-prompt.tsx`) does not need
 * to coordinate with the SW because there's no user-driven update
 * cycle — every new build is a hard update.
 *
 * ## Type surface
 *
 * The worker runs in a `ServiceWorkerGlobalScope`, not a `Window`.
 * We enable the `WebWorker` lib via the top triple-slash reference
 * plus the sibling `tsconfig.sw.json`, and re-declare `self` so the
 * downstream API calls (`self.__SW_MANIFEST`, `self.skipWaiting`) all
 * type-check.
 */

/// <reference lib="WebWorker" />

import { defaultCache } from "@serwist/turbopack/worker";
import { Serwist } from "serwist";

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    /**
     * Injected by Serwist at build time — the flat list of every
     * precached asset (JS/CSS/HTML) with its content-hash revision.
     */
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * The Serwist instance for this worker. All configuration is
 * declarative — no imperative fetch handlers below.
 */
const serwist = new Serwist({
  /** Every asset Next emitted into `.next/static/*`. */
  precacheEntries: self.__SW_MANIFEST,

  /**
   * Activate the new SW as soon as it finishes installing. Combined
   * with `clientsClaim`, this ensures the fresh build takes control
   * of open tabs on the visitor's next navigation.
   */
  skipWaiting: true,

  /** Fresh SW immediately controls every open tab. */
  clientsClaim: true,

  /**
   * Preload navigation responses in parallel with SW startup so
   * cold offline loads still feel snappy.
   */
  navigationPreload: true,

  /**
   * Serwist's Next-aware default caching strategies. Covers Google
   * Fonts, images, and Next's static assets out of the box.
   */
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
