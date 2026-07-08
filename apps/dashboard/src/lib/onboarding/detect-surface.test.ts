/**
 * @file detect-surface.test.ts
 * @module onboarding/detect-surface.test
 *
 * @description
 * Exhaustive unit tests for {@link detectSurface}. Every branch has a
 * dedicated fixture; the ordering of checks is validated by the
 * conflict cases (e.g. "desktop wins over PWA even when the URL says
 * `source=pwa`").
 *
 * We build a fake `Window`-shaped object per test rather than mutating
 * the global — surface detection is pure by design and shouldn't need
 * jsdom globals to test.
 */

import { describe, expect, it } from "vitest";

import { detectSurface } from "@/onboarding/detect-surface";

/**
 * Constructs a fake `Window`-shaped object. Passing `standalone: true`
 * makes `matchMedia('(display-mode: standalone)').matches` return true.
 * Passing `tauri: true` adds a `__TAURI__` property.
 */
function makeFakeWindow(options: { standalone?: boolean; tauri?: boolean } = {}): Window {
  const fake: Record<string, unknown> = {
    matchMedia: (query: string) => ({
      matches: Boolean(options.standalone) && query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  };

  if (options.tauri) {
    fake.__TAURI__ = {};
  }

  return fake as unknown as Window;
}

describe("detectSurface — desktop", () => {
  it("returns 'desktop' when window has __TAURI__", () => {
    expect(detectSurface({ window: makeFakeWindow({ tauri: true }) })).toBe("desktop");
  });

  it("returns 'desktop' even when the URL claims pwa (Tauri wins)", () => {
    // Desktop is the most specific signal; the URL might carry stale
    // markers from a previous browser session before install.
    const url = new URL("https://app.academorix.com/dashboard?source=pwa");

    expect(detectSurface({ window: makeFakeWindow({ tauri: true }), url })).toBe("desktop");
  });
});

describe("detectSurface — pwa-shortcut", () => {
  it("returns 'pwa-shortcut' for ?source=pwa-shortcut on the URL", () => {
    const url = new URL("https://app.academorix.com/athletes/create?source=pwa-shortcut");

    expect(detectSurface({ url })).toBe("pwa-shortcut");
  });

  it("prefers 'pwa-shortcut' over the display-mode fallback", () => {
    // A shortcut launch lands in standalone display mode too, so both
    // signals fire. The more specific one must win.
    const url = new URL("https://app.academorix.com/?source=pwa-shortcut");

    expect(detectSurface({ url, window: makeFakeWindow({ standalone: true }) })).toBe(
      "pwa-shortcut",
    );
  });
});

describe("detectSurface — pwa", () => {
  it("returns 'pwa' for ?source=pwa on the URL", () => {
    const url = new URL("https://app.academorix.com/dashboard?source=pwa");

    expect(detectSurface({ url })).toBe("pwa");
  });

  it("returns 'pwa' when display-mode is standalone (no query marker)", () => {
    const url = new URL("https://app.academorix.com/dashboard");

    expect(detectSurface({ url, window: makeFakeWindow({ standalone: true }) })).toBe("pwa");
  });

  it("returns 'pwa' when referrer starts with android-app://", () => {
    // Android Chrome sets this when the PWA launches from the home screen.
    const url = new URL("https://app.academorix.com/dashboard");

    expect(
      detectSurface({
        url,
        window: makeFakeWindow(),
        referrer: "android-app://com.android.chrome/",
      }),
    ).toBe("pwa");
  });
});

describe("detectSurface — deep-link", () => {
  it("returns 'deep-link' when ?deep= carries the academorix:// scheme", () => {
    const url = new URL("https://app.academorix.com/handle?deep=academorix://athletes/abc-123");

    expect(detectSurface({ url })).toBe("deep-link");
  });

  it("does NOT resolve 'deep-link' for other schemes", () => {
    // Guardrail: an attacker crafting a `?deep=javascript:…` URL must
    // NOT get the deep-link treatment. Fall through to `web`.
    const url = new URL("https://app.academorix.com/handle?deep=javascript:alert(1)");

    expect(detectSurface({ url })).toBe("web");
  });
});

describe("detectSurface — web (default)", () => {
  it("returns 'web' for a plain browser URL", () => {
    const url = new URL("https://app.academorix.com/dashboard");

    expect(detectSurface({ url, window: makeFakeWindow() })).toBe("web");
  });

  it("returns 'web' when no inputs are provided (SSR / Node)", () => {
    expect(detectSurface()).toBe("web");
  });

  it("returns 'web' when matchMedia throws (older browsers)", () => {
    // Some Firefox variants throw on unknown media queries. The
    // detector must never propagate that error.
    const throwingWindow = {
      matchMedia: () => {
        throw new Error("nope");
      },
    } as unknown as Window;
    const url = new URL("https://app.academorix.com/dashboard");

    expect(detectSurface({ url, window: throwingWindow })).toBe("web");
  });
});
