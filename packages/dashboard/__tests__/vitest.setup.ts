/**
 * @file vitest.setup.ts
 * @module @stackra/dashboard/test
 * @description Vitest setup for `@stackra/dashboard`. Loads the shared
 *   `@stackra/testing/setup` (SWC transform, matchers) and installs a
 *   `matchMedia` polyfill for jsdom so React components that read it at
 *   render time don't blow up.
 */

import "@stackra/testing/setup";

// jsdom does not ship `window.matchMedia`; a few React components (and every
// third-party library that peeks at CSS media queries at render time) read
// it eagerly. Stub it out with a static "never matches" implementation —
// dashboard tests never assert on media-query behaviour.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      addListener: (): void => {},
      removeListener: (): void => {},
      dispatchEvent: (): boolean => false,
      onchange: null,
    }),
  });
}
