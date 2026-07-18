/**
 * @file vitest.setup.ts
 * @module @stackra/error/__tests__
 * @description Global test setup for the error package.
 *
 *   Wires the shared `@stackra/testing/setup` (afterEach cleanup for
 *   vi.useFakeTimers / vi.spyOn / vi.stubEnv), then adds jsdom
 *   polyfills that HeroUI Pro's Sheet component requires at module
 *   load (`window.matchMedia`). Rendering `DefaultErrorFallback` or
 *   `InlineErrorFallback` in tests transitively imports Sheet and
 *   would otherwise throw `TypeError: window.matchMedia is not a
 *   function` before a single React render happens.
 */

import "@stackra/testing/setup";

// jsdom does not implement `window.matchMedia` — HeroUI Pro's Sheet
// module reads it at import time. Register a permissive shim.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
