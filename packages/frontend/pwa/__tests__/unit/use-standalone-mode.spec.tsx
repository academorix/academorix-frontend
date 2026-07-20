// @vitest-environment jsdom
/**
 * @file use-standalone-mode.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useStandaloneMode}.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStandaloneMode } from "@/react/hooks/use-standalone-mode/use-standalone-mode.hook";
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

describe("useStandaloneMode", () => {
  it("returns false when the app is not standalone", () => {
    serviceRef.current = new MockPwaService({ standalone: false });
    const { result } = renderHook(() => useStandaloneMode());
    expect(result.current).toBe(false);
  });

  it("re-renders when standalone flips", () => {
    const service = new MockPwaService({ standalone: false });
    serviceRef.current = service;
    const { result } = renderHook(() => useStandaloneMode());
    expect(result.current).toBe(false);
    act(() => service.simulateStandalone(true));
    expect(result.current).toBe(true);
  });
});
