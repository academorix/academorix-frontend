// @vitest-environment jsdom
/**
 * @file use-visibility-state.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useVisibilityState}.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useVisibilityState } from "@/react/hooks/use-visibility-state/use-visibility-state.hook";

afterEach(cleanup);

describe("useVisibilityState", () => {
  it("returns the initial document.visibilityState", () => {
    const { result } = renderHook(() => useVisibilityState());
    // jsdom reports 'visible' by default.
    expect(result.current).toBe("visible");
  });

  it("re-renders on visibilitychange", () => {
    const { result } = renderHook(() => useVisibilityState());
    expect(result.current).toBe("visible");
    act(() => {
      // jsdom exposes `visibilityState` as a read-only getter; we
      // stub the getter and dispatch the event.
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe("hidden");
    // Restore to avoid bleeding across tests.
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });
});
