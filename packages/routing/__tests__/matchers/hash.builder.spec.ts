/**
 * @file hash.builder.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the URL `hash` matcher builder.
 */

import { describe, expect, it } from "vitest";

import { hash } from "@/matchers/builders/hash.builder";

describe("hash builder", () => {
  it(".exact tolerates the leading # on either side", () => {
    const pred = hash.exact("#/foo");
    expect(pred("/foo")).toBe(true);
    expect(pred("/bar")).toBe(false);
  });

  it(".not(pred) inverts, .not(string) is sugar for not(exact(string))", () => {
    expect(hash.not("/foo")("/foo")).toBe(false);
    expect(hash.not("/foo")("/bar")).toBe(true);
    expect(hash.not(hash.exact("/foo"))("/foo")).toBe(false);
  });

  it(".startsWith / .endsWith / .contains work on stripped values", () => {
    expect(hash.startsWith("#/dialog/")("/dialog/foo")).toBe(true);
    expect(hash.endsWith("/foo")("/dialog/foo")).toBe(true);
    expect(hash.contains("dialog")("/dialog/foo")).toBe(true);
  });

  it(".matching runs a regex", () => {
    expect(hash.matching(/^\/dialog\/\d+$/)("/dialog/42")).toBe(true);
    expect(hash.matching(/^\/dialog\/\d+$/)("/dialog/abc")).toBe(false);
  });

  it(".empty / .present distinguish empty vs non-empty hashes", () => {
    expect(hash.empty()("")).toBe(true);
    expect(hash.empty()("/foo")).toBe(false);
    expect(hash.present()("/foo")).toBe(true);
    expect(hash.present()("")).toBe(false);
  });

  it(".and / .or compose predicates", () => {
    const both = hash.and(hash.startsWith("/dialog/"), hash.contains("modal"));
    expect(both("/dialog/modal-1")).toBe(true);
    expect(both("/dialog/other")).toBe(false);

    const either = hash.or(hash.exact("/foo"), hash.exact("/bar"));
    expect(either("/foo")).toBe(true);
    expect(either("/bar")).toBe(true);
    expect(either("/baz")).toBe(false);
  });
});
