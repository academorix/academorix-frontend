// @vitest-environment jsdom
/**
 * @file use-settings.spec.tsx
 * @module @stackra/settings/__tests__/unit
 * @description React hook behaviour tests for `useSettings`.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSettings } from "@/core/hooks/use-settings";
import { MockSettingsRegistry, MockSettingsService } from "@/testing";

// Route `useInject(SETTINGS_SERVICE)` to our mock. Any other token
// (SETTINGS_REGISTRY etc.) returns the registry — the test only
// exercises the settings-service pathway.
const { registryRef, serviceRef } = vi.hoisted(() => ({
  registryRef: { current: null as MockSettingsRegistry | null },
  serviceRef: { current: null as MockSettingsService | null },
}));

vi.mock("@stackra/container/react", () => ({
  useInject: (token: symbol) => {
    // Dispatch by token description — good enough for tests.
    const desc = token.toString();
    if (desc.includes("SETTINGS_SERVICE")) return serviceRef.current;
    if (desc.includes("SETTINGS_REGISTRY")) return registryRef.current;
    if (desc.includes("EVENT_EMITTER")) return null;
    return null;
  },
  useOptionalInject: () => null,
}));

afterEach(() => {
  cleanup();
  registryRef.current = null;
  serviceRef.current = null;
});

describe("useSettings (key form)", () => {
  beforeEach(() => {
    const registry = new MockSettingsRegistry();
    registry.registerFromSchema({
      key: "display",
      label: "Display",
      dto: null,
      fields: [
        {
          key: "compact",
          control: "toggle",
          label: "Compact",
          defaultValue: false,
        },
      ],
      groups: [],
    });
    registryRef.current = registry;
    serviceRef.current = new MockSettingsService(registry);
  });

  it("reads defaults on first render", () => {
    const { result } = renderHook(() => useSettings<{ compact: boolean }>("display"));
    expect(result.current.values.compact).toBe(false);
  });

  it("re-renders when the underlying store changes", () => {
    const { result } = renderHook(() => useSettings<{ compact: boolean }>("display"));
    act(() => {
      serviceRef.current!.setByKey("display", "compact", true);
    });
    expect(result.current.values.compact).toBe(true);
  });

  it("writes via `set` propagate to the store", () => {
    const { result } = renderHook(() => useSettings<{ compact: boolean }>("display"));
    act(() => {
      result.current.set("compact", true);
    });
    expect(serviceRef.current!.getByKey("display")).toEqual({ compact: true });
  });

  it("reset restores defaults", () => {
    const { result } = renderHook(() => useSettings<{ compact: boolean }>("display"));
    act(() => {
      result.current.set("compact", true);
    });
    expect(result.current.values.compact).toBe(true);
    act(() => {
      result.current.reset();
    });
    expect(result.current.values.compact).toBe(false);
  });
});
