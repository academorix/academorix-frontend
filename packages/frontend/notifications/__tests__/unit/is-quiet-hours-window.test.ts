/**
 * @file is-quiet-hours-window.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Tests for {@link isQuietHoursWindow} — the
 *   preferences discriminated-union type guard.
 */

import { describe, expect, it } from "vitest";

import { isQuietHoursWindow } from "@/core/utils";

describe("isQuietHoursWindow", () => {
  it("accepts a well-formed window", () => {
    expect(isQuietHoursWindow({ start: "22:00", end: "07:00", timezone: "UTC" })).toBe(true);
  });

  it("rejects an empty object", () => {
    expect(isQuietHoursWindow({})).toBe(false);
  });

  it("rejects null / undefined / primitives", () => {
    expect(isQuietHoursWindow(null)).toBe(false);
    expect(isQuietHoursWindow(undefined)).toBe(false);
    expect(isQuietHoursWindow("22:00")).toBe(false);
    expect(isQuietHoursWindow(1)).toBe(false);
  });

  it("rejects a window with missing fields", () => {
    expect(isQuietHoursWindow({ start: "22:00", end: "07:00" })).toBe(false);
    expect(isQuietHoursWindow({ start: "22:00", timezone: "UTC" })).toBe(false);
    expect(isQuietHoursWindow({ end: "07:00", timezone: "UTC" })).toBe(false);
  });

  it("rejects a window with empty string fields", () => {
    expect(isQuietHoursWindow({ start: "", end: "07:00", timezone: "UTC" })).toBe(false);
    expect(isQuietHoursWindow({ start: "22:00", end: "", timezone: "UTC" })).toBe(false);
    expect(isQuietHoursWindow({ start: "22:00", end: "07:00", timezone: "" })).toBe(false);
  });
});
