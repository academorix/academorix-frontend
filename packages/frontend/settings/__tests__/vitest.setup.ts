import "@stackra/testing/setup";

/**
 * jsdom polyfills for HeroUI compounds.
 *
 * HeroUI Pro's Sheet (loaded transitively when `@stackra/ui/react`
 * evaluates) touches `window.matchMedia` at import time. jsdom
 * doesn't ship it, so stub the smallest surface we need — the code
 * only reads `matches` + adds/removes listeners.
 */
if (typeof globalThis.window !== "undefined" && !globalThis.window.matchMedia) {
  globalThis.window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
