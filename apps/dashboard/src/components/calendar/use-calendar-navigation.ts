/**
 * @file use-calendar-navigation.ts
 * @module components/calendar/use-calendar-navigation
 *
 * @description
 * The calendar's date navigation state. Owns the currently-visible date, the
 * active view (`day` / `week` / `month`), and three verbs — `prev`, `next`,
 * `today` — whose behaviour flexes with the view.
 *
 * The math here is deliberately timezone-naive: the `Date` object we mutate
 * represents "the local anchor date", and we always call `setDate` / `setMonth`
 * rather than doing raw millisecond arithmetic. That keeps DST transitions
 * from silently drifting the anchor by ±1 hour when the browser crosses a
 * spring-forward / fall-back boundary.
 *
 * # DST safety
 *
 * If we did `new Date(anchor.getTime() + 7 * 86_400_000)` to jump a week, the
 * anchor would drift by an hour on the week that contains a DST transition
 * (86_400_000 ms is exactly 24h, but a DST day is 23h or 25h). Every jump in
 * this hook goes through `setDate` / `setMonth`, which is DST-aware — the
 * anchor stays pinned to the same local wall-clock hour across boundaries.
 */

import { useCallback, useMemo, useState } from "react";

import type { CalendarView } from "@/components/calendar/calendar.types";

/** Options for {@link useCalendarNavigation}. */
export interface UseCalendarNavigationOptions {
  /**
   * The initial anchor date. Defaults to `new Date()` (i.e. "today"). Passing
   * a fixed date is useful in tests so the assertions don't move around every
   * midnight.
   */
  initialDate?: Date;

  /**
   * The initial view mode. Defaults to `"week"` — week is the most common
   * default for an operations calendar (agenda, attendance, sessions).
   */
  initialView?: CalendarView;
}

/**
 * The shape returned by {@link useCalendarNavigation}. Held as an interface so
 * consumers can `import type { UseCalendarNavigationReturn }` in a test file
 * without importing the runtime.
 */
export interface UseCalendarNavigationReturn {
  /** Current anchor date (start of the visible period for week/month). */
  currentDate: Date;

  /** Active view mode. */
  view: CalendarView;

  /** Jumps the anchor back one day / week / month (depending on `view`). */
  goToPrev: () => void;

  /** Jumps the anchor forward one day / week / month (depending on `view`). */
  goToNext: () => void;

  /** Resets the anchor to `new Date()` (today). Does not change the view. */
  goToToday: () => void;

  /** Sets the anchor to an explicit date (used by the toolbar's date picker). */
  goToDate: (date: Date) => void;

  /** Switches the active view mode. Does not change the anchor. */
  setView: (view: CalendarView) => void;
}

/**
 * Adds `n` days to the given date **using local wall-clock math**. Reads +
 * writes go through `setDate`, so DST boundaries do not drift the hour.
 */
export function addDays(date: Date, n: number): Date {
  const next = new Date(date);

  next.setDate(next.getDate() + n);

  return next;
}

/**
 * Adds `n` calendar months. `setMonth` is DST-aware and JavaScript already
 * handles month-length quirks (Feb 30 collapses to Mar 2, which is fine
 * because our anchor is always the first of the month before we call this).
 */
export function addMonths(date: Date, n: number): Date {
  const next = new Date(date);

  // Pin the anchor to day 1 first — otherwise adding a month to Jan 31 lands
  // on Mar 3 (because Feb 31 overflows). Modules never anchor on a specific
  // day of the month, so day-1 pinning is safe.
  next.setDate(1);
  next.setMonth(next.getMonth() + n);

  return next;
}

/**
 * How wide a "prev / next" jump is for a given view.
 *  - `day`: ±1 day
 *  - `week`: ±7 days
 *  - `month`: ±1 month
 */
function stepFor(view: CalendarView, direction: -1 | 1): (date: Date) => Date {
  switch (view) {
    case "day":
      return (date) => addDays(date, direction);
    case "week":
      return (date) => addDays(date, direction * 7);
    case "month":
      return (date) => addMonths(date, direction);
    default: {
      // Exhaustiveness guard — if we ever add "agenda" or "year", the compiler
      // will flag every case that missed the update.
      const exhaustive: never = view;

      throw new Error(`Unknown calendar view: ${String(exhaustive)}`);
    }
  }
}

/**
 * State + verbs for the calendar's date navigation. Kept as a self-contained
 * hook so a page can render the calendar view components directly and still
 * share the toolbar without prop-drilling every date detail through it.
 *
 * @param options - Initial date + view, mostly for tests.
 */
export function useCalendarNavigation(
  options: UseCalendarNavigationOptions = {},
): UseCalendarNavigationReturn {
  // `useState`'s functional initialiser keeps the "today" default from
  // resetting on every render.
  const [currentDate, setCurrentDate] = useState<Date>(() => options.initialDate ?? new Date());
  const [view, setView] = useState<CalendarView>(options.initialView ?? "week");

  const goToPrev = useCallback(() => {
    setCurrentDate((current) => stepFor(view, -1)(current));
  }, [view]);

  const goToNext = useCallback(() => {
    setCurrentDate((current) => stepFor(view, 1)(current));
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    // Clone so external mutation of the passed-in Date does not leak back.
    setCurrentDate(new Date(date));
  }, []);

  return useMemo(
    () => ({
      currentDate,
      view,
      goToPrev,
      goToNext,
      goToToday,
      goToDate,
      setView,
    }),
    [currentDate, view, goToPrev, goToNext, goToToday, goToDate],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone helpers exposed for tests and view components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the ISO date for the Monday that starts the week containing `date`.
 * The calendar renders Mon..Sun so weekends group at the tail — matching
 * `apps/dashboard/src/modules/facilities/pages/bookings.tsx`.
 */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);

  // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
  // Rotate so Monday becomes offset 0, Sunday offset 6.
  const dayOffset = (start.getDay() + 6) % 7;

  start.setDate(start.getDate() - dayOffset);
  start.setHours(0, 0, 0, 0);

  return start;
}

/**
 * Returns the first day of the month for `date` (day 1, 00:00 local). The
 * month view uses this as the anchor for building the grid.
 */
export function startOfMonth(date: Date): Date {
  const start = new Date(date);

  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return start;
}

/**
 * Returns the same local calendar day at 00:00. Handy for both hour-slot math
 * (day view) and DST-safe day comparisons.
 */
export function startOfDay(date: Date): Date {
  const start = new Date(date);

  start.setHours(0, 0, 0, 0);

  return start;
}

/**
 * Whether two dates fall on the same local calendar day. Compares (year,
 * month, date) triples rather than millisecond deltas so DST does not confuse
 * the comparison.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
