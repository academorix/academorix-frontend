/**
 * @file cron-parser.util.ts
 * @module @stackra/scheduler/core/utils
 * @description Lightweight cron expression parser.
 *   Parses standard 5-field and extended 6-field cron expressions
 *   and computes the next execution time from a given reference date.
 *
 *   Supports: wildcard, ranges (1-5), lists (1,3,5), steps (field/5), exact values.
 *   Does NOT support named days/months (use numbers: 0=Sun, 1=Mon, etc.).
 */

import type { ICronFields } from "@/core/interfaces";

/**
 * @deprecated Use {@link ICronFields} from `@/core/interfaces` instead.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Parse a cron expression into its constituent fields.
 *
 * @param expression - Cron expression string (5 or 6 fields)
 * @returns Parsed fields with valid value arrays
 * @throws Error if the expression is malformed
 *
 * @example
 * ```typescript
 * const fields = parseCron('0 3 1 1 1');
 * ```
 */
export function parseCron(expression: string): ICronFields {
  const parts = expression.trim().split(/\s+/);

  if (parts.length === 5) {
    return {
      minutes: parseField(parts[0]!, 0, 59),
      hours: parseField(parts[1]!, 0, 23),
      daysOfMonth: parseField(parts[2]!, 1, 31),
      months: parseField(parts[3]!, 1, 12),
      daysOfWeek: parseField(parts[4]!, 0, 6),
    };
  }

  if (parts.length === 6) {
    return {
      seconds: parseField(parts[0]!, 0, 59),
      minutes: parseField(parts[1]!, 0, 59),
      hours: parseField(parts[2]!, 0, 23),
      daysOfMonth: parseField(parts[3]!, 1, 31),
      months: parseField(parts[4]!, 1, 12),
      daysOfWeek: parseField(parts[5]!, 0, 6),
    };
  }

  throw new Error(`Invalid cron expression: "${expression}". Expected 5 or 6 fields.`);
}

/**
 * Compute the next execution time for a cron expression.
 *
 * @param expression - Cron expression string
 * @param from - Reference date (defaults to now)
 * @returns The next execution Date, or null if none found within 1 year
 *
 * @example
 * ```typescript
 * const next = getNextCronTime('0 3 1 1 1'); // Next matching time
 * const ms = next.getTime() - Date.now();
 * ```
 */
export function getNextCronTime(expression: string, from?: Date): Date | null {
  const fields = parseCron(expression);
  const start = from ? new Date(from.getTime() + 1000) : new Date(Date.now() + 1000);

  // Search up to 1 year ahead
  const maxDate = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
  const current = new Date(start);

  if (fields.seconds) {
    // 6-field: second granularity. Truncate sub-second noise so the
    // loop's 1s step lands on a wall-clock second boundary.
    current.setMilliseconds(0);
  } else {
    // 5-field: minute granularity. The runner re-invokes this helper
    // after every fire, so if we returned a match INSIDE the current
    // minute (which happens whenever the minute field is wildcarded)
    // the caller would re-schedule with a sub-second delay and end up
    // firing 60×/minute. Advance to the top of the NEXT minute so
    // "next" strictly means "the following minute-boundary or later".
    current.setSeconds(0);
    current.setMilliseconds(0);
    current.setTime(current.getTime() + 60_000);
  }

  while (current < maxDate) {
    if (matchesCron(current, fields)) {
      return current;
    }
    // Advance by 1 second (or 1 minute if no seconds field)
    current.setTime(current.getTime() + (fields.seconds ? 1000 : 60000));
  }

  return null;
}

/**
 * Compute the interval in ms until the next cron execution.
 *
 * @param expression - Cron expression
 * @returns Milliseconds until next execution, or null
 */
export function getNextCronDelay(expression: string): number | null {
  const next = getNextCronTime(expression);
  if (!next) return null;
  return Math.max(0, next.getTime() - Date.now());
}

// ════════════════════════════════════════════════════════════════════════════════
// Private Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Check if a date matches all cron fields.
 */
export function matchesCron(date: Date, fields: ICronFields): boolean {
  if (fields.seconds && !fields.seconds.includes(date.getSeconds())) return false;
  if (!fields.minutes.includes(date.getMinutes())) return false;
  if (!fields.hours.includes(date.getHours())) return false;
  if (!fields.daysOfMonth.includes(date.getDate())) return false;
  if (!fields.months.includes(date.getMonth() + 1)) return false;
  if (!fields.daysOfWeek.includes(date.getDay())) return false;
  return true;
}

/**
 * Parse a single cron field into an array of valid values.
 *
 * Supports: wildcard, N, N-M, N-M/S, wildcard/S, N,M,O
 */
export function parseField(field: string, min: number, max: number): number[] {
  const values = new Set<number>();

  const parts = field.split(",");
  for (const part of parts) {
    if (part === "*") {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr!, 10);
      let start = min;
      let end = max;

      if (range !== "*") {
        if (range!.includes("-")) {
          const [s, e] = range!.split("-");
          start = parseInt(s!, 10);
          end = parseInt(e!, 10);
        } else {
          start = parseInt(range!, 10);
        }
      }

      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
    } else if (part.includes("-")) {
      const [s, e] = part.split("-");
      const start = parseInt(s!, 10);
      const end = parseInt(e!, 10);
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      values.add(parseInt(part, 10));
    }
  }

  return [...values].sort((a, b) => a - b);
}
