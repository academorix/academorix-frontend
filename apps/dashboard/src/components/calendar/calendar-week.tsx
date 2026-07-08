/**
 * @file calendar-week.tsx
 * @module components/calendar/calendar-week
 *
 * @description
 * A 7-column week view for the shared calendar. The visible range spans
 * `startHour..endHour` local time (default 6..22) with one row per hour, and
 * seven columns from the Monday that starts the week through Sunday.
 *
 * # Layout
 *
 * ```
 * +--------+-----------------------------------------------+
 * |        | Mon 12 | Tue 13 | Wed 14 | Thu 15 | Fri 16 | Sat 17 | Sun 18 |
 * +--------+--------+--------+--------+--------+--------+--------+--------+
 * | 06:00  |        |        |        |        |        |        |        |
 * | 07:00  |        |        |        |        |        |        |        |
 * | ...    |        |        |        |        |        |        |        |
 * | 22:00  |        |        |        |        |        |        |        |
 * +--------+--------+--------+--------+--------+--------+--------+--------+
 * ```
 *
 * Events are absolute-positioned inside their column, using
 * `top = (localStartHour - startHour + minutes/60) * rowHeight` and
 * `height = durationHours * rowHeight`. Events that span multiple days appear
 * only on the local day they start on — the design here matches the
 * facility bookings agenda's "pin to start day" rule.
 *
 * # Timezone handling
 *
 * The event's `startAt` / `endAt` are ISO strings from the backend. We hand
 * them to `new Date(...)` (offset-aware) then read `.getHours()` /
 * `.getMinutes()` in the user's local timezone. That's the only place we
 * touch time math — the rest of the file operates on local `Date`s.
 *
 * # DST edge case
 *
 * On a spring-forward Sunday, the local clock jumps from 02:00 to 03:00: the
 * 02:00-row would be empty even for a booking that "spans" it. On a fall-back
 * Sunday, 02:00 happens twice. Because we render events at their `startAt`
 * hour (not by iterating hours), both cases render correctly — the event
 * simply appears at whatever local hour the parsed Date reports.
 */

import { useMemo } from "react";

import type { CalendarEvent, CalendarTimeViewProps } from "@/components/calendar/calendar.types";
import type { ReactNode } from "react";

import { CALENDAR_EVENT_COLOR_CLASSES } from "@/components/calendar/calendar.types";
import { addDays, isSameDay, startOfWeek } from "@/components/calendar/use-calendar-navigation";

/** Height (in pixels) of a single hour row. Kept small so 16 rows fit desktop. */
const HOUR_ROW_HEIGHT = 48;

/** Default first hour rendered (inclusive). */
const DEFAULT_START_HOUR = 6;

/** Default last hour rendered (inclusive). */
const DEFAULT_END_HOUR = 22;

/**
 * Positioning info for a single event inside a day column, in pixel space.
 * Kept as an internal type so the render loop stays declarative.
 */
interface EventLayout<TMeta> {
  event: CalendarEvent<TMeta>;
  /** Distance from the top of the hour grid, in px. */
  topPx: number;
  /** Height of the block, in px (minimum 20 for a tap target). */
  heightPx: number;
  /** Column index (0..6). */
  columnIndex: number;
}

/**
 * Turns an event's ISO timestamps into local hour + minute pairs. Handles the
 * defensive case where `endAt <= startAt` by clamping the end to the start
 * plus 30 minutes so the block still renders.
 */
function computeLayout<TMeta>(
  event: CalendarEvent<TMeta>,
  weekStart: Date,
  startHour: number,
): EventLayout<TMeta> | null {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  // Skip events that live entirely outside the visible week.
  const columnIndex = daysBetween(weekStart, start);

  if (columnIndex < 0 || columnIndex > 6) {
    return null;
  }

  // Read local wall-clock hours off the parsed Date. This is where timezone
  // conversion happens: `new Date("2025-01-16T14:30:00Z").getHours()` returns
  // 15 in a UTC+1 browser, 9 in a UTC-5 browser, etc.
  const startFractionHour = start.getHours() + start.getMinutes() / 60;
  const endFractionHour = end.getHours() + end.getMinutes() / 60;

  // Defensive: if the parsed dates are equal or reversed, or if end lands on
  // the next day (cross-day session), pin the end to the same day's finish
  // to keep the block inside its column.
  let effectiveEndHour = endFractionHour;

  if (!isSameDay(start, end)) {
    // Event crosses midnight — the calendar renders it up to the end of the
    // start day. The rest of the event is dropped from this week view (the
    // agenda view would show two blocks; that's a follow-up).
    effectiveEndHour = 24;
  }

  if (effectiveEndHour <= startFractionHour) {
    effectiveEndHour = startFractionHour + 0.5;
  }

  const topPx = (startFractionHour - startHour) * HOUR_ROW_HEIGHT;
  const rawHeightPx = (effectiveEndHour - startFractionHour) * HOUR_ROW_HEIGHT;
  const heightPx = Math.max(rawHeightPx, 20);

  return {
    event,
    topPx,
    heightPx,
    columnIndex,
  };
}

/**
 * Number of full local days between `start` (a midnight) and `date`.
 * Returns negative values for dates before `start`.
 */
function daysBetween(start: Date, date: Date): number {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Divide by 24h in milliseconds. DST shifts this by ±1 hour, so we `Math.round`
  // to snap to the correct day count regardless.
  return Math.round((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/** Formats an hour integer (0-23) as `"06:00"`. */
function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * The week view. See file-level docstring for the layout and timezone rules.
 *
 * @typeParam TMeta - The event `meta` shape.
 */
export function CalendarWeek<TMeta>({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  ariaLabel = "Week calendar",
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: CalendarTimeViewProps<TMeta>): ReactNode {
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  // Build the seven column dates (Mon..Sun) once per anchor change.
  const columnDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const hourRows = useMemo(() => {
    // `endHour` is inclusive: 6..22 yields 17 rows (6, 7, ..., 22).
    const count = Math.max(0, endHour - startHour + 1);

    return Array.from({ length: count }, (_, index) => startHour + index);
  }, [startHour, endHour]);

  // Precompute per-event layout so the render loop stays flat.
  const layouts = useMemo(() => {
    const out: EventLayout<TMeta>[] = [];

    for (const event of events) {
      const layout = computeLayout(event, weekStart, startHour);

      if (layout) {
        out.push(layout);
      }
    }

    return out;
  }, [events, weekStart, startHour]);

  return (
    <div
      aria-label={ariaLabel}
      className="calendar-week overflow-hidden rounded-lg border border-border bg-surface"
      role="grid"
    >
      {/* Header row: day labels. Sticky in case a caller wraps the grid in a
          scroll container. */}
      <div
        className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-border bg-surface"
        role="row"
      >
        {/* Empty top-left cell aligns the hour gutter with the column headers. */}
        <div aria-hidden="true" className="border-r border-border" />
        {columnDates.map((date) => {
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={date.toISOString()}
              className={`border-r border-border px-2 py-2 text-center last:border-r-0 ${
                isToday ? "bg-accent/5" : ""
              }`}
              role="columnheader"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div
                className={`text-sm font-semibold tabular-nums ${
                  isToday ? "text-accent" : "text-foreground"
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: hour gutter + 7 day columns. The whole body is a single grid so
          the vertical alignment stays pixel-perfect. */}
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]" role="rowgroup">
        {/* Hour gutter — one row per hour with the local hour label. */}
        <div
          aria-hidden="true"
          className="border-r border-border"
          style={{ height: hourRows.length * HOUR_ROW_HEIGHT }}
        >
          {hourRows.map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end px-2 pt-1 text-[10px] tabular-nums text-muted"
              style={{ height: HOUR_ROW_HEIGHT }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {/* Seven day columns. Each column is `position: relative` so its events
            can absolute-position on top of the hour lines. */}
        {columnDates.map((date, columnIndex) => (
          <div
            key={date.toISOString()}
            className="relative border-r border-border last:border-r-0"
            role="gridcell"
            style={{ height: hourRows.length * HOUR_ROW_HEIGHT }}
          >
            {/* Hour lines. `pointer-events-none` so the underlying slot buttons
                still receive clicks. */}
            {hourRows.map((hour) => (
              <button
                key={hour}
                aria-label={`Create at ${formatHourLabel(hour)} on ${date.toLocaleDateString()}`}
                className="absolute inset-x-0 border-t border-border/40 first:border-t-0 hover:bg-accent/5 focus:bg-accent/10 focus:outline-none"
                style={{
                  top: (hour - startHour) * HOUR_ROW_HEIGHT,
                  height: HOUR_ROW_HEIGHT,
                }}
                type="button"
                onClick={() => {
                  if (!onSlotClick) {
                    return;
                  }

                  // Compose the slot Date in local time. The caller can render
                  // it directly or convert to UTC for a form field.
                  const slot = new Date(date);

                  slot.setHours(hour, 0, 0, 0);
                  onSlotClick(slot);
                }}
              />
            ))}

            {/* Absolute-positioned event chips. Rendered after the hour buttons
                so they capture clicks first (React attaches them later in the
                DOM order). */}
            {layouts
              .filter((layout) => layout.columnIndex === columnIndex)
              .map((layout) => {
                const colorClass =
                  CALENDAR_EVENT_COLOR_CLASSES[layout.event.colorKey ?? "neutral"];
                const isCancelled = layout.event.status === "cancelled";

                return (
                  <button
                    key={layout.event.id}
                    aria-label={`${layout.event.title} — ${new Date(
                      layout.event.startAt,
                    ).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                    className={`calendar-week__event absolute left-1 right-1 flex flex-col gap-0.5 overflow-hidden rounded-md border px-2 py-1 text-left text-xs leading-tight shadow-sm hover:z-10 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-accent ${colorClass} ${
                      isCancelled ? "line-through opacity-70" : ""
                    }`}
                    style={{
                      top: layout.topPx,
                      height: layout.heightPx,
                    }}
                    type="button"
                    onClick={() => onEventClick?.(layout.event)}
                  >
                    <span className="truncate font-medium">{layout.event.title}</span>
                    <span className="tabular-nums opacity-80">
                      {new Date(layout.event.startAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
