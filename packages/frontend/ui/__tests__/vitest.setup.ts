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

// React Aria Components (HeroUI's underlying primitive for Tabs,
// SharedElementTransition, ListBox, ...) calls `element.getAnimations()`
// in a layout effect to coordinate selection-indicator transitions.
// jsdom does not implement the Web Animations API, so we stub the
// method to return an empty array — no animations to await.
if (typeof globalThis.Element !== "undefined" && !("getAnimations" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: (): Animation[] => [],
    writable: true,
  });
}

// React Aria's `useSelectableCollection` builds `document.querySelector`
// strings via `CSS.escape(id)` when moving focus. jsdom exposes
// `window.CSS` on newer builds but does not always mirror it to the
// module-scope global that React Aria imports, so we install the
// smallest safe implementation of the two methods React Aria calls.
if (typeof globalThis.CSS === "undefined") {
  Object.defineProperty(globalThis, "CSS", {
    configurable: true,
    value: {
      // Minimal `CSS.escape` polyfill — sufficient for the ids
      // React Aria generates (alnum + a small punctuation set).
      escape(value: string): string {
        return String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
      },
      supports(): boolean {
        return false;
      },
    },
    writable: true,
  });
}
