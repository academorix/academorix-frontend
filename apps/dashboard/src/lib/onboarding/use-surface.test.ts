/**
 * @file use-surface.test.ts
 * @module onboarding/use-surface.test
 *
 * @description
 * Tests for the `useSurface` cache contract: once resolved, the surface
 * value stays the same across every subsequent call — even if the URL
 * changes underneath (the tour system deliberately strips
 * `?source=pwa` after reading it, so subsequent calls MUST return the
 * cached "pwa" answer, not the newly-clean "web" answer).
 *
 * We use the `__resetSurfaceForTests` helper between cases so tests are
 * independent.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { __resetSurfaceForTests, resolveSurface, useSurface } from "@/lib/onboarding/use-surface";

/**
 * Captures + restores the original `window.location` descriptor so a
 * per-test URL mutation doesn't bleed into the next case.
 */
const originalLocation = Object.getOwnPropertyDescriptor(window, "location");

/** Redirects `window.location.href` to a fresh URL for the duration of one test. */
function stubHref(href: string): void {
  const url = new URL(href);

  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: url.href,
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
    },
  });
}

beforeEach(() => {
  __resetSurfaceForTests();
});

afterEach(() => {
  __resetSurfaceForTests();

  if (originalLocation) {
    Object.defineProperty(window, "location", originalLocation);
  }
});

describe("useSurface", () => {
  it("returns 'web' for a plain URL", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useSurface());

    expect(result.current).toBe("web");
  });

  it("returns 'pwa' when ?source=pwa is present", () => {
    stubHref("http://localhost:3000/dashboard?source=pwa");

    const { result } = renderHook(() => useSurface());

    expect(result.current).toBe("pwa");
  });

  it("caches across renders — the URL can change after the first read", () => {
    stubHref("http://localhost:3000/dashboard?source=pwa");

    const { result, rerender } = renderHook(() => useSurface());

    expect(result.current).toBe("pwa");

    // Tour system strips the query param after reading it. The hook
    // must keep returning the truthful "pwa" answer.
    stubHref("http://localhost:3000/dashboard");
    rerender();

    expect(result.current).toBe("pwa");
  });

  it("returns the same string reference across renders", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result, rerender } = renderHook(() => useSurface());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe("resolveSurface", () => {
  it("caches the same as useSurface — non-React callers share the value", () => {
    stubHref("http://localhost:3000/dashboard?source=pwa-shortcut");

    // Non-React caller first.
    expect(resolveSurface()).toBe("pwa-shortcut");

    // A subsequent hook call sees the same cached value.
    const { result } = renderHook(() => useSurface());

    expect(result.current).toBe("pwa-shortcut");
  });
});
