/**
 * @file use-context-menu.ts
 * @module menus/use-context-menu
 *
 * @description
 * React hook that wires a `contextmenu` handler onto any DOM element and
 * surfaces `{open, close, isOpen, position}` state a renderer can consume.
 * Documented in menus module
 *
 * ## Contract
 *
 *   const anchor = useRef<HTMLElement>(null);
 *   const menu = useContextMenu(anchor, {
 *     items: (event) => [{ id: "copy", labelKey: "menu.copy", … }],
 *   });
 *   // menu.isOpen, menu.position, menu.open(), menu.close()
 *
 * The hook DOES NOT render anything — it exposes state; a separate
 * `<ContextMenu {...menu} />` component consumes it. The split lets a caller
 * open the menu **programmatically** (e.g. from a long-press on mobile) with
 * the exact same rendering pipeline as a real right-click, and gives us a
 * pure-behaviour hook that is trivial to unit test in isolation.
 *
 * ## Behaviour details
 *
 *   1. **Selective suppression.** `event.preventDefault()` is only called
 *      when the resolved `items(event)` array is non-empty. Right-clicking
 *      an empty area still surfaces the browser's native menu (helpful for
 *      "Inspect Element" during development).
 *   2. **Coordinates.** The reported position is clamped to the viewport
 *      so a right-click near the bottom-right corner does not spawn a menu
 *      that falls off-screen.
 *   3. **Keyboard.**
 *        - Escape closes.
 *        - Arrow keys navigate items (delegated to the renderer — the hook
 *          exposes `isOpen`; the renderer wraps items in a
 *          `react-aria-components` Menu which owns arrow navigation).
 *        - Enter activates the focused item (also renderer-owned via
 *          Menu's default behaviour).
 *        - Tab traps focus (renderer owns via Popover/Modal).
 *   4. **Cleanup.** Every listener is removed on unmount / anchor swap.
 *
 * @see menus module
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MenuCommand, MenuContext } from "@/lib/menus/command.types";
import type { RefObject } from "react";

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

/** Coordinates of the open context menu, in viewport-relative pixels. */
export interface ContextMenuPosition {
  /** Horizontal offset from the viewport's left edge. */
  x: number;
  /** Vertical offset from the viewport's top edge. */
  y: number;
}

/**
 * Options accepted by {@link useContextMenu}. Kept as a discrete type so a
 * consumer can hoist it into a config object when composing multiple menus
 * per page.
 */
export interface UseContextMenuOptions {
  /**
   * Function that returns the command list for a given pointer event. Runs
   * on every `contextmenu` fire. Returning an empty array is the "opt out"
   * signal — the hook will not `preventDefault()`, so the browser context
   * menu shows through.
   */
  items: (event: MouseEvent) => readonly MenuCommand[];

  /**
   * Optional per-open context. If provided, receives the pointer event so
   * consumers can splice in target-specific metadata (`{selection: [row]}`).
   * The return value is stored on the hook state and passed to renderers
   * verbatim.
   */
  buildContext?: (event: MouseEvent) => MenuContext;

  /**
   * When true, the hook skips the `contextmenu` attachment entirely — used
   * by consumers that gate the menu behind a feature flag or a permission
   * without unmounting the hook. Defaults to false.
   */
  disabled?: boolean;

  /**
   * Optional callback fired every time the menu opens. Consumers use this
   * to emit analytics events. Runs synchronously inside the `contextmenu`
   * handler so the caller can `event.preventDefault` if it wants to (the
   * hook already handles the common case).
   */
  onOpen?: (event: MouseEvent, items: readonly MenuCommand[]) => void;
}

/** The value returned by {@link useContextMenu}. */
export interface UseContextMenuReturn {
  /** Whether the menu is currently rendered. */
  isOpen: boolean;
  /** Viewport-clamped position of the open menu. Zero-valued when closed. */
  position: ContextMenuPosition;
  /**
   * The items to render for the current open cycle. Frozen at open time so
   * `isDisabled(ctx)` results don't flicker mid-animation.
   */
  items: readonly MenuCommand[];
  /** Snapshot of the context for the current open cycle. */
  context: MenuContext;
  /**
   * Programmatic open (e.g. from a long-press or a bulk-action toolbar).
   * `position` is clamped to the viewport by the hook.
   */
  open: (position: ContextMenuPosition, items: readonly MenuCommand[], ctx?: MenuContext) => void;
  /** Programmatic close. */
  close: () => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/** Default position when the menu is closed. Kept as a constant to avoid re-allocation. */
const CLOSED_POSITION: ContextMenuPosition = { x: 0, y: 0 };

/** Estimated maximum menu dimensions used for viewport clamping. Real menus
 *  measure themselves post-mount and can extend beyond this — the clamp is a
 *  "reasonable initial guess" so the menu never spawns fully off-screen. */
const MENU_MAX_WIDTH = 280;
const MENU_MAX_HEIGHT = 480;

/**
 * Clamps a pointer position to the viewport so the menu never spawns off
 * the screen. Kept as a pure helper (exported for tests).
 *
 * @param x - The raw clientX from the pointer event.
 * @param y - The raw clientY from the pointer event.
 * @param viewport - `{width, height}` — usually `window.innerWidth / .innerHeight`.
 */
export function clampToViewport(
  x: number,
  y: number,
  viewport: { width: number; height: number },
): ContextMenuPosition {
  // Reserve enough room for the menu at each edge. Users generally right-
  // click somewhere in the center of a row; the clamp only ever fires when
  // the click lands near the viewport boundary.
  const clampedX = Math.min(Math.max(x, 0), Math.max(viewport.width - MENU_MAX_WIDTH, 0));
  const clampedY = Math.min(Math.max(y, 0), Math.max(viewport.height - MENU_MAX_HEIGHT, 0));

  return { x: clampedX, y: clampedY };
}

/**
 * Attaches a `contextmenu` listener to `anchor.current` and returns state a
 * renderer can consume.
 *
 * @param anchor - Ref pointing at the DOM element that should intercept
 *                 right-clicks. Passing a ref (instead of the element) so
 *                 the hook works with any React tree without a re-render on
 *                 anchor swap.
 * @param options - See {@link UseContextMenuOptions}.
 */
export function useContextMenu(
  anchor: RefObject<HTMLElement | null>,
  options: UseContextMenuOptions,
): UseContextMenuReturn {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>(CLOSED_POSITION);
  const [items, setItems] = useState<readonly MenuCommand[]>([]);
  const [context, setContext] = useState<MenuContext>({});

  // Latest option refs — stored in a ref so the `useEffect` below doesn't
  // re-attach the listener every render. The listener reads the current
  // options via `optionsRef.current` at each pointer event.
  const optionsRef = useRef(options);

  optionsRef.current = options;

  const close = useCallback((): void => {
    setOpen(false);
    setPosition(CLOSED_POSITION);
    setItems([]);
    setContext({});
  }, []);

  const open = useCallback(
    (
      openAt: ContextMenuPosition,
      openItems: readonly MenuCommand[],
      openContext: MenuContext = {},
    ): void => {
      // Even programmatic opens are clamped so a `open({x: -99, y: -99})`
      // from a stray unit test does not blow up the renderer.
      const viewport = {
        width: typeof window === "undefined" ? 1024 : window.innerWidth,
        height: typeof window === "undefined" ? 768 : window.innerHeight,
      };

      setPosition(clampToViewport(openAt.x, openAt.y, viewport));
      setItems(openItems);
      setContext(openContext);
      setOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (options.disabled) {
      return undefined;
    }

    const element = anchor.current;

    if (!element) {
      return undefined;
    }

    const handleContextMenu = (event: MouseEvent): void => {
      const current = optionsRef.current;
      const resolved = current.items(event);

      // Selective suppression — with zero items, we let the browser show its
      // native menu (so "Inspect Element" during dev still works).
      if (resolved.length === 0) {
        return;
      }

      event.preventDefault();

      // Fire onOpen synchronously so analytics observers see the event in
      // the same tick as the DOM change.
      current.onOpen?.(event, resolved);

      const built = current.buildContext ? current.buildContext(event) : {};

      open({ x: event.clientX, y: event.clientY }, resolved, {
        ...built,
        source: "context-menu",
      });
    };

    element.addEventListener("contextmenu", handleContextMenu);

    return (): void => {
      element.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [anchor, options.disabled, open]);

  // Escape-to-close, wired at the document level. React Aria's Menu component
  // does its own Escape handling when focused inside the popover — we install
  // a fallback so an unfocused open state (e.g. animation in progress) still
  // dismisses on Escape.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  // Return a stable object per render — memoisation keeps the identity even
  // if state hasn't changed since the last render.
  return useMemo<UseContextMenuReturn>(
    () => ({ isOpen, position, items, context, open, close }),
    [isOpen, position, items, context, open, close],
  );
}
