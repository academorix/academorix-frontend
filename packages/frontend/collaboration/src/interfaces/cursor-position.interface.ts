/**
 * @file cursor-position.interface.ts
 * Represents a cursor position in a collaboration room.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * A cursor position with coordinates and owner metadata.
 *
 * @example
 * ```typescript
 * const cursor: CursorPosition = {
 *   x: 450,
 *   y: 320,
 *   userId: 'user-abc',
 *   name: 'Alice',
 *   color: '#e74c3c',
 * };
 * ```
 */
export interface CursorPosition {
  /** Horizontal position in pixels. */
  x: number;

  /** Vertical position in pixels. */
  y: number;

  /** User ID of the cursor owner. */
  userId: string;

  /** Display name of the cursor owner. */
  name: string;

  /** Color assigned to this cursor (hex). */
  color: string;
}
