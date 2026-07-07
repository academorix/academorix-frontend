/**
 * @file define-config.test.ts
 * @module @academorix/core/config/__tests__/define-config.test
 *
 * @description
 * Tests for the `defineConfig` family — three tiny helpers whose
 * runtime contract is small but whose typing contract is load-bearing
 * across the workspace. Runtime tests verify:
 *
 *  - `defineConfig` returns the same reference (identity).
 *  - `defineFrozenConfig` really freezes (mutation throws in strict mode).
 *  - `defineNamedConfig` is a factory that returns an identity function.
 */

import { describe, expect, it } from "vitest";

import { defineConfig, defineFrozenConfig, defineNamedConfig } from "../define-config.util";

describe("defineConfig()", () => {
  it("returns the same object reference (identity)", () => {
    const source = { foo: "bar", nested: { count: 1 } };

    const result = defineConfig(source);

    expect(result).toBe(source);
  });

  it("does not clone or freeze the input", () => {
    const source = { count: 0 };

    const result = defineConfig(source);

    result.count = 42;

    expect(source.count).toBe(42);
  });

  it("preserves primitive inputs verbatim", () => {
    expect(defineConfig(42)).toBe(42);
    expect(defineConfig("hello")).toBe("hello");
    expect(defineConfig(null)).toBe(null);
    expect(defineConfig(undefined)).toBe(undefined);
  });
});

describe("defineFrozenConfig()", () => {
  it("freezes the returned object", () => {
    const config = defineFrozenConfig({ apiUrl: "https://x.test" });

    expect(Object.isFrozen(config)).toBe(true);
  });

  it("throws when a field is mutated in strict mode", () => {
    "use strict";
    const config = defineFrozenConfig({ apiUrl: "https://x.test" });

    // In ES module (strict) code, assigning to a frozen property throws.
    expect(() => {
      (config as { apiUrl: string }).apiUrl = "https://mutated.test";
    }).toThrow(TypeError);
  });

  it("throws when a new field is added to the frozen object", () => {
    const config = defineFrozenConfig({ apiUrl: "https://x.test" });

    expect(() => {
      (config as { extra?: string }).extra = "added";
    }).toThrow(TypeError);
  });

  it("returns the same reference (freeze is in-place)", () => {
    const source = { flag: true };

    const result = defineFrozenConfig(source);

    expect(result).toBe(source);
    expect(Object.isFrozen(source)).toBe(true);
  });

  it("does not deep-freeze nested objects", () => {
    // Object.freeze is shallow — this is intentional and documented.
    const config = defineFrozenConfig({ nested: { count: 0 } });

    expect(() => {
      config.nested.count = 42;
    }).not.toThrow();
    expect(config.nested.count).toBe(42);
  });
});

describe("defineNamedConfig()", () => {
  it("returns a function that is the identity function", () => {
    const defineFlags = defineNamedConfig<Record<string, boolean>>();

    expect(typeof defineFlags).toBe("function");

    const flags = { experimental: true };
    const result = defineFlags(flags);

    expect(result).toBe(flags);
  });

  it("each call produces an independent identity function", () => {
    const defineA = defineNamedConfig<{ a: string }>();
    const defineB = defineNamedConfig<{ b: number }>();

    // Not enforced by the runtime — but the factory returns fresh
    // closures each time.
    expect(defineA).not.toBe(defineB);
  });

  it("does not freeze the value it returns", () => {
    const defineRoutes = defineNamedConfig<Record<string, string>>();

    const routes = defineRoutes({ home: "/" });

    expect(Object.isFrozen(routes)).toBe(false);
  });
});
