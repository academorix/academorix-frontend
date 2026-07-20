/**
 * @file is-quiet-hours-window.util.ts
 * @module @stackra/notifications/core/utils
 * @description Type guard for the quiet-hours window shape.
 *
 *   The preferences store keeps `quiet_hours` as
 *   `IQuietHoursWindow | Record<string, never>` — a value + empty
 *   discriminated union. This guard narrows the value to the
 *   `IQuietHoursWindow` variant when every required field is
 *   present.
 */

import type { IQuietHoursWindow } from "../interfaces";

/**
 * Whether `value` structurally matches the quiet-hours window
 * shape. Narrows the input on `true`.
 *
 * @param value - The candidate value.
 * @returns `true` when `value` has `start`, `end`, and `timezone`
 *   fields, each a non-empty string.
 */
export function isQuietHoursWindow(value: unknown): value is IQuietHoursWindow {
  if (value == null || typeof value !== "object") return false;
  const candidate = value as Partial<Record<"start" | "end" | "timezone", unknown>>;
  return (
    typeof candidate.start === "string" &&
    candidate.start.length > 0 &&
    typeof candidate.end === "string" &&
    candidate.end.length > 0 &&
    typeof candidate.timezone === "string" &&
    candidate.timezone.length > 0
  );
}
