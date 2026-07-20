/**
 * @file use-can-go-back.hook.spec.ts
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the can-go-back hook.
 */

import { describe, expect, it, afterEach } from "vitest";

import { useCanGoBack } from "@/react/hooks/use-can-go-back";

describe("useCanGoBack", () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    // Restore the window state between assertions so each test runs
    // in isolation.
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  it("returns false when window is undefined", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(useCanGoBack()).toBe(false);
  });

  it("returns true when window.history.length > 1", () => {
    (globalThis as { window?: unknown }).window = {
      history: { length: 3 },
    } as unknown as Window;
    expect(useCanGoBack()).toBe(true);
  });

  it("returns false when window.history.length === 1", () => {
    (globalThis as { window?: unknown }).window = {
      history: { length: 1 },
    } as unknown as Window;
    expect(useCanGoBack()).toBe(false);
  });
});
