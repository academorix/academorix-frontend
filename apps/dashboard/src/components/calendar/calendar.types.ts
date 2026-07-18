/**
 * @file calendar.types.ts
 * @module components/calendar/calendar.types
 *
 * @description
 * Type surface for the shared calendar component. Everything that leaks out of
 * the `components/calendar/*` files goes through this file so consumers can
 * `import type { CalendarEvent } from "@/components/calendar";` without pulling
 * a React runtime.
 *
 * # Timezone model
 *
 * The backend serialises every timestamp as **ISO 8601 UTC** — for example
 * `"2025-01-16T14:30:00Z"`. On the client we render those instants in the
 * user's **local timezone** by handing the string to
 * `new Date(iso)` (which is offset-aware) and reading `getHours` / `getDate`
 * from there. When a consumer emits a range back out (e.g. for a filter query),
 * we serialise via `Date.prototype.toISOString()` so the wire payload stays UTC.
 *
 * Consequences the callers need to know:
 *
 * 1. `startAt` / `endAt` on {@link CalendarEvent} are **wire strings**, not
 *    parsed `Date` objects. That keeps the type serialisable across `useMemo`
 *    boundaries and identical to what `useList` returns.
 * 2. A cross-day event (starts one local day, ends the next) is *rendered* on
 *    the local day it starts on for the week and day views. The month view
 *    renders it on the local start-day dot.
 * 3. Daylight-savings transitions can shrink or grow a day by an hour — the
 *    calendar's row math uses `getHours` on a local `Date`, which handles both
 *    cases without a manual fudge. See `use-calendar-navigation.ts` for the
 *    explicit DST notes.
 */

import type { ReactNode } from "react";

/**
 * The three view modes the calendar can render. Consumers pass the current
 * view in as a controlled prop, or defer to the built-in toolbar's
 * `Segment`-style switcher.
 *
 * - `"day"` — a single day, one column, hour rows.
 * - `"week"` — 7 columns (Mon..Sun by default), hour rows.
 * - `"month"` — a 5- or 6-row month grid with day cells + event dots.
 */
export type CalendarView = "day" | "week" | "month";

/**
 * A single calendar event. Deliberately generic so a caller can attach the
 * original record shape via the `meta` bag without polluting the calendar's
 * core types.
 *
 * @typeParam TMeta - The shape of the extra payload carried in `meta`.
 */
export interface CalendarEvent<TMeta = unknown> {
  /** Stable id used by React keys and click callbacks. */
  id: string;

  /** Human-readable title rendered inside the event chip. */
  title: string;

  /**
   * ISO 8601 UTC start timestamp — must be parseable by `new Date(...)`. The
   * calendar reads local hours/minutes off the parsed Date, so the string can
   * carry any offset. Backend responses use `Z`; forms may pass `+HH:mm`.
   */
  startAt: string;

  /**
   * ISO 8601 UTC end timestamp. Follows the same rules as {@link startAt}.
   * When `endAt <= startAt` the calendar renders the event as a single-slot
   * marker rather than throwing — a defensive default so bad backend data
   * does not blow up the view.
   */
  endAt: string;

  /**
   * Optional lifecycle status attached by the caller. Used as a display hint
   * (e.g. `"cancelled"` events get strike-through styling); the calendar does
   * not enforce a specific enum.
   */
  status?: string;

  /**
   * Optional color key drawn from the caller's palette. The calendar maps
   * every known key to a Tailwind background/text combo (see
   * {@link CALENDAR_EVENT_COLOR_CLASSES}). Unknown keys fall back to the
   * neutral surface color so an integration mismatch never crashes the view.
   */
  colorKey?: CalendarEventColorKey;

  /**
   * Arbitrary payload the caller carries end-to-end. Common uses: the
   * original record for the details drawer, an inferred permission flag, or
   * a link href. Kept untyped by the calendar; the module owns its shape.
   */
  meta?: TMeta;
}

/**
 * The palette the calendar recognises out of the box. Callers pick a key here
 * to color-code events; the calendar looks it up in
 * {@link CALENDAR_EVENT_COLOR_CLASSES} to resolve the classNames.
 *
 * The keys are intentionally neutral (`"accent"`, `"success"`) rather than
 * domain-loaded (`"attendance-taken"`) so multiple consumers can share the
 * calendar without stepping on each other's semantics.
 */
export type CalendarEventColorKey = "accent" | "success" | "warning" | "danger" | "neutral";

/**
 * Tailwind class fragments per color key. Kept as a plain map so tree-shaking
 * doesn't drop the strings — the class names must appear in source for
 * Tailwind's content scanner to pick them up.
 */
export const CALENDAR_EVENT_COLOR_CLASSES: Record<CalendarEventColorKey, string> = {
  accent: "bg-accent/10 text-accent border-accent/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  neutral: "bg-muted/10 text-foreground border-border",
};

/**
 * Time-of-day range the calendar renders vertically. Only used by the
 * `day` and `week` views (the month view is date-only).
 *
 * `startHour` is inclusive (the first hour row); `endHour` is inclusive (the
 * last hour row). The default 6..22 gives 17 rows, wide enough for a full
 * training day but narrow enough to stay legible on a 1024-wide viewport.
 */
export interface CalendarTimeRange {
  /** First hour rendered (0-23). Default: `6`. */
  startHour: number;
  /** Last hour rendered (0-23). Default: `22`. */
  endHour: number;
}

/**
 * Base props shared by every calendar view (day / week / month). Consumers
 * typically pass these through from the top-level page (`CalendarProps`) and
 * the toolbar (`CalendarToolbar`) without repeating the wiring.
 *
 * @typeParam TMeta - The event `meta` shape.
 */
export interface CalendarViewProps<TMeta = unknown> {
  /** Currently visible date. For week/month, drives which week/month is shown. */
  currentDate: Date;

  /** Events to render inside the visible range. */
  events: CalendarEvent<TMeta>[];

  /**
   * Called when the user clicks/taps an event. Passes the original event —
   * NOT the wire record — so the parent can open a drawer or route to a show
   * page without a second lookup.
   */
  onEventClick?: (event: CalendarEvent<TMeta>) => void;

  /**
   * Called when the user clicks an empty slot in the day or week grid. Passes
   * the local Date the slot represents (hour precision), so the parent can
   * pre-fill a "New session" form. The month view does not emit this yet —
   * clicking a day dot expands the day inline.
   */
  onSlotClick?: (slotStart: Date) => void;

  /**
   * Optional aria-label for the grid root. Defaults to `"Calendar"`; a
   * module-specific label makes screen-reader announcements clearer
   * (e.g. `"Attendance agenda"`).
   */
  ariaLabel?: string;
}

/**
 * Props for the day and week views — same as {@link CalendarViewProps} plus
 * the hour range. The month view drops this: it renders dates only.
 */
export interface CalendarTimeViewProps<TMeta = unknown>
  extends CalendarViewProps<TMeta>, Partial<CalendarTimeRange> {}

/**
 * Full top-level props exposed from the `<Calendar>` composite. Currently the
 * calendar ships as three separate view components rather than a single
 * omnibus root — this type is here so consumers can build their own composite
 * with matching prop shapes.
 *
 * @typeParam TMeta - The event `meta` shape.
 */
export interface CalendarProps<TMeta = unknown> extends CalendarTimeViewProps<TMeta> {
  /** Active view mode. Defaults to `"week"` inside the toolbar hook. */
  view: CalendarView;
  /** Emitted when the user switches views via the toolbar. */
  onViewChange?: (view: CalendarView) => void;
  /**
   * Emitted when the user navigates (prev/next/today). Wired to
   * {@link "@/components/calendar/use-calendar-navigation".useCalendarNavigation}
   * in the reference implementation.
   */
  onNavigate?: (date: Date) => void;
  /**
   * Optional slot rendered as the toolbar's trailing action (typically a
   * "New session" primary button). Passed through
   * {@link "@/components/calendar/calendar-toolbar".CalendarToolbar}.
   */
  toolbarAction?: ReactNode;
}
