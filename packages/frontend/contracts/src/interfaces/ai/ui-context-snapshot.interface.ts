/**
 * @file ui-context-snapshot.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description The serialized, ordered representation of all active context
 *   frames sent to the backend.
 */

/** A serialized UI context snapshot (focus stack, top → bottom). */
export interface IUiContextSnapshot {
  /** The focus stack ordered top → bottom. */
  focusStack: Array<{ key: string; priority: number; snapshot: unknown }>;
  /** Current route, when known. */
  route?: string;
  /** Capture timestamp (epoch millis). */
  capturedAt: number;
}
