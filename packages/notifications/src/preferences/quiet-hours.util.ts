/**
 * @file quiet-hours.util.ts
 * @module @academorix/notifications/preferences/quiet-hours.util
 *
 * @description
 * Pure helpers for the quiet-hours window model. Kept as its own
 * file so callers can use them without pulling any React runtime.
 */

import type { QuietHoursWindow } from "./preferences.type";

/**
 * Checks whether a given hour falls inside a quiet-hours window.
 * Handles the "wraps midnight" case (`startHour: 22, endHour: 7` →
 * hours 22..23 AND 0..6 are quiet).
 *
 * @param window - The quiet-hours window (or `null` for "off").
 * @param hour - Hour to test (0..23). Defaults to the current wall-
 *   clock hour, so callers can just pass the window.
 */
export function isWithinQuietHours(
  window: QuietHoursWindow | null,
  hour: number = new Date().getHours(),
): boolean {
  if (!window) {
    return false;
  }

  const { startHour, endHour } = window;

  if (startHour === endHour) {
    // Zero-length window — never quiet.
    return false;
  }

  if (startHour < endHour) {
    // Normal window (e.g. 13..17 = 13:00..17:00 exclusive).
    return hour >= startHour && hour < endHour;
  }

  // Wraps midnight (e.g. 22..7).
  return hour >= startHour || hour < endHour;
}
