/**
 * @file get-serwist-options.test.ts
 * @module @academorix/pwa/serwist/__tests__/get-serwist-options.test
 *
 * @description
 * Tests for {@link getSerwistOptions}. Covers:
 *
 *  - Defaults: `runtimeCaching`, `skipWaiting: false`, `clientsClaim: true`.
 *  - `navigateFallback: "/offline"` → `fallbacks: { entries: [{ url: "/offline" }] }`.
 *  - `extras` merged verbatim.
 */

import { describe, expect, it } from "vitest";

import { getSerwistOptions } from "../get-serwist-options";

describe("getSerwistOptions() — defaults", () => {
  it("emits runtimeCaching populated from getRuntimeCaching", () => {
    const options = getSerwistOptions();

    const runtimeCaching = options["runtimeCaching"] as ReadonlyArray<{
      readonly options?: { readonly cacheName?: string };
    }>;

    // Default: 3 rules (API, images, fonts).
    expect(runtimeCaching).toHaveLength(3);
    expect(runtimeCaching.map((r) => r.options?.cacheName)).toEqual([
      "academorix-api",
      "academorix-images",
      "academorix-fonts",
    ]);
  });

  it("forwards runtimeCaching overrides into getRuntimeCaching", () => {
    const options = getSerwistOptions({ runtimeCaching: { includeApi: false } });

    const runtimeCaching = options["runtimeCaching"] as ReadonlyArray<unknown>;

    expect(runtimeCaching).toHaveLength(2);
  });

  it("defaults skipWaiting to false", () => {
    expect(getSerwistOptions()["skipWaiting"]).toBe(false);
  });

  it("defaults clientsClaim to true", () => {
    expect(getSerwistOptions()["clientsClaim"]).toBe(true);
  });

  it("honours a custom skipWaiting value", () => {
    expect(getSerwistOptions({ skipWaiting: true })["skipWaiting"]).toBe(true);
  });

  it("honours a custom clientsClaim value", () => {
    expect(getSerwistOptions({ clientsClaim: false })["clientsClaim"]).toBe(false);
  });

  it("does not emit fallbacks when navigateFallback is omitted", () => {
    const options = getSerwistOptions();

    expect("fallbacks" in options).toBe(false);
  });

  it("does not emit navigateFallbackDenylist when omitted", () => {
    const options = getSerwistOptions();

    expect("navigateFallbackDenylist" in options).toBe(false);
  });
});

describe("getSerwistOptions() — navigate fallback", () => {
  it("emits fallbacks.entries when navigateFallback is a string", () => {
    const options = getSerwistOptions({ navigateFallback: "/offline" });

    expect(options["fallbacks"]).toEqual({ entries: [{ url: "/offline" }] });
  });

  it("emits fallbacks.entries even when the fallback URL is null (opt-out signalling)", () => {
    // navigateFallback: null differs from omitting the field — the
    // presence of `null` indicates the caller explicitly opted out.
    const options = getSerwistOptions({ navigateFallback: null });

    expect(options["fallbacks"]).toEqual({ entries: [{ url: null }] });
  });

  it("emits a navigateFallbackDenylist when provided", () => {
    const denylist = [/^\/api\//, /^\/rss/];

    const options = getSerwistOptions({ navigateFallbackDenylist: denylist });

    expect(options["navigateFallbackDenylist"]).toEqual([...denylist]);
  });

  it("returns a fresh navigateFallbackDenylist array (does not alias caller input)", () => {
    const denylist = [/^\/api\//];

    const options = getSerwistOptions({ navigateFallbackDenylist: denylist });

    expect(options["navigateFallbackDenylist"]).not.toBe(denylist);
  });
});

describe("getSerwistOptions() — extras", () => {
  it("merges extras into the emitted config", () => {
    const options = getSerwistOptions({
      extras: {
        precacheOptions: { cleanupOutdatedCaches: true },
        disableDevLogs: true,
      },
    });

    expect(options["precacheOptions"]).toEqual({ cleanupOutdatedCaches: true });
    expect(options["disableDevLogs"]).toBe(true);
  });

  it("extras can override the default skipWaiting via spread order", () => {
    // Extras spread AFTER the defaults, so they win on collision.
    const options = getSerwistOptions({ extras: { skipWaiting: true } });

    expect(options["skipWaiting"]).toBe(true);
  });

  it("keeps the default runtimeCaching intact when extras only add unrelated keys", () => {
    const options = getSerwistOptions({ extras: { debug: true } });

    const runtimeCaching = options["runtimeCaching"] as ReadonlyArray<unknown>;

    expect(runtimeCaching).toHaveLength(3);
    expect(options["debug"]).toBe(true);
  });
});
