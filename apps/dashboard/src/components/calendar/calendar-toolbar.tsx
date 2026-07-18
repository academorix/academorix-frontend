/**
 * @file calendar-toolbar.tsx
 * @module components/calendar/calendar-toolbar
 *
 * @description
 * The shared calendar toolbar. Renders three view-switcher buttons
 * (`Day` / `Week` / `Month`), the current-period label, a
 * `Prev` / `Today` / `Next` cluster, and a trailing action slot for the
 * module's primary CTA (e.g. "New session").
 *
 * The toolbar owns *no* state — it is a controlled component driven by the
 * consumer's `useCalendarNavigation` state. Splitting state ownership from
 * rendering keeps the toolbar reusable across modules and testable in
 * isolation.
 */

import { ArrowLeftIcon, ArrowRightIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button } from "@stackra/ui/react";

import type { CalendarView } from "@/components/calendar/calendar.types";
import type { ReactNode } from "react";

import { startOfMonth, startOfWeek } from "@/components/calendar/use-calendar-navigation";

/** Props for {@link CalendarToolbar}. */
export interface CalendarToolbarProps {
  /** Currently visible anchor date — drives the period label. */
  currentDate: Date;

  /** Active view mode. */
  view: CalendarView;

  /** Called when the user chooses a different view via the segment. */
  onViewChange: (view: CalendarView) => void;

  /** Called when the user presses the "Previous" button. */
  onPrev: () => void;

  /** Called when the user presses the "Next" button. */
  onNext: () => void;

  /** Called when the user presses the "Today" button. */
  onToday: () => void;

  /**
   * Optional trailing slot for module-specific CTAs (e.g. a "New session"
   * primary button). Rendered right-aligned inside the toolbar.
   */
  trailingAction?: ReactNode;

  /**
   * Optional aria label prefix used on nav buttons. Defaults to `"Calendar"`;
   * a module-specific label yields more accurate screen-reader announcements.
   */
  ariaLabel?: string;
}

/** Human-readable label for each view. Colocated so translations only touch
 *  one file. */
const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

/**
 * Formats the visible period label based on the active view.
 *
 * - `day`: `"Monday, January 13, 2025"`
 * - `week`: `"Jan 13 – 19, 2025"` (or `"Dec 30 – Jan 5, 2025"` when crossing
 *   a month boundary)
 * - `month`: `"January 2025"`
 */
function formatPeriodLabel(date: Date, view: CalendarView): string {
  if (view === "day") {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (view === "month") {
    const anchor = startOfMonth(date);

    return anchor.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  // Week view: format "Jan 13 – 19, 2025", with month bracket when spanning.
  const weekStart = startOfWeek(date);
  const weekEnd = new Date(weekStart);

  weekEnd.setDate(weekEnd.getDate() + 6);

  const sameMonth =
    weekStart.getMonth() === weekEnd.getMonth() &&
    weekStart.getFullYear() === weekEnd.getFullYear();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const startFormat = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (sameMonth) {
    // "Jan 13 – 19, 2025"
    return `${startFormat} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }

  const endFormat = weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (sameYear) {
    // "Jan 27 – Feb 2, 2025"
    return `${startFormat} – ${endFormat}, ${weekEnd.getFullYear()}`;
  }

  // Cross-year: "Dec 30, 2024 – Jan 5, 2025"
  return `${startFormat}, ${weekStart.getFullYear()} – ${endFormat}, ${weekEnd.getFullYear()}`;
}

/**
 * The controlled calendar toolbar. See file docstring for the design contract.
 */
export function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  trailingAction,
  ariaLabel = "Calendar",
}: CalendarToolbarProps): ReactNode {
  return (
    <div className="calendar-toolbar flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2">
      {/* View switcher — plain buttons rather than a Segment because HeroUI
          Pro's Segment component isn't verified in this workspace yet. Keeps
          the toolbar minimal-dependency. */}
      <div
        aria-label={`${ariaLabel} view`}
        className="calendar-toolbar__views inline-flex overflow-hidden rounded-md border border-border"
        role="tablist"
      >
        {(["day", "week", "month"] as const).map((candidate) => {
          const isActive = candidate === view;

          return (
            <button
              key={candidate}
              aria-selected={isActive}
              className={`px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-accent/10 hover:text-foreground"
              }`}
              role="tab"
              type="button"
              onClick={() => onViewChange(candidate)}
            >
              {VIEW_LABELS[candidate]}
            </button>
          );
        })}
      </div>

      {/* Period label + nav cluster. */}
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          aria-label={`Previous ${view}`}
          size="sm"
          variant="ghost"
          onPress={onPrev}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
        </Button>
        <Button aria-label="Today" size="sm" variant="secondary" onPress={onToday}>
          Today
        </Button>
        <Button isIconOnly aria-label={`Next ${view}`} size="sm" variant="ghost" onPress={onNext}>
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>

        {/* Visible period — tabular-nums keeps the badge from shifting when
            the digits change. */}
        <span
          aria-live="polite"
          className="ml-2 hidden text-sm font-medium text-foreground tabular-nums sm:inline"
        >
          {formatPeriodLabel(currentDate, view)}
        </span>
      </div>

      {/* Trailing action slot — module owns whatever renders here. */}
      {trailingAction ? (
        <div className="calendar-toolbar__action ml-auto flex items-center gap-2">
          {trailingAction}
        </div>
      ) : null}
    </div>
  );
}

// Also exported so tests can pin the formatter's output without spinning up
// the toolbar itself.
export { formatPeriodLabel };
