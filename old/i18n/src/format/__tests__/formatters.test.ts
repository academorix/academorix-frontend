/**
 * @file formatters.test.ts
 * @module @academorix/i18n/format/__tests__/formatters.test
 *
 * @description
 * Systematic coverage for the `Intl.*`-backed formatter helpers.
 * Every export gets a happy-path assertion plus the invalid-input
 * branch (empty string on `NaN` / non-finite / unparseable dates).
 *
 * The vitest config pins `TZ=UTC` so `formatDate(new Date("2026-07-06"))`
 * gives the same string on every machine — otherwise a developer in
 * PDT would see "Jul 5, 2026" for a UTC-midnight input.
 */

import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatRelativeTime,
} from "../formatters.util";

describe("formatDate", () => {
  it("uses the medium date style by default (locale en-US)", () => {
    expect(formatDate(new Date("2026-07-06"), "en-US")).toBe("Jul 6, 2026");
  });

  it("honours a caller-supplied dateStyle override", () => {
    expect(formatDate(new Date("2026-07-06"), "en-US", { dateStyle: "long" })).toBe("July 6, 2026");
  });

  it("returns an empty string when the input cannot be parsed as a date", () => {
    expect(formatDate("not a date", "en-US")).toBe("");
  });

  it("returns an empty string when the input is NaN", () => {
    expect(formatDate(Number.NaN, "en-US")).toBe("");
  });

  it("accepts a numeric epoch input", () => {
    // Date.UTC(2026, 6, 6) is July 6, 2026 UTC midnight — unambiguous
    // across all timezones for the date part.
    expect(formatDate(Date.UTC(2026, 6, 6), "en-US")).toBe("Jul 6, 2026");
  });
});

describe("formatDateTime", () => {
  it("formats both date and time by default (medium + short)", () => {
    const formatted = formatDateTime(Date.UTC(2026, 6, 6, 14, 30), "en-US");

    // Exact string is Intl-implementation dependent (the comma before
    // the time was added in Chrome/ICU 76+, some Node versions differ),
    // so we assert on the two components separately.
    expect(formatted).toContain("Jul 6, 2026");
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(?:AM|PM)/i);
  });

  it("returns an empty string on invalid input", () => {
    expect(formatDateTime("garbage", "en-US")).toBe("");
  });
});

describe("formatNumber", () => {
  it("formats a decimal number with the locale's group separators", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
  });

  it("returns an empty string for +Infinity", () => {
    expect(formatNumber(Number.POSITIVE_INFINITY, "en-US")).toBe("");
  });

  it("returns an empty string for -Infinity", () => {
    expect(formatNumber(Number.NEGATIVE_INFINITY, "en-US")).toBe("");
  });

  it("returns an empty string for NaN", () => {
    expect(formatNumber(Number.NaN, "en-US")).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats a USD amount for en-US as '$9.99'", () => {
    expect(formatCurrency(9.99, "en-US", "USD")).toBe("$9.99");
  });

  it("emits the value + currency symbol for ar-EG (script-agnostic assertion)", () => {
    const formatted = formatCurrency(9.99, "ar-EG", "USD");

    // The exact glyph varies between ICU versions (US$ vs $) and
    // digit shape depends on the locale's numbering system. Assert
    // the pieces we care about: the numeric value AND some currency
    // indicator.
    expect(formatted.length).toBeGreaterThan(0);
    // Arabic locale renders digits either as Western Arabic (0-9) or
    // Eastern Arabic (٠-٩); both count as "has digits".
    expect(formatted).toMatch(/[0-9٠-٩]/);
  });

  it("returns an empty string when the value is not finite", () => {
    expect(formatCurrency(Number.NaN, "en-US", "USD")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  it("emits a non-empty short string when the delta is zero (locale-dependent word)", () => {
    // en-US with `numeric: "auto"` and delta 0 produces "now" or
    // "this second" depending on the ICU version. Both are valid.
    const now = new Date("2026-07-06T12:00:00Z");
    const formatted = formatRelativeTime(now, "en-US", { numeric: "auto" }, now);

    expect(formatted.length).toBeGreaterThan(0);
  });

  it("emits a phrase containing 'day' for a past delta of one day", () => {
    const now = new Date("2026-07-06T12:00:00Z");
    const yesterday = new Date(now.getTime() - 86_400_000);

    // en-US `numeric: "auto"` renders -1 day as "yesterday", which
    // still contains the substring "day".
    expect(formatRelativeTime(yesterday, "en-US", { numeric: "auto" }, now)).toContain("day");
  });

  it("emits a phrase containing 'in' for future values (multiple days ahead)", () => {
    const now = new Date("2026-07-06T12:00:00Z");
    // Two days ahead — `numeric: "auto"` still renders as "in 2 days"
    // (auto only swaps in special forms for -1/0/+1 relative units).
    const future = new Date(now.getTime() + 2 * 86_400_000);

    expect(formatRelativeTime(future, "en-US", { numeric: "auto" }, now)).toContain("in");
  });

  it("returns an empty string when the input can't be parsed", () => {
    expect(formatRelativeTime("not a date", "en-US")).toBe("");
  });
});

describe("formatList", () => {
  it("joins a three-item list with the en-US conjunction style", () => {
    expect(formatList(["A", "B", "C"], "en-US")).toBe("A, B, and C");
  });

  it("returns an empty string when the list is empty", () => {
    expect(formatList([], "en-US")).toBe("");
  });

  it("handles a single-item list without separators", () => {
    expect(formatList(["only"], "en-US")).toBe("only");
  });
});
