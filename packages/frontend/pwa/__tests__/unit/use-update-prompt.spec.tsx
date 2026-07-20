// @vitest-environment jsdom
/**
 * @file use-update-prompt.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useUpdatePrompt}.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useUpdatePrompt } from "@/react/hooks/use-update-prompt/use-update-prompt.hook";
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

describe("useUpdatePrompt", () => {
  it("reads the initial state", () => {
    serviceRef.current = new MockPwaService({
      update: { isAvailable: true, isVisible: true },
    });
    const { result } = renderHook(() => useUpdatePrompt());
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.isVisible).toBe(true);
  });

  it("routes accept / dismiss to the service", () => {
    const service = new MockPwaService({ update: { isAvailable: true, isVisible: true } });
    serviceRef.current = service;
    const { result } = renderHook(() => useUpdatePrompt());

    act(() => result.current.accept());
    expect(service.acceptUpdateCalls).toBe(1);

    // Re-open the banner so `dismiss()` observably changes state.
    act(() => service.simulateUpdate({ isAvailable: true, isVisible: true }));
    act(() => result.current.dismiss());
    expect(service.dismissUpdateCalls).toBe(1);
    expect(result.current.isVisible).toBe(false);
  });
});
