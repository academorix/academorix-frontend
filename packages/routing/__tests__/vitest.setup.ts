import "@stackra/testing/setup";

// ── jsdom polyfills for HeroUI ───────────────────────────────────
// HeroUI Pro's `<Sheet>` reads `window.matchMedia` at import time to
// pick a responsive scale mode. jsdom doesn't ship `matchMedia`, so
// we stub it here — the tests never assert on media-query behaviour.
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
