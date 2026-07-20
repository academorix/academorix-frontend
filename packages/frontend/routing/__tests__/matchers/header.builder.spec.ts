/**
 * @file header.builder.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the `header` matcher builder.
 */

import { describe, expect, it } from "vitest";

import { header } from "@/matchers/builders/header.builder";

/** Shorthand for `new Headers(record)`. */
function h(record: Record<string, string>): Headers {
  return new Headers(record);
}

describe("header builder", () => {
  it(".has / .missing check for header presence", () => {
    expect(header.has("x-tenant")(h({ "x-tenant": "acme" }))).toBe(true);
    expect(header.has("x-tenant")(h({}))).toBe(false);
    expect(header.missing("x-tenant")(h({}))).toBe(true);
  });

  it(".not(pred) inverts, .not(string) is sugar for not(has(string))", () => {
    expect(header.not("x-tenant")(h({}))).toBe(true);
    expect(header.not(header.has("x-tenant"))(h({ "x-tenant": "a" }))).toBe(false);
  });

  it(".equals compares case-insensitively on the value", () => {
    const pred = header.equals("x-tenant", "ACME");
    expect(pred(h({ "x-tenant": "acme" }))).toBe(true);
    expect(pred(h({ "x-tenant": "other" }))).toBe(false);
  });

  it(".oneOf matches any listed value", () => {
    const pred = header.oneOf("x-tenant", ["acme", "globex"]);
    expect(pred(h({ "x-tenant": "acme" }))).toBe(true);
    expect(pred(h({ "x-tenant": "GLOBEX" }))).toBe(true);
    expect(pred(h({ "x-tenant": "other" }))).toBe(false);
  });

  it(".matching runs a regex against the value", () => {
    const pred = header.matching("user-agent", /Chrome/);
    expect(pred(h({ "user-agent": "Mozilla Chrome" }))).toBe(true);
    expect(pred(h({ "user-agent": "Firefox" }))).toBe(false);
  });

  it(".and / .or compose predicates", () => {
    const both = header.and(header.has("x-tenant"), header.equals("x-mode", "preview"));
    expect(both(h({ "x-tenant": "a", "x-mode": "preview" }))).toBe(true);
    expect(both(h({ "x-tenant": "a" }))).toBe(false);

    const either = header.or(header.has("x-tenant"), header.has("x-org"));
    expect(either(h({ "x-tenant": "a" }))).toBe(true);
    expect(either(h({ "x-org": "a" }))).toBe(true);
    expect(either(h({}))).toBe(false);
  });
});
