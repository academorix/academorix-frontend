/**
 * @file env.test.ts
 * @module @academorix/core/env/__tests__/env.test
 *
 * @description
 * Tests for {@link env} — the cross-runtime environment variable
 * reader. Covers:
 *
 *  - default coercion by return-type shape (string / number / boolean).
 *  - Zod schema validation branch (pass, fail, missing + valid default).
 *  - `EMPTY_STRING_VALUES` normalisation (`""`, `"undefined"`, `"null"`).
 *  - Cross-runtime probing via `vi.stubGlobal`: `import.meta.env` vs
 *    `process.env` vs neither.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { env } from "../env.util";

/**
 * Both probes read from `globalThis` — we stub `process` per-test with
 * an empty `env` so the host's real env vars can't leak into our
 * assertions.
 */
beforeEach(() => {
  vi.stubGlobal("process", { env: {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("env() without a schema", () => {
  describe("with a string default", () => {
    it("returns the raw string when the env var is set", () => {
      vi.stubGlobal("process", { env: { HOST: "example.com" } });

      expect(env("HOST", "localhost")).toBe("example.com");
    });

    it("returns the default when the env var is an empty string", () => {
      vi.stubGlobal("process", { env: { HOST: "" } });

      expect(env("HOST", "localhost")).toBe("localhost");
    });

    it("returns the default when the env var is not set", () => {
      expect(env("HOST", "localhost")).toBe("localhost");
    });
  });

  describe("with a number default", () => {
    it("coerces the raw value via Number()", () => {
      vi.stubGlobal("process", { env: { PORT: "5173" } });

      expect(env("PORT", 3000)).toBe(5173);
    });

    it("falls back to the default when the raw value is NaN", () => {
      vi.stubGlobal("process", { env: { PORT: "not-a-number" } });

      expect(env("PORT", 3000)).toBe(3000);
    });

    it("coerces decimal strings correctly", () => {
      vi.stubGlobal("process", { env: { TIMEOUT: "1.5" } });

      expect(env("TIMEOUT", 1)).toBe(1.5);
    });

    it("falls back on non-finite values like Infinity", () => {
      vi.stubGlobal("process", { env: { PORT: "Infinity" } });

      expect(env("PORT", 3000)).toBe(3000);
    });
  });

  describe('with a boolean default (accepts "true", "1", "yes", "on")', () => {
    it.each([
      ["true", true],
      ["TRUE", true],
      ["True", true],
      ["1", true],
      ["yes", true],
      ["YES", true],
      ["on", true],
      ["ON", true],
    ])("treats %s as true (case-insensitive)", (raw, expected) => {
      vi.stubGlobal("process", { env: { DEBUG: raw } });

      expect(env("DEBUG", false)).toBe(expected);
    });

    it.each([
      ["false", false],
      ["0", false],
      ["no", false],
      ["off", false],
      ["anything", false],
      ["", false],
    ])("treats %s as false", (raw, expected) => {
      vi.stubGlobal("process", { env: { DEBUG: raw } });

      // "" is treated as missing → falls back to `false` default.
      expect(env("DEBUG", false)).toBe(expected);
    });

    it("returns the default when the env var is not set", () => {
      expect(env("DEBUG", true)).toBe(true);
      expect(env("DEBUG", false)).toBe(false);
    });
  });
});

describe("env() with a Zod schema", () => {
  it("returns the parsed value when the schema succeeds", () => {
    vi.stubGlobal("process", { env: { TIER: "staging" } });

    const schema = z.enum(["local", "staging", "production"]);

    expect(env("TIER", "local" as const, schema)).toBe("staging");
  });

  it("throws an Error with a descriptive message when the schema fails", () => {
    vi.stubGlobal("process", { env: { TIER: "bogus" } });

    const schema = z.enum(["local", "staging", "production"]);

    // Silence the console.error the util emits on validation failure.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => env("TIER", "local" as const, schema)).toThrowError(
      /Invalid environment variable "TIER"/,
    );

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });

  it("passes the default through the schema when the env var is missing", () => {
    const schema = z.enum(["local", "staging", "production"]);

    expect(env("TIER", "local" as const, schema)).toBe("local");
  });

  it("throws when a missing env var falls back to a default that fails the schema", () => {
    const schema = z.enum(["local", "staging", "production"]);

    vi.spyOn(console, "error").mockImplementation(() => {});

    // `"bogus" as never` — bypass the compile-time constraint to test
    // the runtime guard path.
    expect(() => env("TIER", "bogus" as never, schema)).toThrowError(
      /Invalid environment variable "TIER"/,
    );
  });
});

describe("EMPTY_STRING_VALUES handling", () => {
  it.each(["", "undefined", "null"])(
    "treats the literal string %j as missing and returns the default",
    (rawValue) => {
      vi.stubGlobal("process", { env: { OPT: rawValue } });

      expect(env("OPT", "fallback")).toBe("fallback");
    },
  );

  it('does not treat the string "NULL" (uppercase) as missing', () => {
    vi.stubGlobal("process", { env: { OPT: "NULL" } });

    // EMPTY_STRING_VALUES is case-sensitive — only literal "null" matches.
    expect(env("OPT", "fallback")).toBe("NULL");
  });
});

describe("cross-runtime probing via vi.stubGlobal", () => {
  it("reads from process.env when process is present", () => {
    vi.stubGlobal("process", { env: { NODE_KEY: "from-process" } });

    expect(env("NODE_KEY", "default")).toBe("from-process");
  });

  it("reads from globalThis.import.meta.env when it is present", () => {
    // Vite / Astro / SvelteKit style — the source probes
    // `(globalThis as any).import?.meta.env` first.
    vi.stubGlobal("import", { meta: { env: { VITE_KEY: "from-vite" } } });

    expect(env("VITE_KEY", "default")).toBe("from-vite");
  });

  it("prefers import.meta.env over process.env when both are present", () => {
    vi.stubGlobal("import", { meta: { env: { KEY: "from-vite" } } });
    vi.stubGlobal("process", { env: { KEY: "from-process" } });

    expect(env("KEY", "default")).toBe("from-vite");
  });

  it("falls back to process.env when import.meta.env does not have the key", () => {
    vi.stubGlobal("import", { meta: { env: {} } });
    vi.stubGlobal("process", { env: { KEY: "from-process" } });

    expect(env("KEY", "default")).toBe("from-process");
  });

  it("returns the default when neither runtime provides the value", () => {
    vi.stubGlobal("process", undefined);

    // `globalThis.import` is undefined by default in Node.
    expect(env("MISSING_KEY", "the-default")).toBe("the-default");
  });

  it("does not throw when accessing import.meta triggers an exception", () => {
    // Simulate a getter that throws — the source wraps the probe in
    // try/catch and continues to the next runtime.
    Object.defineProperty(globalThis, "import", {
      configurable: true,
      get() {
        throw new Error("import.meta unavailable outside ESM");
      },
    });

    try {
      vi.stubGlobal("process", { env: { KEY: "from-process" } });

      expect(env("KEY", "default")).toBe("from-process");
    } finally {
      // Clean up the manually-defined property so other tests are unaffected.
      delete (globalThis as { import?: unknown }).import;
    }
  });
});
