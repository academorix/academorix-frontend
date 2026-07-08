/**
 * @file index.ts
 * @module components/calendar
 *
 * @description
 * Public barrel for the shared calendar component. Modules build their own
 * agenda / bookings / scheduling pages on top of these primitives without
 * ever reaching into individual files.
 *
 * ## What's here
 *
 *  - {@link CalendarWeek}    — a 7-column week view with hour rows.
 *  - {@link CalendarDay}     — a single-day agenda list grouped by hour.
 *  - {@link CalendarMonth}   — a month grid with day cells + event dots.
 *  - {@link CalendarToolbar} — the shared toolbar (view switcher + nav).
 *  - {@link useCalendarNavigation} — controlled navigation state hook.
 *
 * See `calendar.types.ts` for the shape of `CalendarEvent<TMeta>` and the
 * `CalendarView` union.
 */

export * from "@/components/calendar/calendar.types";
export { CalendarWeek } from "@/components/calendar/calendar-week";
export { CalendarDay } from "@/components/calendar/calendar-day";
export { CalendarMonth } from "@/components/calendar/calendar-month";
export {
  CalendarToolbar,
  formatPeriodLabel,
} from "@/components/calendar/calendar-toolbar";
export type { CalendarToolbarProps } from "@/components/calendar/calendar-toolbar";
export {
  useCalendarNavigation,
  addDays,
  addMonths,
  startOfDay,
  startOfMonth,
  startOfWeek,
  isSameDay,
} from "@/components/calendar/use-calendar-navigation";
export type {
  UseCalendarNavigationOptions,
  UseCalendarNavigationReturn,
} from "@/components/calendar/use-calendar-navigation";
