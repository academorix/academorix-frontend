/**
 * @file use-draggable.hook.ts
 * @module @stackra/kbd/hooks/use-draggable
 * @description useDraggable — pointer-driven drag with optional
 *   persisted position.
 *
 *   Lightweight drag implementation that:
 *   - Reads / writes an `IStorage` instance from `@stackra/storage`
 *     when given a `storageKey`.
 *   - Clamps to the viewport so the dragged element can never leave.
 *   - Uses pointer events (works for mouse + touch).
 *   - Returns `{ x, y, dragHandleProps, isDragging, reset }`.
 *
 *   No third-party dependency; the storage layer is optional — if
 *   the container hasn't mounted `StorageModule.forRoot`, the hook
 *   still works, it just doesn't persist position across reloads.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useOptionalInject } from "@stackra/container/react";
import { STORAGE_MANAGER, type IStorageManager } from "@stackra/contracts";

import type { UseDraggableOptions } from "../../interfaces/use-draggable-options.interface";
import type { UseDraggableResult } from "../../interfaces/use-draggable-result.interface";

/**
 * Name of the `IStorage` instance the hook writes to. Consumers can
 * mount a different driver on this instance name — e.g. `sessionStorage`
 * for a per-session position — and this hook picks it up unchanged.
 */
const STORAGE_INSTANCE = "localStorage";

/**
 * Drag state with optional storage-backed persistence.
 *
 * @param options - Options bag including the storage key + starting
 *   coordinates + enabled flag.
 * @returns The current position, drag handle props, `isDragging` flag,
 *   and a `reset()` helper.
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableResult {
  const { storageKey, initialX = 0, initialY = 0, enabled = true } = options;
  // The storage manager is optional — the hook still functions in a
  // headless test harness (or SSR pre-hydration) that hasn't mounted
  // `StorageModule.forRoot`. It just won't persist across reloads.
  const storage = useOptionalInject<IStorageManager>(STORAGE_MANAGER);

  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: initialX,
    y: initialY,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);

  // Hydrate the saved position async. Runs once on mount (per
  // `storageKey`) — the initial state is `{ initialX, initialY }`
  // until the storage read resolves, at which point the position
  // hops to the stored value.
  useEffect(() => {
    if (!storageKey || !storage) return;
    let cancelled = false;

    void (async () => {
      try {
        const stored = await storage
          .instance(STORAGE_INSTANCE)
          .get<{ x?: number; y?: number }>(storageKey);
        if (cancelled || !stored) return;
        setPosition({
          x: typeof stored.x === "number" ? stored.x : initialX,
          y: typeof stored.y === "number" ? stored.y : initialY,
        });
      } catch {
        // fail-soft — driver may throw (private mode / quota / stale
        // blob). Keep the initial position and move on.
      }
    })();

    return () => {
      cancelled = true;
    };
    // We only re-run when the storage key or manager identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, storage]);

  // Persist position to storage whenever it changes. Position
  // persistence is a UI convenience managed directly by this hook —
  // it is not reactive state in the `StateModule` sense, so it stays
  // local. Fire-and-forget with a fail-soft catch.
  useEffect(() => {
    if (!storageKey || !storage) return;
    void storage.instance(STORAGE_INSTANCE).set(storageKey, position).catch(() => {
      // fail-soft — storage may be full or unavailable. In-memory
      // state is authoritative; the user just loses persistence.
    });
  }, [storage, storageKey, position]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled) return;
      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture?.(event.pointerId);
      dragOriginRef.current = {
        x: position.x,
        y: position.y,
        pointerX: event.clientX,
        pointerY: event.clientY,
      };
      setIsDragging(true);
    },
    [enabled, position.x, position.y],
  );

  // Track pointer movement at the window level so the user can drag
  // outside the handle without losing capture.
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      const origin = dragOriginRef.current;
      if (!origin) return;
      const dx = event.clientX - origin.pointerX;
      const dy = event.clientY - origin.pointerY;
      setPosition({
        x: clamp(origin.x + dx, -window.innerWidth / 2, window.innerWidth / 2),
        y: clamp(origin.y + dy, -window.innerHeight / 2, window.innerHeight / 2),
      });
    };
    const handleUp = () => {
      dragOriginRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [isDragging]);

  const reset = useCallback(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  return {
    x: position.x,
    y: position.y,
    isDragging,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      style: { cursor: enabled ? (isDragging ? "grabbing" : "grab") : undefined },
    },
    reset,
  };
}

/**
 * Clamp a number to the inclusive range `[min, max]`.
 *
 * @param value - Value to clamp.
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
