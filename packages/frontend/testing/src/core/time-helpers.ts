/**
 * @file time-helpers.ts
 * @module @stackra/testing/core
 * @description Deterministic time control for tests — freeze a moment,
 *   travel forward, then restore. Uses `vi.useFakeTimers()` + `vi.setSystemTime()`
 *   under the hood so any code path calling `Date.now()`, `new Date()`,
 *   `setTimeout`, or `setInterval` sees the frozen moment consistently.
 *
 *   The global setup file (`@stackra/testing/setup`) calls `restoreTime()`
 *   in `afterEach`, so tests never leak time state to each other.
 */

import { vi } from "vitest";

/**
 * Freeze `Date.now()` and all timer APIs at the given moment.
 *
 * Calls `vi.useFakeTimers()` and `vi.setSystemTime()`. If time was
 * already frozen (e.g. by a previous `freezeTime` call), the new moment
 * replaces the old one.
 *
 * @param moment - The moment to freeze at. Can be a `Date`, an ISO string,
 *   or a numeric timestamp. Defaults to the current real wall-clock time.
 *
 * @example
 * ```ts
 * freezeTime(new Date('2026-01-01T00:00:00Z'));
 * expect(Date.now()).toBe(new Date('2026-01-01').getTime());
 * ```
 */
export function freezeTime(moment: Date | string | number = new Date()): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(moment));
}

/**
 * Advance (or reverse) the frozen clock to a new moment.
 *
 * Only meaningful after `freezeTime()` — no-op otherwise. Uses
 * `vi.setSystemTime()` so pending fake timers stay coherent.
 *
 * @param moment - The new moment.
 *
 * @example
 * ```ts
 * freezeTime(new Date('2026-01-01'));
 * // ... run some code ...
 * travelTo(new Date('2026-06-15'));  // skip 6 months
 * ```
 */
export function travelTo(moment: Date | string | number): void {
  vi.setSystemTime(new Date(moment));
}

/**
 * Restore real time and drop all pending fake timers.
 *
 * Automatically invoked by `@stackra/testing/setup` in `afterEach` so
 * you rarely need to call this explicitly. Safe to call when time is
 * already real (no-op).
 */
export function restoreTime(): void {
  vi.useRealTimers();
}
