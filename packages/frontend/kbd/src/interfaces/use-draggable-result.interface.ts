/**
 * UseDraggableResult — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

/**
 * Result returned by {@link useDraggable}.
 */
export interface UseDraggableResult {
  /** Current X offset (px). */
  x: number;
  /** Current Y offset (px). */
  y: number;
  /** Whether the user is currently dragging. */
  isDragging: boolean;
  /** Spread these onto the drag handle element. */
  dragHandleProps: {
    onPointerDown: (event: ReactPointerEvent) => void;
    style: CSSProperties;
  };
  /** Reset the position to `{ initialX, initialY }`. */
  reset: () => void;
}
