/**
 * @file branding-cache.test.ts
 * @module lib/tenancy/branding-cache.test
 *
 * @description
 * Unit coverage for the per-hostname localStorage envelope. jsdom ships a
 * working `localStorage` implementation so we can round-trip real writes
 * and reads; every test clears storage before starting to keep the state
 * hermetic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TenantBranding } from "@/types";

import {
  clearCachedBranding,
  readCachedBranding,
  writeCachedBranding,
} from "@/lib/tenancy/branding-cache";

/** Base branding used across the cache tests. */
function makeBranding(overrides: Partial<TenantBranding> = {}): TenantBranding {
  return {
    logo_url: null,
    favicon_url: null,
    primary_color: "#3b82f6",
    secondary_color: null,
    accent_color: null,
    email_from_name: null,
    email_from_address: null,
    email_reply_to: null,
    custom_css: null,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("branding-cache", () => {
  it("round-trips a written envelope", () => {
    const branding = makeBranding({ primary_color: "#0d9488" });

    writeCachedBranding("riverside.academorix.com", branding, "Riverside");

    const cached = readCachedBranding("riverside.academorix.com");

    expect(cached).not.toBeNull();
    expect(cached?.branding?.primary_color).toBe("#0d9488");
    expect(cached?.tenantName).toBe("Riverside");
  });

  it("returns null for an unknown hostname", () => {
    expect(readCachedBranding("nobody.academorix.com")).toBeNull();
  });

  it("caches the null-branding case explicitly (no-branding tenants are cacheable too)", () => {
    writeCachedBranding("bare.academorix.com", null, "Bare Bones");

    const cached = readCachedBranding("bare.academorix.com");

    expect(cached).not.toBeNull();
    expect(cached?.branding).toBeNull();
    expect(cached?.tenantName).toBe("Bare Bones");
  });

  it("lowercases the hostname so writes + reads with different casing agree", () => {
    writeCachedBranding("Riverside.Academorix.com", makeBranding(), "Riverside");

    expect(readCachedBranding("riverside.academorix.com")).not.toBeNull();
    expect(readCachedBranding("RIVERSIDE.ACADEMORIX.COM")).not.toBeNull();
  });

  it("returns null once the entry ages past the 24h TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));

    writeCachedBranding("riverside.academorix.com", makeBranding(), "Riverside");

    // 25 hours later — outside the 24h window.
    vi.setSystemTime(new Date("2026-07-02T01:00:00Z"));

    expect(readCachedBranding("riverside.academorix.com")).toBeNull();
  });

  it("returns the entry within the 24h TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));

    writeCachedBranding("riverside.academorix.com", makeBranding(), "Riverside");

    // 12 hours later — still fresh.
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(readCachedBranding("riverside.academorix.com")).not.toBeNull();
  });

  it("returns null when the stored JSON is corrupt", () => {
    // Simulate a truncated / hand-edited envelope.
    window.localStorage.setItem("academorix:tenant-branding:riverside.academorix.com", "{not-json");

    expect(readCachedBranding("riverside.academorix.com")).toBeNull();
  });

  it("returns null when the schema version does not match", () => {
    // Write an envelope with a bogus schema version and confirm the reader
    // rejects it (this is how a real schema bump self-invalidates every
    // browser on the next boot).
    window.localStorage.setItem(
      "academorix:tenant-branding:riverside.academorix.com",
      JSON.stringify({
        v: 999,
        savedAt: Date.now(),
        branding: null,
        tenantName: "Old",
      }),
    );

    expect(readCachedBranding("riverside.academorix.com")).toBeNull();
  });

  it("clears an entry via clearCachedBranding", () => {
    writeCachedBranding("riverside.academorix.com", makeBranding(), "Riverside");
    expect(readCachedBranding("riverside.academorix.com")).not.toBeNull();

    clearCachedBranding("riverside.academorix.com");
    expect(readCachedBranding("riverside.academorix.com")).toBeNull();
  });

  it("swallows localStorage.setItem failures silently", () => {
    // Force setItem to throw the DOMException that browsers surface on
    // quota-exceeded / permission-denied. The write should be a no-op —
    // never propagate.
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    expect(() => writeCachedBranding("x.test", makeBranding(), "X")).not.toThrow();

    spy.mockRestore();
  });
});
