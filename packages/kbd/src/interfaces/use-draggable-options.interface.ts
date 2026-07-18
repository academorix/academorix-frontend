/**
 * UseDraggableOptions — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

/**
 * Options for {@link useDraggable}.
 */
export interface UseDraggableOptions {
  /** When set, persists `{ x, y }` under this key in `localStorage`. */
  storageKey?: string;
  /** Initial X position when nothing is persisted. Defaults to `0`. */
  initialX?: number;
  /** Initial Y position when nothing is persisted. Defaults to `0`. */
  initialY?: number;
  /** When `false`, dragging is disabled (state still loads from storage). */
  enabled?: boolean;
}
