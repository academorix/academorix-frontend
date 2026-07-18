/**
 * @file quiet-hours.util.ts
 * @module @academorix/notifications/preferences/quiet-hours.util
 *
 * @description
 * Pure helpers for the quiet-hours window model. Kept as their own
 * file so callers can use them without pulling any React runtime.
 *
 * ## Timezone handling
 *
 * The backend stores `quiet_hours` as `{ start, end, timezone }`
 * where `start` / `end` are 24-hour wall-clock times in the given
 * IANA `timezone`. The predicate below reads the "wall-clock time
 * in that timezone" via `Intl.DateTimeFormat`, so a Date passed in
 * as `now` is projected into the window's timezone before the
 * comparison.
 *
 * ## Wraps midnight
 *
 * When `start > end` (e.g. `"22:00" .. "07:00"`), the window is
 * treated as `[start, 24:00) ∪ [00:00, end)`. When `start === end`,
 * the window is zero-length and never quiet.
 */

import type { QuietHoursWindow } from "./preferences.type";

/**
 * Discriminator for the union `QuietHoursWindow | Record<string, never>`
 * used by {@link NotificationPreferences.quiet_hours}. Returns
 * `true` when the value has the concrete window shape.
 *
 * @remarks
 * The backend serialises "no quiet hours" as `{}` rather than
 * `null`, so we can't just `!window` — we have to inspect the
 * shape.
 */
export function isQuietHoursWindow(
  window: QuietHoursWindow | Record<string, never> | null | undefined,
): window is QuietHoursWindow {
  if (!window || typeof window !== "object") {
    return false;
  }

  const candidate = window as Partial<QuietHoursWindow>;

  return (
    typeof candidate.start === "string" &&
    typeof candidate.end === "string" &&
    typeof candidate.timezone === "string"
  );
}

/**
 * Parses an `"HH:mm"` string into a total-minutes-since-midnight
 * value (0..1439). Returns `null` when the input is malformed —
 * callers treat that as "window disabled" rather than throwing.
 *
 * @internal Exported for the test suite; not part of the public
 * API surface (the barrel does NOT re-export this).
 */
export function parseHhMm(value: string): number | null {
  const match = /^([0-9]{1,2}):([0-9]{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Extracts the wall-clock hour + minute of `date` as it would read
 * on a clock in `timezone`. Returns total-minutes-since-midnight.
 *
 * @remarks
 * We use `Intl.DateTimeFormat` in the given timezone with
 * `hourCycle: "h23"` so `24:00` never appears. When the timezone
 * is invalid, `Intl.DateTimeFormat` throws — we let the exception
 * surface because a garbage timezone in preferences is a data
 * integrity problem the caller must fix.
 */
export function minutesOfDayInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minutePart = parts.find((p) => p.type === "minute")?.value ?? "0";

  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  return hours * 60 + minutes;
}

/**
 * Returns `true` when `now` falls inside the given quiet-hours
 * `window`, interpreting `window.start` / `window.end` as
 * wall-clock times in `window.timezone`.
 *
 * @param window - The window to test, or an empty object / null
 *   for "no quiet hours".
 * @param now - The instant to test. Defaults to `new Date()`.
 *
 * @remarks
 * A malformed `start` / `end` string is treated as "no quiet
 * hours" (returns `false`) rather than throwing — silently
 * dropping delivery on a data-integrity bug is worse UX than
 * ignoring the window.
 *
 * @example
 * ```ts
 * // 23:30 UK time — inside a 22:00 .. 07:00 wrap-around window.
 * isWithinQuietHours(
 *   { start: "22:00", end: "07:00", timezone: "Europe/London" },
 *   new Date("2025-01-15T23:30:00Z"),
 * );
 * // → true
 * ```
 */
export function isWithinQuietHours(
  window: QuietHoursWindow | Record<string, never> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!isQuietHoursWindow(window)) {
    return false;
  }

  const startMinutes = parseHhMm(window.start);
  const endMinutes = parseHhMm(window.end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  if (startMinutes === endMinutes) {
    // Zero-length window — never quiet.
    return false;
  }

  const nowMinutes = minutesOfDayInTimezone(now, window.timezone);

  if (startMinutes < endMinutes) {
    // Normal window (e.g. 09:00 .. 17:00).
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  // Wraps midnight (e.g. 22:00 .. 07:00).
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}
