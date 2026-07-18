/**
 * @file vitest.setup.ts
 * @module @stackra/ui/__tests__
 * @description Test setup for @stackra/ui. Re-uses the shared
 *   `@stackra/testing/setup` afterEach cleanup and layers jsdom
 *   polyfills for the HeroUI Pro Sheet/Stepper primitives that read
 *   `window.matchMedia` at module load. jsdom doesn't ship
 *   `matchMedia`, so we stub the smallest surface HeroUI touches
 *   (matches, listener add/remove) — enough to let the modules load
 *   without throwing at import time.
 */
import "@stackra/testing/setup";

if (typeof globalThis.window !== "undefined" && !globalThis.window.matchMedia) {
  globalThis.window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
