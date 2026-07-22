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

// React Aria Components (HeroUI's underlying primitive for
// ToggleButtonGroup, Tabs, ListBox, ...) calls
// `element.getAnimations()` in layout effects for selection
// transitions. jsdom does not implement the Web Animations API, so
// we stub the method to return an empty array — no animations to
// await.
if (typeof globalThis.Element !== "undefined" && !("getAnimations" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: (): Animation[] => [],
    writable: true,
  });
}

// React Aria's `useSelectableCollection` (and cousins) builds
// `document.querySelector` strings via `CSS.escape(id)` when
// moving focus among items. jsdom does not always expose `CSS` at
// the module scope, so we install the smallest safe polyfill.
if (typeof globalThis.CSS === "undefined") {
  Object.defineProperty(globalThis, "CSS", {
    configurable: true,
    value: {
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
