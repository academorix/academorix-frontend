/**
 * @file subdomain.builder.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the `subdomain` matcher builder.
 */

import { describe, expect, it } from "vitest";

import { subdomain } from "@/matchers/builders/subdomain.builder";

describe("subdomain builder", () => {
  it(".exact matches case-insensitively", () => {
    const pred = subdomain.exact("Admin");
    expect(pred("admin")).toBe(true);
    expect(pred("ADMIN")).toBe(true);
    expect(pred("other")).toBe(false);
    expect(pred(null)).toBe(false);
  });

  it(".not(pred) inverts a predicate", () => {
    const pred = subdomain.not(subdomain.exact("admin"));
    expect(pred("admin")).toBe(false);
    expect(pred("other")).toBe(true);
    // Apex is not `admin` — so NOT matches.
    expect(pred(null)).toBe(true);
  });

  it(".not(string) is sugar for not(exact(string))", () => {
    const pred = subdomain.not("admin");
    expect(pred("admin")).toBe(false);
    expect(pred("other")).toBe(true);
  });

  it(".oneOf matches any listed subdomain", () => {
    const pred = subdomain.oneOf(["admin", "staff", "ops"]);
    expect(pred("admin")).toBe(true);
    expect(pred("ops")).toBe(true);
    expect(pred("user")).toBe(false);
    expect(pred(null)).toBe(false);
  });

  it(".notIn matches anything NOT in the list, including apex", () => {
    const pred = subdomain.notIn(["www"]);
    expect(pred("www")).toBe(false);
    expect(pred("admin")).toBe(true);
    // Apex is not in the list — matches.
    expect(pred(null)).toBe(true);
  });

  it(".startsWith / .endsWith / .contains match substrings", () => {
    expect(subdomain.startsWith("tenant-")("tenant-alpha")).toBe(true);
    expect(subdomain.startsWith("tenant-")("user-alpha")).toBe(false);
    expect(subdomain.endsWith("-alpha")("tenant-alpha")).toBe(true);
    expect(subdomain.contains("alpha")("tenant-alpha-1")).toBe(true);
  });

  it(".matching runs a regex", () => {
    const pred = subdomain.matching(/^tenant-\d+$/);
    expect(pred("tenant-42")).toBe(true);
    expect(pred("tenant-xyz")).toBe(false);
  });

  it(".any matches every non-apex, .none only apex", () => {
    expect(subdomain.any()("admin")).toBe(true);
    expect(subdomain.any()(null)).toBe(false);
    expect(subdomain.none()("admin")).toBe(false);
    expect(subdomain.none()(null)).toBe(true);
  });

  it(".and short-circuits on the first miss", () => {
    const pred = subdomain.and(subdomain.startsWith("tenant-"), subdomain.matching(/\d+$/));
    expect(pred("tenant-42")).toBe(true);
    expect(pred("tenant-abc")).toBe(false);
    expect(pred("other-42")).toBe(false);
  });

  it(".or accepts on the first hit", () => {
    const pred = subdomain.or(subdomain.exact("admin"), subdomain.exact("staff"));
    expect(pred("admin")).toBe(true);
    expect(pred("staff")).toBe(true);
    expect(pred("user")).toBe(false);
  });
});
