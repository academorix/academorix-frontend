/**
 * @file calendar-month.tsx
 * @module components/calendar/calendar-month
 *
 * @description
 * A month-grid calendar. Renders a 7-column table with 5 or 6 rows depending
 * on how the month falls, showing every day cell with up to three event dots
 * plus a "+N more" overflow chip.
 *
 * # Layout
 *
 * The grid always includes trailing days from the previous month and leading
 * days from the next month so the seven columns stay full. Those spill-over
 * days render dimmed. Clicking any day dot opens the corresponding event —
 * clicking the "+N more" chip could be wired up in a follow-up to expand a
 * day popover; today it fires `onSlotClick(day)` so the parent can decide.
 *
 * # Timezone handling
 *
 * Same rules as the week/day views. Multi-day events attach to the local day
 * they *start* on so a session that begins Tuesday and ends Wednesday only
 * appears on Tuesday's cell.
 */

import { useMemo } from "react";

import type { CalendarEvent, CalendarViewProps } from "@/components/calendar/calendar.types";
import type { ReactNode } from "react";

import { CALENDAR_EVENT_COLOR_CLASSES } from "@/components/calendar/calendar.types";
import {
  addDays,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "@/components/calendar/use-calendar-navigation";

/** Max event dots rendered inline before overflowing to "+N more". */
const MAX_INLINE_EVENTS = 3;

/**
 * Groups events by their local start day (`YYYY-MM-DD`). Events that span
 * multiple days appear only on the start day — matching how the week view
 * pins cross-day events.
 */
function groupByDay<TMeta>(
  events: CalendarEvent<TMeta>[],
): Map<string, CalendarEvent<TMeta>[]> {
  const groups = new Map<string, CalendarEvent<TMeta>[]>();

  for (const event of events) {
    const start = new Date(event.startAt);
    const key = dayKey(start);
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(event);
    } else {
      groups.set(key, [event]);
    }
  }

  // Sort each day's events chronologically so the top three (rendered inline)
  // are the earliest ones — most useful for a coach glancing at the grid.
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  return groups;
}

/**
 * Local `YYYY-MM-DD` key for a Date. We build it from `getFullYear()` /
 * `getMonth()` / `getDate()` (all local) rather than `toISOString().slice(0,10)`
 * so the key reflects the user's timezone — otherwise an event at 23:30 UTC
 * that renders on the next local day would land in the wrong bucket.
 */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * The month view. See file-level docstring for the layout and timezone rules.
 *
 * @typeParam TMeta - The event `meta` shape.
 */
export function CalendarMonth<TMeta>({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  ariaLabel = "Month calendar",
}: CalendarViewProps<TMeta>): ReactNode {
  // Anchor: first of the visible month (local time).
  const monthAnchor = useMemo(() => startOfMonth(currentDate), [currentDate]);

  // Grid start: the Monday that precedes or equals the first of the month.
  const gridStart = useMemo(() => startOfWeek(monthAnchor), [monthAnchor]);

  // How many rows we need — the last cell must contain a day from the current
  // month, but a 5-row grid is common (Feb 2026, for instance).
  const rows = useMemo(() => {
    const monthIndex = monthAnchor.getMonth();
    const yearIndex = monthAnchor.getFullYear();

    // Six weeks always covers a Gregorian month, but we drop the last row
    // when it contains no in-month days to save vertical space.
    for (const candidate of [5, 6] as const) {
      const lastCellDate = addDays(gridStart, candidate * 7 - 1);

      if (
        candidate === 6 ||
        lastCellDate.getMonth() === monthIndex ||
        (candidate === 5 && lastCellDate.getMonth() !== monthIndex)
      ) {
        // Prefer 5 rows if row 5's last day is >= the last day of the month.
        // Otherwise fall through to 6.
        const rowFiveLast = addDays(gridStart, 5 * 7 - 1);
        const lastOfMonth = new Date(yearIndex, monthIndex + 1, 0);

        if (rowFiveLast.getTime() >= lastOfMonth.getTime()) {
          return 5;
        }

        return 6;
      }
    }

    return 6;
  }, [monthAnchor, gridStart]);

  const gridDates = useMemo(
    () => Array.from({ length: rows * 7 }, (_, index) => addDays(gridStart, index)),
    [gridStart, rows],
  );

  const eventsByDay = useMemo(() => groupByDay(events), [events]);

  const today = new Date();
  const currentMonthIndex = monthAnchor.getMonth();
  const weekdayHeaders = useMemo(() => {
    // Mon..Sun — same start-of-week convention as the week view.
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(gridStart, index);

      return day.toLocaleDateString(undefined, { weekday: "short" });
    });
  }, [gridStart]);

  return (
    <div
      aria-label={ariaLabel}
      className="calendar-month overflow-hidden rounded-lg border border-border bg-surface"
      role="grid"
    >
      {/* Weekday header row. */}
      <div className="grid grid-cols-7 border-b border-border" role="row">
        {weekdayHeaders.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="border-r border-border px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted last:border-r-0"
            role="columnheader"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells. `grid-rows` mirrors the row count so cells resize
          proportionally when the viewport does. */}
      <div
        className="grid grid-cols-7"
        role="rowgroup"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(96px, 1fr))` }}
      >
        {gridDates.map((day) => {
          const isCurrentMonth = day.getMonth() === currentMonthIndex;
          const isToday = isSameDay(day, today);
          const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
          const overflowCount = Math.max(0, dayEvents.length - MAX_INLINE_EVENTS);
          const inlineEvents = dayEvents.slice(0, MAX_INLINE_EVENTS);

          return (
            <div
              key={day.toISOString()}
              aria-label={day.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              className={`flex flex-col gap-1 border-b border-r border-border p-2 last:border-r-0 ${
                isCurrentMonth ? "" : "bg-background/40 text-muted"
              }`}
              role="gridcell"
            >
              {/* Day number badge — reversed when today. */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    isToday
                      ? "inline-flex size-6 items-center justify-center rounded-full bg-accent text-white"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event dots — max three visible, extras collapsed to a
                  "+N more" chip that emits an `onSlotClick` so the parent
                  can open a day drilldown or switch to day view. */}
              <ul className="flex flex-col gap-0.5">
                {inlineEvents.map((event) => {
                  const colorClass =
                    CALENDAR_EVENT_COLOR_CLASSES[event.colorKey ?? "neutral"];
                  const isCancelled = event.status === "cancelled";

                  return (
                    <li key={event.id}>
                      <button
                        aria-label={`${event.title} on ${day.toLocaleDateString()}`}
                        className={`w-full truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight hover:brightness-105 focus:outline-none focus:ring-1 focus:ring-accent ${colorClass} ${
                          isCancelled ? "line-through opacity-70" : ""
                        }`}
                        type="button"
                        onClick={() => onEventClick?.(event)}
                      >
                        {event.title}
                      </button>
                    </li>
                  );
                })}
                {overflowCount > 0 ? (
                  <li>
                    <button
                      aria-label={`Show ${overflowCount} more events on ${day.toLocaleDateString()}`}
                      className="w-full rounded px-1 py-0.5 text-left text-[11px] text-muted hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      type="button"
                      onClick={() => {
                        if (!onSlotClick) {
                          return;
                        }

                        // Emit the day start; the parent can drop it into a
                        // date picker, switch to day view, or open a popover.
                        const slotDate = new Date(day);

                        slotDate.setHours(0, 0, 0, 0);
                        onSlotClick(slotDate);
                      }}
                    >
                      +{overflowCount} more
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
