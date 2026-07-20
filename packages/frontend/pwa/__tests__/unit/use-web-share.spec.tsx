// @vitest-environment jsdom
/**
 * @file use-web-share.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useWebShare}.
 */

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWebShare } from "@/react/hooks/use-web-share/use-web-share.hook";

afterEach(() => {
  cleanup();
  // Restore the pristine navigator shape after each test.
  vi.unstubAllGlobals();
});

describe("useWebShare", () => {
  it("reports isSupported=false when navigator.share is missing", () => {
    const { result } = renderHook(() => useWebShare());
    expect(result.current.isSupported).toBe(false);
    expect(typeof result.current.share).toBe("function");
  });

  it("reports isSupported=true when navigator.share is present", () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });
    const { result } = renderHook(() => useWebShare());
    expect(result.current.isSupported).toBe(true);
    // Restore afterward so other tests aren't affected.
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  });

  it("returns false when share() is called and API is unavailable", async () => {
    const { result } = renderHook(() => useWebShare());
    const ok = await result.current.share({ title: "t", url: "https://example.com" });
    expect(ok).toBe(false);
  });

  it("returns true when navigator.share resolves successfully", async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: spy, configurable: true });
    const { result } = renderHook(() => useWebShare());
    const ok = await result.current.share({ title: "t", url: "https://example.com" });
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalledWith({ title: "t", url: "https://example.com" });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("returns false when navigator.share throws (user cancel)", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(Object.assign(new Error("cancel"), { name: "AbortError" })),
      configurable: true,
    });
    const { result } = renderHook(() => useWebShare());
    const ok = await result.current.share({ url: "https://example.com" });
    expect(ok).toBe(false);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
});
