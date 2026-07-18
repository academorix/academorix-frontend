/**
 * @file create-env-reader.test.ts
 * @module @academorix/core/env/__tests__/create-env-reader.test
 *
 * @description
 * Tests for {@link createEnvReader}. The factory takes a `read(key)`
 * closure the caller controls, so no globals stubbing is needed —
 * every runtime concern is isolated to the closure. Behaviour on the
 * closure's return value mirrors {@link env} — this suite verifies
 * the mirroring stays honest.
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createEnvReader } from "../env.util";

describe("createEnvReader()", () => {
  it("returns a function with the same signature as env()", () => {
    const reader = createEnvReader(() => undefined);

    expect(typeof reader).toBe("function");
    // The reader accepts (key, defaultValue) and optionally (..., schema).
    expect(reader.length).toBeGreaterThanOrEqual(2);
  });

  it("invokes the closure with the requested key", () => {
    const read = vi.fn(() => "raw-value");
    const reader = createEnvReader(read);

    reader("MY_KEY", "default");

    expect(read).toHaveBeenCalledExactlyOnceWith("MY_KEY");
  });

  describe("with a string default", () => {
    it("returns the raw string when the closure returns a value", () => {
      const reader = createEnvReader(() => "hello");

      expect(reader("KEY", "fallback")).toBe("hello");
    });

    it("coerces non-string returns to string", () => {
      const reader = createEnvReader(() => 42);

      // The util calls String(rawValue) internally — this becomes "42".
      expect(reader("KEY", "fallback")).toBe("42");
    });
  });

  describe("with a number default", () => {
    it("coerces the raw value via Number()", () => {
      const reader = createEnvReader(() => "8080");

      expect(reader("PORT", 3000)).toBe(8080);
    });

    it("falls back to the default on NaN", () => {
      const reader = createEnvReader(() => "not-a-number");

      expect(reader("PORT", 3000)).toBe(3000);
    });
  });

  describe("with a boolean default", () => {
    it.each(["true", "TRUE", "1", "yes", "YES", "on", "ON"])("treats %s as true", (raw) => {
      const reader = createEnvReader(() => raw);

      expect(reader("DEBUG", false)).toBe(true);
    });

    it.each(["false", "0", "no", "off", "anything-else"])("treats %s as false", (raw) => {
      const reader = createEnvReader(() => raw);

      expect(reader("DEBUG", true)).toBe(false);
    });
  });

  describe("fallback semantics for missing values", () => {
    it("returns the default when the closure returns undefined", () => {
      const reader = createEnvReader(() => undefined);

      expect(reader("MISSING", "default")).toBe("default");
    });

    it("returns the default when the closure returns null", () => {
      const reader = createEnvReader(() => null);

      expect(reader("MISSING", "default")).toBe("default");
    });

    it("returns the default when the closure returns an empty string", () => {
      const reader = createEnvReader(() => "");

      expect(reader("MISSING", "default")).toBe("default");
    });

    it("returns the default when the closure returns the literal string 'undefined'", () => {
      const reader = createEnvReader(() => "undefined");

      expect(reader("MISSING", "default")).toBe("default");
    });

    it("returns the default when the closure returns the literal string 'null'", () => {
      const reader = createEnvReader(() => "null");

      expect(reader("MISSING", "default")).toBe("default");
    });
  });

  describe("Zod schema branch", () => {
    it("returns the parsed value when the schema succeeds", () => {
      const reader = createEnvReader(() => "staging");

      const schema = z.enum(["local", "staging", "production"]);

      expect(reader("TIER", "local" as const, schema)).toBe("staging");
    });

    it("throws an Error when the schema fails", () => {
      const reader = createEnvReader(() => "bogus");

      const schema = z.enum(["local", "staging", "production"]);

      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => reader("TIER", "local" as const, schema)).toThrowError(
        /Invalid environment variable "TIER"/,
      );
    });

    it("passes the default through the schema when the closure returns missing", () => {
      const reader = createEnvReader(() => undefined);

      const schema = z.enum(["local", "staging", "production"]);

      expect(reader("TIER", "production" as const, schema)).toBe("production");
    });
  });
});
