// @vitest-environment jsdom
/**
 * @file use-utm-params.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useUtmParams}.
 */

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useUtmParams } from "@/react/hooks/use-utm-params/use-utm-params.hook";

beforeEach(() => {
  // Reset the search string + sessionStorage before each test.
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("useUtmParams", () => {
  it("returns an empty object when no UTM params are present", () => {
    const { result } = renderHook(() => useUtmParams());
    expect(result.current).toEqual({});
  });

  it("parses the current URL search string", () => {
    window.history.replaceState({}, "", "/?utm_source=twitter&utm_campaign=launch");
    const { result } = renderHook(() => useUtmParams());
    expect(result.current).toEqual({ source: "twitter", campaign: "launch" });
  });

  it("caches the result in sessionStorage after first render", () => {
    window.history.replaceState({}, "", "/?utm_source=fb&utm_medium=cpc");
    renderHook(() => useUtmParams());
    const cached = window.sessionStorage.getItem("stackra:pwa:utm");
    expect(cached).toBeTruthy();
    expect(JSON.parse(cached as string)).toEqual({ source: "fb", medium: "cpc" });
  });

  it("reads from sessionStorage when present (SPA navigation)", () => {
    window.sessionStorage.setItem(
      "stackra:pwa:utm",
      JSON.stringify({ source: "email", campaign: "digest" }),
    );
    // Even though the current URL has no UTM params, we should
    // still see the persisted attribution.
    window.history.replaceState({}, "", "/dashboard");
    const { result } = renderHook(() => useUtmParams());
    expect(result.current).toEqual({ source: "email", campaign: "digest" });
  });
});
