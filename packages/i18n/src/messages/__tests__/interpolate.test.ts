/**
 * @file interpolate.test.ts
 * @module @academorix/i18n/messages/__tests__/interpolate.test
 *
 * @description
 * Unit tests for the `{{placeholder}}` interpolator. Covers the happy
 * path (substitution), whitespace tolerance, missing-param passthrough,
 * null/undefined values, and multi-placeholder strings.
 */

import { describe, expect, it } from "vitest";

import { interpolate } from "../interpolate.util";

describe("interpolate", () => {
  it("substitutes a single placeholder from params", () => {
    expect(interpolate("Hi {{name}}", { name: "Sam" })).toBe("Hi Sam");
  });

  it("tolerates whitespace inside the placeholder braces", () => {
    expect(interpolate("Hi {{ name }}", { name: "Sam" })).toBe("Hi Sam");
    expect(interpolate("Hi {{\tname\t}}", { name: "Sam" })).toBe("Hi Sam");
  });

  it("leaves the placeholder intact when the key is missing from params", () => {
    expect(interpolate("Hi {{name}}", {})).toBe("Hi {{name}}");
    expect(interpolate("Hi {{name}}", { other: "x" })).toBe("Hi {{name}}");
  });

  it("returns the message unchanged when no params are supplied at all", () => {
    expect(interpolate("Hi {{name}}")).toBe("Hi {{name}}");
    expect(interpolate("no placeholders here")).toBe("no placeholders here");
  });

  it("leaves the placeholder intact when the value is null or undefined", () => {
    expect(interpolate("Hi {{name}}", { name: null })).toBe("Hi {{name}}");
    expect(interpolate("Hi {{name}}", { name: undefined })).toBe("Hi {{name}}");
  });

  it("substitutes multiple placeholders in a single string", () => {
    expect(
      interpolate("{{greeting}}, {{name}}! You have {{count}} messages.", {
        greeting: "Hi",
        name: "Sam",
        count: 3,
      }),
    ).toBe("Hi, Sam! You have 3 messages.");
  });

  it("coerces non-string param values via String(...)", () => {
    expect(interpolate("{{n}}", { n: 42 })).toBe("42");
    expect(interpolate("{{b}}", { b: true })).toBe("true");
    expect(interpolate("{{o}}", { o: { toString: (): string => "obj" } })).toBe("obj");
  });
});
