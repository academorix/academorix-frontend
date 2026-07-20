// @vitest-environment jsdom
/**
 * @file use-install-prompt.spec.tsx
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link useInstallPrompt}.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "@/react/hooks/use-install-prompt/use-install-prompt.hook";
import { MockPwaService } from "@/testing/mock-pwa-service";

/** Hoisted reference the mocked useInject reads. */
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

describe("useInstallPrompt", () => {
  it("reads the initial snapshot", () => {
    serviceRef.current = new MockPwaService({
      install: { isSupported: true, isVisible: true, dismissCount: 0 },
    });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isVisible).toBe(true);
    expect(result.current.dismissCount).toBe(0);
  });

  it("re-renders when the install substate changes", () => {
    const service = new MockPwaService({ install: { isSupported: false, isVisible: false } });
    serviceRef.current = service;
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isSupported).toBe(false);

    act(() => {
      service.simulateInstall({ isSupported: true, isVisible: true });
    });
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isVisible).toBe(true);
  });

  it("routes promptInstall / dismiss / reset to the service", async () => {
    const service = new MockPwaService({});
    serviceRef.current = service;
    const { result } = renderHook(() => useInstallPrompt());

    await act(async () => {
      await result.current.promptInstall();
    });
    expect(service.promptInstallCalls).toBe(1);

    act(() => result.current.dismiss());
    expect(service.dismissCalls).toBe(1);
    expect(result.current.dismissCount).toBe(1);

    act(() => result.current.reset());
    expect(result.current.dismissCount).toBe(0);
  });
});
