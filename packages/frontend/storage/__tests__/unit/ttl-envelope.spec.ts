/**
 * @file ttl-envelope.spec.ts
 * @module @stackra/storage/test/unit
 * @description The `wrapTtl` / `unwrapTtl` / `isExpired` helpers
 *   underpin every JSON-serialising driver — validate the envelope
 *   shape and the freshness contract.
 */

import { describe, it, expect } from "vitest";

import { isExpired, unwrapTtl, wrapTtl } from "@/core/utils/ttl-envelope.util";

describe("wrapTtl", () => {
  it("omits `e` when no ttl is supplied", () => {
    expect(wrapTtl("v")).toEqual({ v: "v" });
  });

  it("omits `e` when ttlSeconds is zero or negative", () => {
    expect(wrapTtl("v", 0)).toEqual({ v: "v" });
    expect(wrapTtl("v", -5)).toEqual({ v: "v" });
  });

  it("sets `e` to now + ttlSeconds*1000 when a positive ttl is supplied", () => {
    const before = Date.now();
    const envelope = wrapTtl("v", 60);
    const after = Date.now();
    expect(envelope.v).toBe("v");
    expect(envelope.e).toBeGreaterThanOrEqual(before + 60_000);
    expect(envelope.e).toBeLessThanOrEqual(after + 60_000);
  });
});

describe("unwrapTtl", () => {
  it("returns null for null / undefined input", () => {
    expect(unwrapTtl(null)).toBeNull();
    expect(unwrapTtl(undefined)).toBeNull();
  });

  it("passes through a raw pre-envelope value unchanged", () => {
    expect(unwrapTtl<string>("legacy")).toBe("legacy");
    expect(unwrapTtl<number>(42)).toBe(42);
    expect(unwrapTtl<number[]>([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("returns the envelope payload when fresh", () => {
    expect(unwrapTtl({ v: "v" })).toBe("v");
    expect(unwrapTtl({ v: "v", e: Date.now() + 10_000 })).toBe("v");
  });

  it("returns null when the envelope is expired", () => {
    expect(unwrapTtl({ v: "v", e: Date.now() - 1_000 })).toBeNull();
  });
});

describe("isExpired", () => {
  it("returns false for envelopes without an `e` field", () => {
    expect(isExpired({ v: "v" })).toBe(false);
  });

  it("returns false for envelopes with a future `e`", () => {
    expect(isExpired({ v: "v", e: Date.now() + 5_000 })).toBe(false);
  });

  it("returns true for envelopes with a past `e`", () => {
    expect(isExpired({ v: "v", e: Date.now() - 5_000 })).toBe(true);
  });

  it("returns false for null input", () => {
    expect(isExpired(null)).toBe(false);
  });
});
