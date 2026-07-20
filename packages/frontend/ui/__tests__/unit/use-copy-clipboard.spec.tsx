// @vitest-environment jsdom
/**
 * @file use-copy-clipboard.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for the `useCopyClipboard` hook —
 *   verifies the return shape, the successful copy path, the
 *   auto-reset timer, and the error propagation path when the
 *   underlying clipboard API rejects.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyClipboard } from "@/react/hooks/use-copy-clipboard/use-copy-clipboard.hook";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** Attach a stub clipboard on `navigator`. */
function stubClipboard(writeText: (t: string) => Promise<void>): void {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("useCopyClipboard", () => {
  it("returns { copy, copied, error } with initial values", () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyClipboard());
    expect(typeof result.current.copy).toBe("function");
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("writes to navigator.clipboard.writeText on copy()", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    const { result } = renderHook(() => useCopyClipboard());
    await act(async () => {
      await result.current.copy("hello");
    });

    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("flips `copied` to true on success", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyClipboard());

    await act(async () => {
      await result.current.copy("hi");
    });
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("auto-resets `copied` after the default delay (2000ms)", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyClipboard());

    await act(async () => {
      await result.current.copy("hi");
    });
    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("honours a custom `resetDelay`", async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyClipboard(500));

    await act(async () => {
      await result.current.copy("hi");
    });
    // Still on at 400ms; off at 500ms.
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.copied).toBe(false);
  });

  it("captures the rejection into `error` and does not flip `copied`", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useCopyClipboard());

    await act(async () => {
      await result.current.copy("hi");
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("denied");
  });

  it("normalises non-Error rejections into an Error instance", async () => {
    stubClipboard(vi.fn().mockRejectedValue("nope"));
    const { result } = renderHook(() => useCopyClipboard());

    await act(async () => {
      await result.current.copy("hi");
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to copy");
  });
});
