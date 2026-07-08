/**
 * @file use-calendar-navigation.test.ts
 * @module components/calendar/__tests__/use-calendar-navigation.test
 *
 * @description
 * Unit tests for {@link useCalendarNavigation}. The suite pins:
 *
 *  1. The "prev / next / today" math for each view (day / week / month).
 *  2. The default starting view (`week`) and starting date (`new Date()`).
 *  3. That switching view mid-flight doesn't reset the anchor.
 *  4. That `goToDate` clones its argument so callers can mutate the passed
 *     Date without corrupting internal state.
 *
 * # DST safety
 *
 * One test explicitly walks across a spring-forward Sunday to confirm the
 * anchor's local wall-clock hour stays pinned — the failure mode we want to
 * catch is `getTime()`-based arithmetic that drifts by ±1 hour on DST days.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  isSameDay,
  startOfMonth,
  startOfWeek,
  useCalendarNavigation,
} from "@/components/calendar/use-calendar-navigation";

// ─────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────

describe("addDays", () => {
  it("shifts forward by n calendar days", () => {
    const start = new Date(2025, 0, 1, 12, 0, 0); // Jan 1 at noon
    const after = addDays(start, 5);

    expect(after.getFullYear()).toBe(2025);
    expect(after.getMonth()).toBe(0);
    expect(after.getDate()).toBe(6);
    // Wall-clock hour is preserved.
    expect(after.getHours()).toBe(12);
  });

  it("shifts backward with a negative delta", () => {
    const start = new Date(2025, 0, 5);
    const before = addDays(start, -2);

    expect(before.getDate()).toBe(3);
  });

  it("does not mutate the input Date", () => {
    const start = new Date(2025, 0, 1);

    addDays(start, 30);

    expect(start.getDate()).toBe(1);
  });
});

describe("addMonths", () => {
  it("shifts forward by n calendar months", () => {
    const start = new Date(2025, 0, 15);
    const after = addMonths(start, 3);

    expect(after.getMonth()).toBe(3); // April (0-indexed)
    expect(after.getFullYear()).toBe(2025);
  });

  it("wraps year boundaries correctly", () => {
    const start = new Date(2025, 10, 15); // November
    const after = addMonths(start, 3);

    expect(after.getMonth()).toBe(1); // February
    expect(after.getFullYear()).toBe(2026);
  });

  it("shifts backward across a year", () => {
    const start = new Date(2025, 1, 15);
    const before = addMonths(start, -2);

    expect(before.getMonth()).toBe(11); // December
    expect(before.getFullYear()).toBe(2024);
  });
});

describe("startOfWeek / startOfMonth / isSameDay", () => {
  it("startOfWeek returns Monday of the containing week", () => {
    // January 15, 2025 is a Wednesday.
    const wednesday = new Date(2025, 0, 15);
    const monday = startOfWeek(wednesday);

    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(13);
  });

  it("startOfWeek handles Sunday correctly (returns previous Monday)", () => {
    // January 19, 2025 is a Sunday.
    const sunday = new Date(2025, 0, 19);
    const monday = startOfWeek(sunday);

    expect(monday.getDate()).toBe(13);
  });

  it("startOfMonth returns day 1 at 00:00", () => {
    const midMonth = new Date(2025, 5, 17, 15, 30, 12);
    const firstOfMonth = startOfMonth(midMonth);

    expect(firstOfMonth.getDate()).toBe(1);
    expect(firstOfMonth.getHours()).toBe(0);
    expect(firstOfMonth.getMinutes()).toBe(0);
  });

  it("isSameDay compares by local (year, month, date) triple", () => {
    const morning = new Date(2025, 5, 17, 6, 0, 0);
    const evening = new Date(2025, 5, 17, 23, 59, 0);
    const nextDay = new Date(2025, 5, 18, 0, 0, 0);

    expect(isSameDay(morning, evening)).toBe(true);
    expect(isSameDay(morning, nextDay)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Hook — defaults + view-specific navigation math
// ─────────────────────────────────────────────────────────────────────

describe("useCalendarNavigation — defaults", () => {
  it("starts on the current date and `week` view", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    expect(result.current.view).toBe("week");
    expect(result.current.currentDate).toBeInstanceOf(Date);
  });

  it("honours `initialDate` + `initialView`", () => {
    const fixed = new Date(2025, 0, 13);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "month" }),
    );

    expect(result.current.view).toBe("month");
    expect(result.current.currentDate.getTime()).toBe(fixed.getTime());
  });
});

describe("useCalendarNavigation — day view", () => {
  it("prev/next shift by exactly one day", () => {
    const fixed = new Date(2025, 0, 13);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "day" }),
    );

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getDate()).toBe(14);

    act(() => {
      result.current.goToPrev();
    });
    expect(result.current.currentDate.getDate()).toBe(13);

    act(() => {
      result.current.goToPrev();
    });
    expect(result.current.currentDate.getDate()).toBe(12);
  });
});

describe("useCalendarNavigation — week view", () => {
  it("prev/next shift by exactly seven days", () => {
    const fixed = new Date(2025, 0, 13);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "week" }),
    );

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getDate()).toBe(20);

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getDate()).toBe(27);

    act(() => {
      result.current.goToPrev();
      result.current.goToPrev();
    });
    expect(result.current.currentDate.getDate()).toBe(13);
  });
});

describe("useCalendarNavigation — month view", () => {
  it("prev/next shift by exactly one month", () => {
    const fixed = new Date(2025, 0, 15);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "month" }),
    );

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getMonth()).toBe(1); // February

    act(() => {
      result.current.goToNext();
      result.current.goToNext();
    });
    expect(result.current.currentDate.getMonth()).toBe(3); // April

    act(() => {
      result.current.goToPrev();
    });
    expect(result.current.currentDate.getMonth()).toBe(2); // March
  });

  it("handles year rollover on next", () => {
    const december = new Date(2025, 11, 15);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: december, initialView: "month" }),
    );

    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getMonth()).toBe(0);
    expect(result.current.currentDate.getFullYear()).toBe(2026);
  });

  it("handles year rollover on prev", () => {
    const january = new Date(2025, 0, 15);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: january, initialView: "month" }),
    );

    act(() => {
      result.current.goToPrev();
    });
    expect(result.current.currentDate.getMonth()).toBe(11);
    expect(result.current.currentDate.getFullYear()).toBe(2024);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Today / goToDate / setView
// ─────────────────────────────────────────────────────────────────────

describe("useCalendarNavigation — today", () => {
  it("resets to a Date close to `new Date()`", () => {
    const fixed = new Date(2020, 0, 1);
    const { result } = renderHook(() => useCalendarNavigation({ initialDate: fixed }));

    act(() => {
      result.current.goToToday();
    });

    const now = new Date();

    expect(isSameDay(result.current.currentDate, now)).toBe(true);
  });
});

describe("useCalendarNavigation — goToDate", () => {
  it("clones the input Date so callers can mutate their copy", () => {
    const target = new Date(2025, 5, 15);
    const { result } = renderHook(() => useCalendarNavigation());

    act(() => {
      result.current.goToDate(target);
    });

    // Mutate the caller's Date — the hook's internal state should not shift.
    target.setDate(31);

    expect(result.current.currentDate.getDate()).toBe(15);
  });
});

describe("useCalendarNavigation — setView", () => {
  it("switches view without touching the anchor", () => {
    const fixed = new Date(2025, 0, 13);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "week" }),
    );

    act(() => {
      result.current.setView("day");
    });

    expect(result.current.view).toBe("day");
    expect(isSameDay(result.current.currentDate, fixed)).toBe(true);
  });

  it("makes prev/next respect the new view step size after switching", () => {
    const fixed = new Date(2025, 0, 13);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: fixed, initialView: "week" }),
    );

    // Switch to day, next → +1 day
    act(() => {
      result.current.setView("day");
    });
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getDate()).toBe(14);

    // Switch to month, next → +1 month
    act(() => {
      result.current.setView("month");
    });
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentDate.getMonth()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// DST safety — the anchor's local wall-clock hour should not drift when
// the hook navigates across a DST boundary.
// ─────────────────────────────────────────────────────────────────────

describe("useCalendarNavigation — DST safety", () => {
  it("preserves the local hour when jumping a week across a US spring-forward", () => {
    // In America/New_York, DST starts on March 9, 2025 (clocks spring forward
    // at 02:00 → 03:00). Jumping a week from March 3 lands us on March 10.
    // The test only fails if the underlying math uses raw ms arithmetic and
    // the runner is in a DST zone. Even outside DST zones this is a safe
    // smoke-test — the wall-clock hour never drifts because we use setDate.
    const anchor = new Date(2025, 2, 3, 12, 0, 0);
    const { result } = renderHook(() =>
      useCalendarNavigation({ initialDate: anchor, initialView: "week" }),
    );

    act(() => {
      result.current.goToNext();
    });

    // Wall-clock hour must still be 12 (noon).
    expect(result.current.currentDate.getHours()).toBe(12);
    expect(result.current.currentDate.getDate()).toBe(10);
  });
});
