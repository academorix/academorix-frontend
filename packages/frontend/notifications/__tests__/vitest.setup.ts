/**
 * @file vitest.setup.ts
 * @module @stackra/notifications/__tests__
 * @description Vitest setup file — imports `reflect-metadata` so the
 *   DI container's decorator machinery works from the very first
 *   `Injectable()` in the suite, plus a jsdom polyfill for
 *   `window.matchMedia` that HeroUI Pro's Sheet primitive reads at
 *   module load. jsdom doesn't ship `matchMedia`, so we stub the
 *   smallest surface HeroUI touches — enough to let the modules
 *   load without throwing at import time.
 */

import "reflect-metadata";

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
