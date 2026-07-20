/**
 * @file env.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for the `env()` façade — the base string
 *   read, `.number` (NaN handling), `.bool` (truthy list),
 *   `.orFail` (missing-key error).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { env } from "@/core";

/**
 * Guarded env-var setter — snapshots the pre-test process.env and
 * restores it in `afterEach`. Prevents cross-test contamination
 * from mutating shared env vars.
 */
const originalEnv = { ...process.env };

describe("env()", () => {
  beforeEach(() => {
    // Reset process.env to the original snapshot at the start of
    // every test so nothing leaks between cases.
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  afterEach(() => {
    // Also clean up after — defense in depth.
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
  });

  it("reads a set env var", () => {
    process.env.TEST_APP_NAME = "my-app";
    expect(env("TEST_APP_NAME")).toBe("my-app");
  });

  it("returns the default when the var is unset", () => {
    delete process.env.TEST_UNSET;
    expect(env("TEST_UNSET", "fallback")).toBe("fallback");
  });

  it("returns an empty string when unset without a default", () => {
    delete process.env.TEST_NO_DEFAULT;
    expect(env("TEST_NO_DEFAULT")).toBe("");
  });
});

describe("env.number()", () => {
  it("parses a numeric string", () => {
    process.env.TEST_PORT = "3000";
    expect(env.number("TEST_PORT", 0)).toBe(3000);
  });

  it("returns the default on unset", () => {
    delete process.env.TEST_UNSET_NUM;
    expect(env.number("TEST_UNSET_NUM", 42)).toBe(42);
  });

  it("returns the default on a non-numeric string (NaN-safe)", () => {
    process.env.TEST_NAN = "not-a-number";
    expect(env.number("TEST_NAN", 42)).toBe(42);
  });
});

describe("env.bool()", () => {
  it.each([
    ["true", true],
    ["1", true],
    ["yes", true],
    ["on", true],
    ["TRUE", true],
    ["YES", true],
    ["false", false],
    ["0", false],
    ["no", false],
    ["off", false],
  ])("parses %s → %s", (raw, expected) => {
    process.env.TEST_BOOL = raw;
    expect(env.bool("TEST_BOOL", false)).toBe(expected);
  });

  it("returns the default when unset", () => {
    delete process.env.TEST_UNSET_BOOL;
    expect(env.bool("TEST_UNSET_BOOL", true)).toBe(true);
    expect(env.bool("TEST_UNSET_BOOL", false)).toBe(false);
  });
});

describe("env.orFail()", () => {
  it("returns the value when set", () => {
    process.env.TEST_REQUIRED = "value";
    expect(env.orFail("TEST_REQUIRED")).toBe("value");
  });

  it("throws a descriptive error when unset", () => {
    delete process.env.TEST_MISSING;
    expect(() => env.orFail("TEST_MISSING")).toThrow(/TEST_MISSING/);
  });
});
