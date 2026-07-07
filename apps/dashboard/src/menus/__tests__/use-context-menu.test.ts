/**
 * @file use-context-menu.test.ts
 * @module menus/__tests__/use-context-menu.test
 *
 * @description
 * Unit tests for the `useContextMenu` hook. The hook is behavioural, not
 * visual — it exposes state that a renderer consumes — so these tests
 * exercise the listener wiring, the selective `preventDefault` behaviour,
 * the viewport clamp, and the Escape-to-close side effect.
 *
 * `renderHook` from `@testing-library/react` runs the hook inside a real
 * React tree with an internal state store, which is the closest we can get
 * to a real component consumer without mounting a full render tree.
 */

import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { MenuCommand } from "@/menus/command.types";

import { clampToViewport, useContextMenu } from "@/menus/use-context-menu";

/** Factory — every case shares this stub command. */
function makeCommand(overrides: Partial<MenuCommand> = {}): MenuCommand {
  return {
    id: overrides.id ?? "test.command",
    labelKey: overrides.labelKey ?? "menu.test",
    category: overrides.category ?? "help",
    execute: overrides.execute ?? ((): void => undefined),
    ...overrides,
  };
}

/**
 * Attaches a real `<div>` to `document.body` and returns a ref pointing at it
 * plus a cleanup callback. jsdom does not automatically clean up between
 * cases; `renderHook`'s unmount + the returned `cleanup()` keeps the DOM
 * pristine.
 */
function mountAnchor(): {
  ref: React.RefObject<HTMLDivElement>;
  cleanup: () => void;
} {
  const element = document.createElement("div");

  document.body.appendChild(element);

  const ref = createRef<HTMLDivElement>();

  Object.defineProperty(ref, "current", { value: element, configurable: true });

  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    cleanup: (): void => {
      document.body.removeChild(element);
    },
  };
}

/** Dispatches a `contextmenu` MouseEvent on `element` with the given coords. */
function dispatchContextMenu(
  element: HTMLElement,
  { clientX, clientY }: { clientX: number; clientY: number },
): MouseEvent {
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });

  element.dispatchEvent(event);

  return event;
}

// ---------------------------------------------------------------------------
// clampToViewport
// ---------------------------------------------------------------------------

describe("clampToViewport", () => {
  it("returns the original coordinates when the menu fits", () => {
    const position = clampToViewport(100, 100, { width: 1440, height: 900 });

    expect(position).toEqual({ x: 100, y: 100 });
  });

  it("clamps X when the menu would fall off the right edge", () => {
    const position = clampToViewport(1400, 100, { width: 1440, height: 900 });

    // 1440 - 280 (max menu width) = 1160.
    expect(position.x).toBe(1160);
  });

  it("clamps Y when the menu would fall off the bottom edge", () => {
    const position = clampToViewport(100, 880, { width: 1440, height: 900 });

    // 900 - 480 (max menu height) = 420.
    expect(position.y).toBe(420);
  });

  it("clamps negative coordinates to zero (defensive)", () => {
    const position = clampToViewport(-10, -20, { width: 1440, height: 900 });

    expect(position).toEqual({ x: 0, y: 0 });
  });

  it("handles a viewport smaller than the menu without going negative", () => {
    const position = clampToViewport(500, 500, { width: 200, height: 300 });

    expect(position.x).toBe(0);
    expect(position.y).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// useContextMenu — behaviour
// ---------------------------------------------------------------------------

describe("useContextMenu", () => {
  it("opens the menu on right-click when items() returns a non-empty array", () => {
    const { ref, cleanup } = mountAnchor();
    const command = makeCommand();
    const { result, unmount } = renderHook(() => useContextMenu(ref, { items: () => [command] }));

    expect(result.current.isOpen).toBe(false);

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 42, clientY: 128 });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.position).toEqual({ x: 42, y: 128 });
    expect(result.current.items).toEqual([command]);
    expect(result.current.context.source).toBe("context-menu");

    unmount();
    cleanup();
  });

  it("does NOT preventDefault when items() returns an empty array", () => {
    const { ref, cleanup } = mountAnchor();
    const { result, unmount } = renderHook(() => useContextMenu(ref, { items: () => [] }));

    let event: MouseEvent | undefined;

    act(() => {
      event = dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(event?.defaultPrevented).toBe(false);
    expect(result.current.isOpen).toBe(false);

    unmount();
    cleanup();
  });

  it("preventDefaults when items() returns a non-empty array", () => {
    const { ref, cleanup } = mountAnchor();
    const { unmount } = renderHook(() => useContextMenu(ref, { items: () => [makeCommand()] }));

    let event: MouseEvent | undefined;

    act(() => {
      event = dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(event?.defaultPrevented).toBe(true);

    unmount();
    cleanup();
  });

  it("clamps position to the viewport", () => {
    const { ref, cleanup } = mountAnchor();
    const { result, unmount } = renderHook(() =>
      useContextMenu(ref, { items: () => [makeCommand()] }),
    );

    // jsdom's window.innerWidth is 1024 by default.
    act(() => {
      dispatchContextMenu(ref.current, { clientX: 2000, clientY: 2000 });
    });

    expect(result.current.position.x).toBeLessThanOrEqual(1024);
    expect(result.current.position.y).toBeLessThanOrEqual(768);

    unmount();
    cleanup();
  });

  it("closes the menu on Escape keydown", () => {
    const { ref, cleanup } = mountAnchor();
    const { result, unmount } = renderHook(() =>
      useContextMenu(ref, { items: () => [makeCommand()] }),
    );

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.isOpen).toBe(false);

    unmount();
    cleanup();
  });

  it("skips attachment when disabled=true", () => {
    const { ref, cleanup } = mountAnchor();
    const items = vi.fn(() => [makeCommand()]);
    const { unmount } = renderHook(() => useContextMenu(ref, { items, disabled: true }));

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(items).not.toHaveBeenCalled();

    unmount();
    cleanup();
  });

  it("invokes onOpen with the resolved items", () => {
    const { ref, cleanup } = mountAnchor();
    const command = makeCommand({ id: "unique" });
    const onOpen = vi.fn();
    const { unmount } = renderHook(() => useContextMenu(ref, { items: () => [command], onOpen }));

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0]?.[1]).toEqual([command]);

    unmount();
    cleanup();
  });

  it("merges buildContext output into the returned context", () => {
    const { ref, cleanup } = mountAnchor();
    const { result, unmount } = renderHook(() =>
      useContextMenu(ref, {
        items: () => [makeCommand()],
        buildContext: (event) => ({ target: event.target as HTMLElement }),
      }),
    );

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(result.current.context.source).toBe("context-menu");
    expect(result.current.context.target).toBe(ref.current);

    unmount();
    cleanup();
  });

  it("removes the listener on unmount (no leak into subsequent tests)", () => {
    const { ref, cleanup } = mountAnchor();
    const items = vi.fn(() => [makeCommand()]);
    const { unmount } = renderHook(() => useContextMenu(ref, { items }));

    unmount();

    act(() => {
      dispatchContextMenu(ref.current, { clientX: 10, clientY: 10 });
    });

    expect(items).not.toHaveBeenCalled();

    cleanup();
  });

  it("supports programmatic open() and close()", () => {
    const { ref, cleanup } = mountAnchor();
    const command = makeCommand();
    const { result, unmount } = renderHook(() => useContextMenu(ref, { items: () => [] }));

    act(() => {
      result.current.open({ x: 50, y: 60 }, [command]);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.items).toEqual([command]);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.items).toEqual([]);

    unmount();
    cleanup();
  });
});
