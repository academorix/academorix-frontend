/**
 * @file runtime-caching.test.ts
 * @module @academorix/pwa/workbox/__tests__/runtime-caching.test
 *
 * @description
 * Tests for {@link getRuntimeCaching}. Covers:
 *
 *  - Default options yield three rules (API, images, fonts).
 *  - `includeApi: false` drops the API rule.
 *  - `apiPathPrefix` propagates through the URL matcher.
 *  - Expiration overrides propagate to the emitted `options.expiration`.
 */

import { describe, expect, it } from "vitest";

import { getRuntimeCaching } from "../runtime-caching.util";

import type { RuntimeCachingRule } from "../runtime-caching.util";

/**
 * Invokes the function-form URL pattern of a runtime-caching rule.
 * Falls back to a synthetic assertion when the pattern is a RegExp
 * (so the helper can be reused for image / font rules too).
 */
function matches(rule: RuntimeCachingRule, pathname: string, sameOrigin = true): boolean {
  const url = new URL(`https://example.com${pathname}`);

  if (typeof rule.urlPattern === "function") {
    return rule.urlPattern({ url, sameOrigin });
  }

  return rule.urlPattern.test(pathname);
}

describe("getRuntimeCaching() — default options", () => {
  it("emits three rules (API, images, fonts) in that order", () => {
    const rules = getRuntimeCaching();

    expect(rules).toHaveLength(3);
    expect(rules[0]?.options?.cacheName).toBe("academorix-api");
    expect(rules[1]?.options?.cacheName).toBe("academorix-images");
    expect(rules[2]?.options?.cacheName).toBe("academorix-fonts");
  });

  it("uses NetworkFirst for the API rule with a 5s network timeout", () => {
    const [api] = getRuntimeCaching();

    expect(api?.handler).toBe("NetworkFirst");
    expect(api?.options?.networkTimeoutSeconds).toBe(5);
  });

  it("uses CacheFirst for the image + font rules", () => {
    const [, images, fonts] = getRuntimeCaching();

    expect(images?.handler).toBe("CacheFirst");
    expect(fonts?.handler).toBe("CacheFirst");
  });

  it("caches only 0 and 200 responses across all rules", () => {
    const rules = getRuntimeCaching();

    for (const rule of rules) {
      expect(rule.options?.cacheableResponse?.statuses).toEqual([0, 200]);
    }
  });

  it("matches same-origin /api/* requests through the API rule", () => {
    const [api] = getRuntimeCaching();

    expect(api).toBeDefined();
    if (!api) return;

    expect(matches(api, "/api/users")).toBe(true);
    expect(matches(api, "/api")).toBe(true);
    expect(matches(api, "/apix/users")).toBe(false);
    expect(matches(api, "/nope/users")).toBe(false);
  });

  it("only matches API requests when they are same-origin", () => {
    const [api] = getRuntimeCaching();

    expect(api).toBeDefined();
    if (!api) return;

    expect(matches(api, "/api/users", true)).toBe(true);
    expect(matches(api, "/api/users", false)).toBe(false);
  });

  it("matches common image extensions through the image rule", () => {
    const [, images] = getRuntimeCaching();

    expect(images).toBeDefined();
    if (!images) return;

    for (const path of [
      "/logo.png",
      "/hero.JPG",
      "/photo.jpeg",
      "/icon.svg",
      "/anim.gif",
      "/next-gen.webp",
      "/next-gen.avif",
      "/favicon.ico",
    ]) {
      expect(matches(images, path)).toBe(true);
    }
  });

  it("does not match non-image extensions through the image rule", () => {
    const [, images] = getRuntimeCaching();

    expect(images).toBeDefined();
    if (!images) return;

    expect(matches(images, "/style.css")).toBe(false);
    expect(matches(images, "/script.js")).toBe(false);
  });

  it("matches common font extensions through the font rule", () => {
    const [, , fonts] = getRuntimeCaching();

    expect(fonts).toBeDefined();
    if (!fonts) return;

    for (const path of [
      "/inter.woff",
      "/inter.woff2",
      "/legacy.ttf",
      "/legacy.otf",
      "/legacy.eot",
    ]) {
      expect(matches(fonts, path)).toBe(true);
    }
  });
});

describe("getRuntimeCaching() — includeApi: false", () => {
  it("emits only two rules (images + fonts)", () => {
    const rules = getRuntimeCaching({ includeApi: false });

    expect(rules).toHaveLength(2);
    expect(rules[0]?.options?.cacheName).toBe("academorix-images");
    expect(rules[1]?.options?.cacheName).toBe("academorix-fonts");
  });

  it("still returns image + font rules with default handlers", () => {
    const rules = getRuntimeCaching({ includeApi: false });

    expect(rules[0]?.handler).toBe("CacheFirst");
    expect(rules[1]?.handler).toBe("CacheFirst");
  });
});

describe("getRuntimeCaching() — custom apiPathPrefix", () => {
  it("matches /backend/* when apiPathPrefix is '/backend'", () => {
    const [api] = getRuntimeCaching({ apiPathPrefix: "/backend" });

    expect(api).toBeDefined();
    if (!api) return;

    expect(matches(api, "/backend/users")).toBe(true);
    expect(matches(api, "/backend")).toBe(true);
  });

  it("does NOT match /api/* when apiPathPrefix is '/backend'", () => {
    const [api] = getRuntimeCaching({ apiPathPrefix: "/backend" });

    expect(api).toBeDefined();
    if (!api) return;

    expect(matches(api, "/api/users")).toBe(false);
  });

  it("escapes regex metacharacters in the custom prefix", () => {
    // A prefix like "/api.v1" should match "/api.v1/*", not "/apiXv1/*".
    const [api] = getRuntimeCaching({ apiPathPrefix: "/api.v1" });

    expect(api).toBeDefined();
    if (!api) return;

    expect(matches(api, "/api.v1/users")).toBe(true);
    expect(matches(api, "/apiXv1/users")).toBe(false);
  });
});

describe("getRuntimeCaching() — age/entry overrides", () => {
  it("propagates apiMaxAgeSeconds + apiMaxEntries to expiration", () => {
    const [api] = getRuntimeCaching({
      apiMaxAgeSeconds: 3600,
      apiMaxEntries: 50,
    });

    expect(api?.options?.expiration).toEqual({
      maxEntries: 50,
      maxAgeSeconds: 3600,
    });
  });

  it("propagates imageMaxAgeSeconds + imageMaxEntries to expiration", () => {
    const [, images] = getRuntimeCaching({
      imageMaxAgeSeconds: 60,
      imageMaxEntries: 10,
    });

    expect(images?.options?.expiration).toEqual({
      maxEntries: 10,
      maxAgeSeconds: 60,
    });
  });

  it("propagates fontMaxAgeSeconds + fontMaxEntries to expiration", () => {
    const [, , fonts] = getRuntimeCaching({
      fontMaxAgeSeconds: 60,
      fontMaxEntries: 5,
    });

    expect(fonts?.options?.expiration).toEqual({
      maxEntries: 5,
      maxAgeSeconds: 60,
    });
  });

  it("uses sensible defaults when nothing is overridden", () => {
    const [api, images, fonts] = getRuntimeCaching();

    const day = 60 * 60 * 24;

    expect(api?.options?.expiration).toEqual({
      maxEntries: 200,
      maxAgeSeconds: day,
    });
    expect(images?.options?.expiration).toEqual({
      maxEntries: 100,
      maxAgeSeconds: day * 30,
    });
    expect(fonts?.options?.expiration).toEqual({
      maxEntries: 30,
      maxAgeSeconds: day * 365,
    });
  });
});
