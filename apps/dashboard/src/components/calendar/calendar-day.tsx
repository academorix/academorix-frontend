/**
 * @file calendar-day.tsx
 * @module components/calendar/calendar-day
 *
 * @description
 * Single-day agenda list, grouped by hour. Unlike the week view which uses an
 * absolute-positioned grid, the day view is a flat vertical list where each
 * event is anchored to its start-hour bucket. Coaches use this view on mobile
 * to walk through today's schedule linearly.
 *
 * # Timezone handling
 *
 * Same rules as `calendar-week.tsx`: ISO timestamps go through `new Date(...)`
 * (offset-aware), we read `.getHours()` / `.getMinutes()` in local time, and
 * we pin cross-day events to the day they *start* on. If a session actually
 * spans midnight, only the first half shows in this view — that's a
 * deliberate simplification matching the facility bookings agenda.
 */

import { useMemo } from "react";

import type { CalendarEvent, CalendarTimeViewProps } from "@/components/calendar/calendar.types";
import type { ReactNode } from "react";

import { CALENDAR_EVENT_COLOR_CLASSES } from "@/components/calendar/calendar.types";
import { isSameDay, startOfDay } from "@/components/calendar/use-calendar-navigation";

/** Default first hour rendered. */
const DEFAULT_START_HOUR = 6;

/** Default last hour rendered. */
const DEFAULT_END_HOUR = 22;

/**
 * Groups events by their local start hour. Events outside the visible hour
 * range are dropped so the list never scrolls past the intended window.
 */
function groupByHour<TMeta>(
  events: CalendarEvent<TMeta>[],
  anchor: Date,
  startHour: number,
  endHour: number,
): Map<number, CalendarEvent<TMeta>[]> {
  const groups = new Map<number, CalendarEvent<TMeta>[]>();

  for (const event of events) {
    const eventStart = new Date(event.startAt);

    // Skip events that live on a different day. `isSameDay` compares
    // (year, month, date) locally, so timezone-shifted events fall into
    // the right bucket automatically.
    if (!isSameDay(eventStart, anchor)) {
      continue;
    }

    const hour = eventStart.getHours();

    if (hour < startHour || hour > endHour) {
      continue;
    }

    const bucket = groups.get(hour);

    if (bucket) {
      bucket.push(event);
    } else {
      groups.set(hour, [event]);
    }
  }

  // Sort events *within* each hour bucket by start minute so the render order
  // is deterministic (matches wall-clock order).
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  return groups;
}

/** Formats an hour integer (0..23) as a display label like `"6:00 AM"`. */
function formatHourLabel(hour: number): string {
  const date = new Date();

  date.setHours(hour, 0, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats an event's local start-end range as `"6:00 AM – 7:30 AM"`.
 * Cross-day events display `"6:00 AM – 12:00 AM"` because we clip at the day
 * boundary; the details drawer can still show the raw end time.
 */
function formatEventRange<TMeta>(event: CalendarEvent<TMeta>): string {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  const startLabel = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${startLabel} – ${endLabel}`;
}

/**
 * The day view. See file-level docstring for the layout and timezone rules.
 *
 * @typeParam TMeta - The event `meta` shape.
 */
export function CalendarDay<TMeta>({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  ariaLabel = "Day agenda",
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: CalendarTimeViewProps<TMeta>): ReactNode {
  const anchor = useMemo(() => startOfDay(currentDate), [currentDate]);

  const groups = useMemo(
    () => groupByHour(events, anchor, startHour, endHour),
    [events, anchor, startHour, endHour],
  );

  const hourRows = useMemo(() => {
    const count = Math.max(0, endHour - startHour + 1);

    return Array.from({ length: count }, (_, index) => startHour + index);
  }, [startHour, endHour]);

  const dateLabel = anchor.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      aria-label={ariaLabel}
      className="calendar-day flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
      role="list"
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{dateLabel}</h2>
      </div>

      <ul className="divide-y divide-border">
        {hourRows.map((hour) => {
          const bucket = groups.get(hour) ?? [];

          return (
            <li key={hour} className="flex gap-3 px-4 py-3">
              {/* Hour label — pinned to the left so the eye can scan
                  vertically. */}
              <div className="w-16 shrink-0 pt-0.5 text-xs text-muted tabular-nums">
                {formatHourLabel(hour)}
              </div>

              {/* Events for this hour, or an "add" affordance when empty. */}
              <div className="flex flex-1 flex-col gap-1">
                {bucket.length === 0 ? (
                  <button
                    aria-label={`Create session at ${formatHourLabel(hour)}`}
                    className="w-full rounded-md border border-dashed border-border/50 px-2 py-1 text-left text-xs text-muted hover:border-accent/60 hover:text-accent focus:ring-2 focus:ring-accent focus:outline-none"
                    type="button"
                    onClick={() => {
                      if (!onSlotClick) {
                        return;
                      }

                      const slot = new Date(anchor);

                      slot.setHours(hour, 0, 0, 0);
                      onSlotClick(slot);
                    }}
                  >
                    &nbsp;
                  </button>
                ) : (
                  bucket.map((event) => {
                    const colorClass = CALENDAR_EVENT_COLOR_CLASSES[event.colorKey ?? "neutral"];
                    const isCancelled = event.status === "cancelled";

                    return (
                      <button
                        key={event.id}
                        aria-label={`${event.title} at ${formatEventRange(event)}`}
                        className={`calendar-day__event flex flex-col gap-0.5 rounded-md border px-3 py-2 text-left text-sm hover:brightness-105 focus:ring-2 focus:ring-accent focus:outline-none ${colorClass} ${
                          isCancelled ? "line-through opacity-70" : ""
                        }`}
                        type="button"
                        onClick={() => onEventClick?.(event)}
                      >
                        <span className="leading-tight font-medium">{event.title}</span>
                        <span className="text-xs tabular-nums opacity-80">
                          {formatEventRange(event)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
