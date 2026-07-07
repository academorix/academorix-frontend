/**
 * @file get-vite-pwa-options.test.ts
 * @module @academorix/pwa/vite/__tests__/get-vite-pwa-options.test
 *
 * @description
 * Tests for {@link getVitePwaOptions}. Covers:
 *
 *  - Default `registerType` of `"prompt"`.
 *  - Default `workbox.navigateFallback` of `"index.html"`.
 *  - Default `workbox.globPatterns` list.
 *  - `workbox.runtimeCaching` is populated from `getRuntimeCaching`.
 *  - `devEnabled: true` → `devOptions.enabled: true`.
 *  - `workboxExtras` merges into the emitted workbox config.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_NAVIGATE_FALLBACK_DENYLIST, getVitePwaOptions } from "../get-vite-pwa-options";

import type { BuildManifestInput } from "../../manifest";

const MANIFEST: BuildManifestInput = {
  name: "Academorix",
  shortName: "Academorix",
  description: "The operating system for modern academies.",
  lang: "en-US",
  themeColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
};

/** Extracts and casts the workbox subtree for structural assertions. */
function workboxOf(options: Record<string, unknown>): Record<string, unknown> {
  const workbox = options["workbox"];

  if (typeof workbox !== "object" || workbox === null) {
    throw new Error("Expected workbox to be an object");
  }

  return workbox as Record<string, unknown>;
}

describe("getVitePwaOptions() — top-level defaults", () => {
  it("emits registerType 'prompt' by default", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    expect(options["registerType"]).toBe("prompt");
  });

  it("honours a custom registerType", () => {
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      registerType: "autoUpdate",
    });

    expect(options["registerType"]).toBe("autoUpdate");
  });

  it("emits a manifest built via buildManifest", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    const manifest = options["manifest"] as Record<string, unknown>;

    expect(manifest["name"]).toBe(MANIFEST.name);
    expect(manifest["short_name"]).toBe(MANIFEST.shortName);
    expect(manifest["start_url"]).toBe("/"); // default from buildManifest
  });
});

describe("getVitePwaOptions() — workbox defaults", () => {
  it("emits workbox.navigateFallback of 'index.html' by default", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    expect(workboxOf(options)["navigateFallback"]).toBe("index.html");
  });

  it("emits the default workbox.globPatterns list", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    expect(workboxOf(options)["globPatterns"]).toEqual([
      "**/*.{js,css,html,ico,png,svg,webp,woff,woff2}",
    ]);
  });

  it("emits workbox.navigateFallbackDenylist from the exported default", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    const denylist = workboxOf(options)["navigateFallbackDenylist"];

    expect(denylist).toEqual([...DEFAULT_NAVIGATE_FALLBACK_DENYLIST]);
  });

  it("emits workbox.runtimeCaching populated from getRuntimeCaching", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    const runtimeCaching = workboxOf(options)["runtimeCaching"] as ReadonlyArray<{
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
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      runtimeCaching: { includeApi: false },
    });

    const runtimeCaching = workboxOf(options)["runtimeCaching"] as ReadonlyArray<{
      readonly options?: { readonly cacheName?: string };
    }>;

    expect(runtimeCaching).toHaveLength(2); // no API rule
    expect(runtimeCaching[0]?.options?.cacheName).toBe("academorix-images");
  });

  it("emits cleanupOutdatedCaches: true and clientsClaim: true by default", () => {
    const workbox = workboxOf(getVitePwaOptions({ manifest: MANIFEST }));

    expect(workbox["cleanupOutdatedCaches"]).toBe(true);
    expect(workbox["clientsClaim"]).toBe(true);
    expect(workbox["skipWaiting"]).toBe(false);
  });
});

describe("getVitePwaOptions() — devEnabled", () => {
  it("defaults devOptions.enabled to false", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });

    const devOptions = options["devOptions"] as Record<string, unknown>;

    expect(devOptions["enabled"]).toBe(false);
  });

  it("emits devOptions.enabled: true when devEnabled is true", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST, devEnabled: true });

    const devOptions = options["devOptions"] as Record<string, unknown>;

    expect(devOptions["enabled"]).toBe(true);
  });
});

describe("getVitePwaOptions() — workboxExtras", () => {
  it("merges workboxExtras into the workbox config", () => {
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      workboxExtras: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    });

    expect(workboxOf(options)["maximumFileSizeToCacheInBytes"]).toBe(5 * 1024 * 1024);
  });

  it("workboxExtras can override the default globPatterns (spread order)", () => {
    // Extras are spread after the defaults, so they win on collision.
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      workboxExtras: { globPatterns: ["**/*.{js,css}"] },
    });

    expect(workboxOf(options)["globPatterns"]).toEqual(["**/*.{js,css}"]);
  });

  it("keeps other workbox defaults intact when extras are provided", () => {
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      workboxExtras: { maximumFileSizeToCacheInBytes: 100 },
    });

    const workbox = workboxOf(options);

    expect(workbox["navigateFallback"]).toBe("index.html");
    expect(workbox["clientsClaim"]).toBe(true);
  });
});

describe("getVitePwaOptions() — navigate fallback overrides", () => {
  it("honours a custom navigateFallback", () => {
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      navigateFallback: "/offline",
    });

    expect(workboxOf(options)["navigateFallback"]).toBe("/offline");
  });

  it("honours navigateFallback: null (disable SPA fallback)", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST, navigateFallback: null });

    expect(workboxOf(options)["navigateFallback"]).toBeNull();
  });

  it("honours a custom navigateFallbackDenylist", () => {
    const custom = [/^\/custom\//];
    const options = getVitePwaOptions({
      manifest: MANIFEST,
      navigateFallbackDenylist: custom,
    });

    expect(workboxOf(options)["navigateFallbackDenylist"]).toEqual([...custom]);
  });
});

describe("DEFAULT_NAVIGATE_FALLBACK_DENYLIST", () => {
  it("excludes /api/* from the SPA shell fallback", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/api/users"))).toBe(true);
  });

  it("excludes /broadcasting/* from the SPA shell fallback", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/broadcasting/auth"))).toBe(
      true,
    );
  });

  it("excludes files with an extension from the SPA shell fallback", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/asset.js"))).toBe(true);
  });
});
