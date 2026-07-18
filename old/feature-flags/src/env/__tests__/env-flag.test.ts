/**
 * @file env-flag.test.ts
 * @module @academorix/feature-flags/env/__tests__/env-flag.test
 *
 * @description
 * Coverage for {@link envFlag} — the boolean-typed env reader. Every
 * assertion pins the raw env value with `vi.stubEnv` so the tests
 * run identically in CI and on a developer's machine (regardless of
 * their local `.env` state).
 *
 * The reader falls through to `@academorix/core`'s `env<T>()`, which
 * uses `process.env` when `import.meta.env` isn't available (i.e. in
 * a Node/vitest run). Truthy strings are matched case-insensitively
 * against `["true", "1", "yes", "on"]`; anything else is `false`;
 * empty / absent falls back to the caller-supplied default.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { envFlag } from "../env-flag.util";

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("envFlag — absent env var", () => {
  it("returns the default when the variable is unset", () => {
    expect(envFlag("VITE_FEATURE_FLAG_ABSENT", false)).toBe(false);
    expect(envFlag("VITE_FEATURE_FLAG_ABSENT", true)).toBe(true);
  });

  it("returns the default when the variable is an empty string", () => {
    vi.stubEnv("VITE_FEATURE_FLAG_EMPTY", "");
    expect(envFlag("VITE_FEATURE_FLAG_EMPTY", true)).toBe(true);
    expect(envFlag("VITE_FEATURE_FLAG_EMPTY", false)).toBe(false);
  });
});

describe("envFlag — truthy coercion", () => {
  it("treats the literal string 'true' as true regardless of the default", () => {
    vi.stubEnv("VITE_FEATURE_TRUE", "true");
    expect(envFlag("VITE_FEATURE_TRUE", false)).toBe(true);
  });

  it("accepts uppercase TRUE case-insensitively", () => {
    vi.stubEnv("VITE_FEATURE_TRUE_UPPER", "TRUE");
    expect(envFlag("VITE_FEATURE_TRUE_UPPER", false)).toBe(true);
  });

  it("accepts mixed-case True case-insensitively", () => {
    vi.stubEnv("VITE_FEATURE_TRUE_MIXED", "True");
    expect(envFlag("VITE_FEATURE_TRUE_MIXED", false)).toBe(true);
  });

  it("treats '1' as true", () => {
    vi.stubEnv("VITE_FEATURE_ONE", "1");
    expect(envFlag("VITE_FEATURE_ONE", false)).toBe(true);
  });

  it("treats 'yes' as true", () => {
    vi.stubEnv("VITE_FEATURE_YES_LOWER", "yes");
    expect(envFlag("VITE_FEATURE_YES_LOWER", false)).toBe(true);
  });

  it("treats 'YES' as true (case-insensitive)", () => {
    vi.stubEnv("VITE_FEATURE_YES_UPPER", "YES");
    expect(envFlag("VITE_FEATURE_YES_UPPER", false)).toBe(true);
  });

  it("treats 'on' as true", () => {
    vi.stubEnv("VITE_FEATURE_ON_LOWER", "on");
    expect(envFlag("VITE_FEATURE_ON_LOWER", false)).toBe(true);
  });
});

describe("envFlag — falsy coercion", () => {
  it("treats 'false' as false", () => {
    vi.stubEnv("VITE_FEATURE_FALSE", "false");
    expect(envFlag("VITE_FEATURE_FALSE", true)).toBe(false);
  });

  it("treats '0' as false", () => {
    vi.stubEnv("VITE_FEATURE_ZERO", "0");
    expect(envFlag("VITE_FEATURE_ZERO", true)).toBe(false);
  });

  it("treats 'no' as false", () => {
    vi.stubEnv("VITE_FEATURE_NO", "no");
    expect(envFlag("VITE_FEATURE_NO", true)).toBe(false);
  });

  it("treats arbitrary garbage as false (safer than throwing)", () => {
    vi.stubEnv("VITE_FEATURE_GARBAGE", "banana");
    expect(envFlag("VITE_FEATURE_GARBAGE", true)).toBe(false);
  });
});
