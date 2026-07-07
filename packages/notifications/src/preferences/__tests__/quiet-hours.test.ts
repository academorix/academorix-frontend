/**
 * @file quiet-hours.test.ts
 * @module @academorix/notifications/preferences/__tests__/quiet-hours.test
 *
 * @description
 * Unit tests for {@link isWithinQuietHours} + {@link isQuietHoursWindow}
 * + {@link parseHhMm}. Covers:
 *
 *  - Normal (non-wrapping) window: inside/edges/outside.
 *  - Wrap-around window (start > end): before, between, after.
 *  - Zero-length window (start == end): never quiet.
 *  - Timezone projection: same instant, different windows.
 *  - Empty-object / null discriminator: no window ⇒ never quiet.
 *  - Malformed `HH:mm` strings ⇒ never quiet.
 */

import { describe, expect, it } from "vitest";

import {
  isQuietHoursWindow,
  isWithinQuietHours,
  minutesOfDayInTimezone,
  parseHhMm,
} from "../quiet-hours.util";

import type { QuietHoursWindow } from "../preferences.type";

/**
 * Builds a Date whose UTC clock reads `hh:mm`. All the window tests
 * that pin a timezone below stay reproducible because we work off
 * the same absolute instant + explicit timezone.
 */
function utcAt(hh: number, mm: number): Date {
  return new Date(Date.UTC(2025, 0, 15, hh, mm, 0, 0));
}

describe("parseHhMm", () => {
  it("parses valid HH:mm strings to total minutes", () => {
    expect(parseHhMm("00:00")).toBe(0);
    expect(parseHhMm("09:30")).toBe(9 * 60 + 30);
    expect(parseHhMm("23:59")).toBe(23 * 60 + 59);
  });

  it("accepts a single-digit hour (H:mm) — common backend format", () => {
    expect(parseHhMm("7:05")).toBe(7 * 60 + 5);
  });

  it("returns null for malformed strings", () => {
    expect(parseHhMm("")).toBeNull();
    expect(parseHhMm("garbage")).toBeNull();
    expect(parseHhMm("24:00")).toBeNull();
    expect(parseHhMm("12:60")).toBeNull();
    expect(parseHhMm("12:5")).toBeNull(); // minute must be two digits
    expect(parseHhMm("-1:00")).toBeNull();
  });
});

describe("minutesOfDayInTimezone", () => {
  it("projects a UTC instant into a local timezone", () => {
    // 22:00 UTC on 15 Jan → 22:00 in UTC → 22:00 in Europe/London
    // (GMT / no DST offset in January).
    expect(minutesOfDayInTimezone(utcAt(22, 0), "UTC")).toBe(22 * 60);
    expect(minutesOfDayInTimezone(utcAt(22, 0), "Europe/London")).toBe(22 * 60);
  });

  it("wraps the previous / next day when the projection crosses midnight", () => {
    // 03:00 UTC in Europe/London → still 03:00 (GMT, no DST).
    // 03:00 UTC in Pacific/Auckland → +13h → 16:00 same day.
    expect(minutesOfDayInTimezone(utcAt(3, 0), "Pacific/Auckland")).toBe(16 * 60);
  });
});

describe("isQuietHoursWindow", () => {
  const window: QuietHoursWindow = {
    start: "22:00",
    end: "07:00",
    timezone: "Europe/London",
  };

  it("returns true for a full window", () => {
    expect(isQuietHoursWindow(window)).toBe(true);
  });

  it("returns false for an empty object (the 'no quiet hours' shape)", () => {
    expect(isQuietHoursWindow({})).toBe(false);
  });

  it("returns false for null / undefined", () => {
    expect(isQuietHoursWindow(null)).toBe(false);
    expect(isQuietHoursWindow(undefined)).toBe(false);
  });

  it("returns false when required fields are missing", () => {
    // Partial windows shouldn't be treated as valid — a
    // half-configured window in preferences would silently drop
    // deliveries, which is worse UX than treating it as "off".
    expect(isQuietHoursWindow({ start: "22:00" } as unknown as QuietHoursWindow)).toBe(false);
    expect(
      isQuietHoursWindow({ start: "22:00", end: "07:00" } as unknown as QuietHoursWindow),
    ).toBe(false);
  });
});

describe("isWithinQuietHours — normal (non-wrapping) window", () => {
  const window: QuietHoursWindow = {
    start: "09:00",
    end: "17:00",
    timezone: "UTC",
  };

  it("blocks the moment inside the window", () => {
    expect(isWithinQuietHours(window, utcAt(12, 0))).toBe(true);
  });

  it("blocks at the inclusive start edge", () => {
    expect(isWithinQuietHours(window, utcAt(9, 0))).toBe(true);
  });

  it("allows at the exclusive end edge", () => {
    expect(isWithinQuietHours(window, utcAt(17, 0))).toBe(false);
  });

  it("allows the moment before the window", () => {
    expect(isWithinQuietHours(window, utcAt(8, 59))).toBe(false);
  });

  it("allows the moment after the window", () => {
    expect(isWithinQuietHours(window, utcAt(17, 30))).toBe(false);
  });
});

describe("isWithinQuietHours — wrap-around window", () => {
  const window: QuietHoursWindow = {
    start: "22:00",
    end: "07:00",
    timezone: "UTC",
  };

  it("blocks late evening", () => {
    expect(isWithinQuietHours(window, utcAt(23, 30))).toBe(true);
  });

  it("blocks just after midnight", () => {
    expect(isWithinQuietHours(window, utcAt(0, 15))).toBe(true);
  });

  it("blocks at the inclusive start edge (22:00)", () => {
    expect(isWithinQuietHours(window, utcAt(22, 0))).toBe(true);
  });

  it("allows at the exclusive end edge (07:00)", () => {
    expect(isWithinQuietHours(window, utcAt(7, 0))).toBe(false);
  });

  it("allows mid-morning", () => {
    expect(isWithinQuietHours(window, utcAt(9, 0))).toBe(false);
  });
});

describe("isWithinQuietHours — zero-length + malformed", () => {
  it("never blocks a zero-length window", () => {
    const window: QuietHoursWindow = {
      start: "10:00",
      end: "10:00",
      timezone: "UTC",
    };

    expect(isWithinQuietHours(window, utcAt(10, 0))).toBe(false);
    expect(isWithinQuietHours(window, utcAt(11, 0))).toBe(false);
  });

  it("treats malformed HH:mm as 'no quiet hours'", () => {
    const window = {
      start: "garbage",
      end: "07:00",
      timezone: "UTC",
    } as unknown as QuietHoursWindow;

    expect(isWithinQuietHours(window, utcAt(23, 30))).toBe(false);
  });

  it("treats an empty object as 'no quiet hours'", () => {
    expect(isWithinQuietHours({})).toBe(false);
  });

  it("treats null / undefined as 'no quiet hours'", () => {
    expect(isWithinQuietHours(null)).toBe(false);
    expect(isWithinQuietHours(undefined)).toBe(false);
  });
});

describe("isWithinQuietHours — timezone projection", () => {
  it("projects the same instant into different local windows", () => {
    // 03:00 UTC — Auckland (+13h in Jan) reads 16:00 local time.
    // Same window (22..07) is NOT quiet at 16:00 Auckland; IS quiet
    // at 03:00 UTC.
    const aucklandWindow: QuietHoursWindow = {
      start: "22:00",
      end: "07:00",
      timezone: "Pacific/Auckland",
    };
    const utcWindow: QuietHoursWindow = {
      start: "22:00",
      end: "07:00",
      timezone: "UTC",
    };

    const instant = utcAt(3, 0);

    expect(isWithinQuietHours(aucklandWindow, instant)).toBe(false);
    expect(isWithinQuietHours(utcWindow, instant)).toBe(true);
  });
});
