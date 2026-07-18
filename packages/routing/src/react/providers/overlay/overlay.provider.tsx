/**
 * @file overlay.provider.tsx
 * @module @stackra/routing/react/providers/overlay
 * @description React provider for the overlay stack state.
 *
 *   Manages the ordered list of currently-open overlay routes
 *   (dialog / drawer / sheet). `<OverlayOutlet>` reads the stack
 *   to render the topmost overlay; consumers may open / close
 *   overlays imperatively via `useContext(OverlayContext)`.
 */

import { useCallback, useMemo, useState, type PropsWithChildren, type ReactElement } from "react";

import { OverlayContext } from "@/react/contexts";
import type { IOverlayContext, IOverlayEntry } from "@/react/contexts";

/**
 * Provide overlay-stack state to descendants.
 *
 * @param props - `PropsWithChildren` — the wrapped subtree.
 * @returns The overlay provider element.
 *
 * @example
 * ```typescript
 * <OverlayProvider>
 *   <AppShell />
 *   <OverlayOutlet />
 * </OverlayProvider>
 * ```
 */
export function OverlayProvider(props: PropsWithChildren): ReactElement {
  const [stack, setStack] = useState<readonly IOverlayEntry[]>([]);

  const openOverlay = useCallback((entry: IOverlayEntry) => {
    // Push a new entry — the topmost open overlay renders in
    // `<OverlayOutlet>`. Duplicate ids are permitted; the ring
    // trims naturally on close.
    setStack((prev) => [...prev, entry]);
  }, []);

  const closeOverlay = useCallback(() => {
    // Pop the top of the stack. Bail early on an empty stack so
    // consumers can call `closeOverlay()` unconditionally.
    setStack((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  }, []);

  const value = useMemo<IOverlayContext>(
    () => ({
      stack,
      activeId: stack.length > 0 ? stack[stack.length - 1].id : null,
      openOverlay,
      closeOverlay,
    }),
    [stack, openOverlay, closeOverlay],
  );

  return <OverlayContext.Provider value={value}>{props.children}</OverlayContext.Provider>;
}
