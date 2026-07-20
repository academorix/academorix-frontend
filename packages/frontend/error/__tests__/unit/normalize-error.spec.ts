/**
 * @file normalize-error.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `normalizeError(value)` — coerce
 *   any thrown value into a real `Error` instance.
 */

import { describe, expect, it } from "vitest";

import { normalizeError } from "@/core/utils/normalize-error.util";

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("normalizeError", () => {
  it("returns an existing Error instance unchanged (same reference)", () => {
    const err = new TypeError("bad arg");
    // The helper MUST NOT clone — reporters rely on the original
    // stack trace being preserved by reference.
    expect(normalizeError(err)).toBe(err);
  });

  it("preserves subclass identity for Error subclasses", () => {
    class AppError extends Error {
      public constructor() {
        super("app-error");
        this.name = "AppError";
      }
    }
    const err = new AppError();
    const result = normalizeError(err);
    expect(result).toBe(err);
    expect(result).toBeInstanceOf(AppError);
  });

  it("wraps a raw string as `new Error(value)`", () => {
    const result = normalizeError("boom");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("boom");
  });

  it("JSON-stringifies a plain object into the message", () => {
    const result = normalizeError({ code: 42, msg: "oops" });
    expect(result).toBeInstanceOf(Error);
    // Object property order MAY vary — assert on parse round-trip.
    expect(JSON.parse(result.message)).toEqual({ code: 42, msg: "oops" });
  });

  it("falls back to `String(value)` when JSON.stringify throws (circular refs)", () => {
    // Introduce a cycle so JSON.stringify raises TypeError.
    const cyclic: Record<string, unknown> = { name: "a" };
    cyclic.self = cyclic;
    const result = normalizeError(cyclic);
    expect(result).toBeInstanceOf(Error);
    // The exact message is `String(cyclic)` which is "[object Object]".
    expect(result.message).toBe("[object Object]");
  });

  it("handles `undefined` and `null` gracefully", () => {
    // Neither of these is JSON-stringifiable to a truthy string, but
    // the helper still returns an Error — `JSON.stringify(undefined)`
    // is `undefined`, which the Error constructor coerces to 'undefined'.
    expect(normalizeError(undefined)).toBeInstanceOf(Error);
    expect(normalizeError(null)).toBeInstanceOf(Error);
  });

  it("handles numbers and booleans", () => {
    expect(normalizeError(42).message).toBe("42");
    expect(normalizeError(false).message).toBe("false");
  });
});
