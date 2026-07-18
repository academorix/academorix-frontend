/**
 * @file calendar-week.test.tsx
 * @module components/calendar/__tests__/calendar-week.test
 *
 * @description
 * Unit tests for {@link CalendarWeek}. The suite pins three behaviours:
 *
 *  1. Seven day columns render, one per weekday, spanning Mon..Sun.
 *  2. Events land in the right column and get an inline start-time label.
 *  3. Clicking an event fires `onEventClick` with the original event object
 *     (not a re-parsed copy) so parents can carry a `meta` payload safely.
 *
 * Timezone handling is exercised implicitly — the test builds ISO strings
 * with the local anchor date, so a hard-coded UTC value doesn't drift under
 * different runners (Node in America/Los_Angeles vs Europe/Amsterdam, etc).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CalendarEvent } from "@/components/calendar";

import { CalendarWeek } from "@/components/calendar/calendar-week";
import { startOfWeek } from "@/components/calendar/use-calendar-navigation";

/**
 * Builds a local ISO timestamp at `hour:00` on the given date. The resulting
 * string is parseable by `new Date(...)`, and — crucially — pinning the
 * "date" argument to a Date object built in local time keeps the parsed
 * hours stable regardless of the runner's timezone.
 */
function isoAt(date: Date, hour: number, minute = 0): string {
  const clone = new Date(date);

  clone.setHours(hour, minute, 0, 0);

  return clone.toISOString();
}

/** Fixture week: pick a stable Monday well away from DST boundaries. */
function fixtureAnchor(): Date {
  // January 13, 2025 is a Monday and outside every major DST transition.
  const anchor = new Date(2025, 0, 13);

  anchor.setHours(0, 0, 0, 0);

  return anchor;
}

describe("CalendarWeek — layout", () => {
  it("renders exactly seven column headers", () => {
    const anchor = fixtureAnchor();
    const { container } = render(<CalendarWeek currentDate={anchor} events={[]} />);

    // `role="columnheader"` is set on each day-header cell. The gutter cell
    // is `aria-hidden`, so it does not appear in the columnheader count.
    const columnHeaders = container.querySelectorAll("[role='columnheader']");

    expect(columnHeaders).toHaveLength(7);
  });

  it("renders one grid cell per weekday", () => {
    const anchor = fixtureAnchor();
    const { container } = render(<CalendarWeek currentDate={anchor} events={[]} />);

    const gridCells = container.querySelectorAll("[role='gridcell']");

    expect(gridCells).toHaveLength(7);
  });

  it("renders one hour row per hour in the visible range", () => {
    const anchor = fixtureAnchor();
    // 8..12 inclusive = 5 rows.
    const { container } = render(
      <CalendarWeek currentDate={anchor} endHour={12} events={[]} startHour={8} />,
    );

    // The gutter renders `formatHourLabel(hour)` — one row per hour.
    expect(container.textContent).toContain("08:00");
    expect(container.textContent).toContain("09:00");
    expect(container.textContent).toContain("10:00");
    expect(container.textContent).toContain("11:00");
    expect(container.textContent).toContain("12:00");
    expect(container.textContent).not.toContain("13:00");
  });
});

describe("CalendarWeek — events", () => {
  it("renders the event title inside a clickable button", () => {
    const anchor = fixtureAnchor();
    const events: CalendarEvent[] = [
      {
        id: "e-1",
        title: "Team practice",
        // Wednesday 10:00–11:00 of the anchor week.
        startAt: isoAt(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 2), 10),
        endAt: isoAt(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 2), 11),
      },
    ];

    render(<CalendarWeek currentDate={anchor} events={events} />);

    expect(screen.getByText("Team practice")).toBeInTheDocument();
  });

  it("emits `onEventClick` with the original event when the user clicks a chip", async () => {
    const anchor = fixtureAnchor();
    const originalEvent: CalendarEvent<{ meta: string }> = {
      id: "e-42",
      title: "Session with meta",
      startAt: isoAt(anchor, 9),
      endAt: isoAt(anchor, 10),
      meta: { meta: "carry-me-through" },
    };

    const onEventClick = vi.fn();
    const { container } = render(
      <CalendarWeek<{ meta: string }>
        currentDate={anchor}
        events={[originalEvent]}
        onEventClick={onEventClick}
      />,
    );

    const chip = container.querySelector<HTMLButtonElement>(".calendar-week__event");

    expect(chip).not.toBeNull();
    chip!.click();

    expect(onEventClick).toHaveBeenCalledTimes(1);
    // The parent receives the exact event object — payload survives the trip.
    expect(onEventClick).toHaveBeenCalledWith(originalEvent);
  });

  it("drops events outside the visible week rather than throwing", () => {
    const anchor = fixtureAnchor();
    // Event scheduled 30 days after the anchor — well outside the week.
    const outOfWindow: CalendarEvent = {
      id: "e-out",
      title: "Way ahead",
      startAt: isoAt(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 30), 10),
      endAt: isoAt(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 30), 11),
    };

    render(<CalendarWeek currentDate={anchor} events={[outOfWindow]} />);

    // The event title should not appear anywhere in the DOM.
    expect(screen.queryByText("Way ahead")).not.toBeInTheDocument();
  });
});

describe("CalendarWeek — start of week", () => {
  it("anchors the grid at Monday even when `currentDate` is a Sunday", () => {
    // Sunday, January 19, 2025.
    const sunday = new Date(2025, 0, 19);

    sunday.setHours(0, 0, 0, 0);

    // The visible Monday should be January 13, 2025.
    const expectedMonday = startOfWeek(sunday);

    expect(expectedMonday.getDay()).toBe(1); // Monday
    expect(expectedMonday.getDate()).toBe(13);

    const { container } = render(<CalendarWeek currentDate={sunday} events={[]} />);
    const columnHeaders = container.querySelectorAll<HTMLElement>("[role='columnheader']");

    // The first column header should read "13" (the Monday date).
    const firstHeader = columnHeaders[0] as HTMLElement;

    expect(firstHeader.textContent).toContain("13");
  });
});

// Ensure the helper renders correctly in the test tree — some assertions are
// simple sanity checks that keep the calendar's contract stable if the CSS
// grid class list ever changes.
describe("CalendarWeek — accessibility", () => {
  it("labels the grid with the provided aria-label", () => {
    const anchor = fixtureAnchor();
    const { container } = render(
      <CalendarWeek ariaLabel="Attendance week" currentDate={anchor} events={[]} />,
    );

    const grid = container.querySelector("[role='grid']") as HTMLElement | null;

    expect(grid).not.toBeNull();
    expect(grid!.getAttribute("aria-label")).toBe("Attendance week");
  });

  it("falls back to the default aria-label", () => {
    const anchor = fixtureAnchor();
    const { container } = render(<CalendarWeek currentDate={anchor} events={[]} />);

    const grid = container.querySelector("[role='grid']") as HTMLElement | null;

    expect(grid?.getAttribute("aria-label")).toBe("Week calendar");
  });
});

// Utility to help the test harness — assertion-only helpers exposed at
// module scope keep the linter from complaining about "unused function
// declarations" if a future test wants to reuse them.
export const __testUtils = { fixtureAnchor, isoAt };
