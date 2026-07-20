// @vitest-environment jsdom
/**
 * @file use-adaptive-loading.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useAdaptiveLoading}.
 */

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAdaptiveLoading } from "@/react/hooks/use-adaptive-loading/use-adaptive-loading.hook";

afterEach(() => {
  cleanup();
  // Detach any stubbed `connection` shape between tests.
  Object.defineProperty(navigator, "connection", {
    value: undefined,
    configurable: true,
  });
});

describe("useAdaptiveLoading", () => {
  it("reports the fallback shape when navigator.connection is missing", () => {
    const { result } = renderHook(() => useAdaptiveLoading());
    expect(result.current).toEqual({
      effectiveType: "unknown",
      saveData: false,
      downlink: null,
      rtt: null,
    });
  });

  it("reads effectiveType / saveData / downlink / rtt from navigator.connection", () => {
    Object.defineProperty(navigator, "connection", {
      value: {
        effectiveType: "3g",
        saveData: true,
        downlink: 1.5,
        rtt: 100,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });
    const { result } = renderHook(() => useAdaptiveLoading());
    expect(result.current).toEqual({
      effectiveType: "3g",
      saveData: true,
      downlink: 1.5,
      rtt: 100,
    });
  });

  it('reports effectiveType="unknown" when the reported value is unrecognised', () => {
    Object.defineProperty(navigator, "connection", {
      value: { effectiveType: "wifi" },
      configurable: true,
    });
    const { result } = renderHook(() => useAdaptiveLoading());
    expect(result.current.effectiveType).toBe("unknown");
  });
});
