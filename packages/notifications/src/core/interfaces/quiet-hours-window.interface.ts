/**
 * @file quiet-hours-window.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Quiet-hours preference window — the period during
 *   which push channels are suppressed.
 *
 *   Values are wall-clock — the caller's timezone is the source of
 *   truth. Server-side "is this row inside quiet hours" checks
 *   convert to UTC using the `timezone` field.
 */

/**
 * A user's quiet-hours window.
 *
 * `start` / `end` are 24-hour `HH:mm` strings; the interpreter
 * treats an `end < start` window as "wraps midnight"
 * (e.g. `22:00 → 07:00`). `timezone` is an IANA identifier
 * (`'Europe/London'`, `'Africa/Nairobi'`).
 */
export interface IQuietHoursWindow {
  /** Start of the quiet-hours window (HH:mm, wall clock). */
  readonly start: string;
  /** End of the quiet-hours window (HH:mm, wall clock). */
  readonly end: string;
  /** IANA timezone identifier. */
  readonly timezone: string;
}
