/**
 * @fileoverview Vitest setup — imports shared DI mocking from @stackra/testing
 *   and stubs `window.matchMedia` for HeroUI Pro's Sheet primitive.
 *
 * jsdom does not ship `matchMedia`, and HeroUI Pro reads it at module
 * load in `sheet/use-scale-background.js`. We install a minimal stub
 * BEFORE the SUT modules import so component tests can render.
 *
 * @see @stackra/testing/setup
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
