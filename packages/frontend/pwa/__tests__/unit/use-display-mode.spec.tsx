// @vitest-environment jsdom
/**
 * @file use-display-mode.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useDisplayMode}.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDisplayMode } from "@/react/hooks/use-display-mode/use-display-mode.hook";
import { MockPwaService } from "@/testing/mock-pwa-service";

const { serviceRef } = vi.hoisted(() => ({
  serviceRef: { current: null as MockPwaService | null },
}));

vi.mock("@stackra/container/react", () => ({
  useInject: <T,>() => serviceRef.current as unknown as T,
}));

afterEach(() => {
  cleanup();
  serviceRef.current = null;
});

describe("useDisplayMode", () => {
  it("reads the initial mode", () => {
    serviceRef.current = new MockPwaService({ displayMode: "browser" });
    const { result } = renderHook(() => useDisplayMode());
    expect(result.current).toBe("browser");
  });

  it("re-renders when the mode flips", () => {
    const service = new MockPwaService({ displayMode: "browser" });
    serviceRef.current = service;
    const { result } = renderHook(() => useDisplayMode());
    act(() => service.simulateDisplayMode("standalone"));
    expect(result.current).toBe("standalone");
  });
});
