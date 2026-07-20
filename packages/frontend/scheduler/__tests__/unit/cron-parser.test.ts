/**
 * @file cron-parser.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Behavioural tests for `parseCron`, `getNextCronTime`,
 *   and `getNextCronDelay`. Locks the parser semantics (wildcards,
 *   ranges, lists, steps, extended 6-field syntax) so consumers can
 *   rely on the numeric representation of cron expressions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseCron, getNextCronTime, getNextCronDelay } from "@/core/utils/cron-parser.util";

describe("parseCron — 5-field expressions", () => {
  it("expands wildcards into full-range value arrays", () => {
    const fields = parseCron("* * * * *");
    expect(fields.minutes.length).toBe(60);
    expect(fields.minutes[0]).toBe(0);
    expect(fields.minutes[59]).toBe(59);
    expect(fields.hours.length).toBe(24);
    expect(fields.daysOfMonth[0]).toBe(1); // 1..31
    expect(fields.daysOfMonth[fields.daysOfMonth.length - 1]).toBe(31);
    expect(fields.months[0]).toBe(1); // 1..12
    expect(fields.months[fields.months.length - 1]).toBe(12);
    expect(fields.daysOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // No seconds field on 5-field syntax.
    expect(fields.seconds).toBeUndefined();
  });

  it("parses exact values", () => {
    const fields = parseCron("30 3 15 6 2");
    expect(fields.minutes).toEqual([30]);
    expect(fields.hours).toEqual([3]);
    expect(fields.daysOfMonth).toEqual([15]);
    expect(fields.months).toEqual([6]);
    expect(fields.daysOfWeek).toEqual([2]);
  });

  it("parses ranges (start-end)", () => {
    const fields = parseCron("* 9-17 * * 1-5");
    expect(fields.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(fields.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
  });

  it("parses lists (a,b,c)", () => {
    const fields = parseCron("0,15,30,45 * * * *");
    expect(fields.minutes).toEqual([0, 15, 30, 45]);
  });

  it("parses steps on wildcards (star/step)", () => {
    const fields = parseCron("*/15 * * * *");
    expect(fields.minutes).toEqual([0, 15, 30, 45]);
  });

  it("parses steps with a range prefix", () => {
    const fields = parseCron("0-30/10 * * * *");
    expect(fields.minutes).toEqual([0, 10, 20, 30]);
  });

  it("throws for the wrong number of fields", () => {
    expect(() => parseCron("* * *")).toThrow(/Invalid cron/);
    expect(() => parseCron("too many fields here for a cron expression")).toThrow(/Invalid/);
  });
});

describe("parseCron — 6-field expressions", () => {
  it("adds a seconds field", () => {
    const fields = parseCron("*/30 * * * * *");
    expect(fields.seconds).toEqual([0, 30]);
    // Remaining fields still filled.
    expect(fields.minutes.length).toBe(60);
  });
});

describe("getNextCronTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the next matching minute in the future", () => {
    vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));

    // Every minute — next fire is 12:01.
    const next = getNextCronTime("* * * * *");
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(Date.now());
    // At most one minute + 1s ahead.
    expect(next!.getTime()).toBeLessThanOrEqual(Date.now() + 60_000 + 1_500);
  });

  it("respects an explicit `from` reference", () => {
    const anchor = new Date("2025-01-01T12:00:00.000Z");
    const next = getNextCronTime("30 3 * * *", anchor);
    expect(next).not.toBeNull();
    // 3:30 AM occurs after the anchor.
    expect(next!.getTime()).toBeGreaterThan(anchor.getTime());
  });
});

describe("getNextCronDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a positive delay for a future match", () => {
    vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
    const delay = getNextCronDelay("* * * * *");
    expect(delay).not.toBeNull();
    expect(delay!).toBeGreaterThan(0);
    // 5-field wildcard fires at the top of the NEXT minute — never
    // sub-second (see the minute-boundary test below).
    expect(delay!).toBe(60_000);
  });

  it("`* * * * *` schedules at the top of the NEXT minute, not the next second", () => {
    // Regression guard: previously `getNextCronTime` returned the
    // current second's match, and the runner re-scheduled with a
    // 1s delay, firing 60×/minute.
    vi.setSystemTime(new Date("2025-01-01T12:00:00.500Z"));
    const next = getNextCronTime("* * * * *");
    expect(next).not.toBeNull();
    // Top of 12:01:00 UTC — 500ms after "now" + one whole minute.
    expect(next!.toISOString()).toBe("2025-01-01T12:01:00.000Z");
  });

  it("`* * * * *` from an exact minute boundary advances to the next minute", () => {
    // At :00.000 exactly, `getNextCronTime` skips ahead to the
    // FOLLOWING minute — never re-fires on the current minute.
    vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
    const next = getNextCronTime("* * * * *");
    expect(next!.toISOString()).toBe("2025-01-01T12:01:00.000Z");
  });

  it("`0 * * * *` hourly-at-:00 fires at the next :00 minute", () => {
    vi.setSystemTime(new Date("2025-01-01T12:29:50.000Z"));
    const next = getNextCronTime("0 * * * *");
    expect(next!.toISOString()).toBe("2025-01-01T13:00:00.000Z");
  });
});
