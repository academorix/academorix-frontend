/**
 * @file query.builder.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the `query` matcher builder.
 */

import { describe, expect, it } from "vitest";

import { query } from "@/matchers/builders/query.builder";

/** Shorthand for `new URLSearchParams(record)`. */
function q(record: Record<string, string>): URLSearchParams {
  return new URLSearchParams(record);
}

describe("query builder", () => {
  it(".has matches when the key is present", () => {
    expect(query.has("preview")(q({ preview: "1" }))).toBe(true);
    expect(query.has("preview")(q({}))).toBe(false);
  });

  it(".not(pred) inverts a predicate", () => {
    const pred = query.not(query.has("preview"));
    expect(pred(q({ preview: "1" }))).toBe(false);
    expect(pred(q({}))).toBe(true);
  });

  it(".not(string) is sugar for not(has(string))", () => {
    const pred = query.not("preview");
    expect(pred(q({ preview: "1" }))).toBe(false);
    expect(pred(q({}))).toBe(true);
  });

  it(".missing matches when the key is absent", () => {
    expect(query.missing("preview")(q({}))).toBe(true);
    expect(query.missing("preview")(q({ preview: "1" }))).toBe(false);
  });

  it(".equals matches on exact value", () => {
    const pred = query.equals("mode", "advanced");
    expect(pred(q({ mode: "advanced" }))).toBe(true);
    expect(pred(q({ mode: "basic" }))).toBe(false);
  });

  it(".oneOf matches any listed value", () => {
    const pred = query.oneOf("mode", ["advanced", "expert"]);
    expect(pred(q({ mode: "advanced" }))).toBe(true);
    expect(pred(q({ mode: "expert" }))).toBe(true);
    expect(pred(q({ mode: "basic" }))).toBe(false);
  });

  it(".matching runs a regex against the value", () => {
    const pred = query.matching("page", /^\d+$/);
    expect(pred(q({ page: "42" }))).toBe(true);
    expect(pred(q({ page: "abc" }))).toBe(false);
  });

  it(".and short-circuits, .or accepts on first hit", () => {
    const both = query.and(query.has("preview"), query.equals("mode", "advanced"));
    expect(both(q({ preview: "1", mode: "advanced" }))).toBe(true);
    expect(both(q({ preview: "1" }))).toBe(false);

    const either = query.or(query.has("preview"), query.has("debug"));
    expect(either(q({ preview: "1" }))).toBe(true);
    expect(either(q({ debug: "1" }))).toBe(true);
    expect(either(q({}))).toBe(false);
  });
});
