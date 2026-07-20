/**
 * @file get-vite-pwa-options.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Tests for {@link getVitePwaOptions}.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_NAVIGATE_FALLBACK_DENYLIST, getVitePwaOptions } from "@/vite";
import type { IBuildManifestInput } from "@/manifest";

const MANIFEST: IBuildManifestInput = {
  name: "Stackra",
  shortName: "Stackra",
  description: "The operating system for modern teams.",
  lang: "en-US",
  themeColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
};

function workboxOf(options: Record<string, unknown>): Record<string, unknown> {
  return options["workbox"] as Record<string, unknown>;
}

describe("getVitePwaOptions — top-level defaults", () => {
  it("defaults registerType to prompt", () => {
    expect(getVitePwaOptions({ manifest: MANIFEST })["registerType"]).toBe("prompt");
  });

  it("honours registerType override", () => {
    expect(
      getVitePwaOptions({ manifest: MANIFEST, registerType: "autoUpdate" })["registerType"],
    ).toBe("autoUpdate");
  });

  it("emits a manifest built via buildManifest", () => {
    const options = getVitePwaOptions({ manifest: MANIFEST });
    const manifest = options["manifest"] as Record<string, unknown>;
    expect(manifest["name"]).toBe(MANIFEST.name);
    expect(manifest["short_name"]).toBe(MANIFEST.shortName);
    expect(manifest["start_url"]).toBe("/");
  });
});

describe("getVitePwaOptions — workbox defaults", () => {
  it('emits workbox.navigateFallback of "index.html"', () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST });
    expect(workboxOf(opts)["navigateFallback"]).toBe("index.html");
  });

  it("emits the default globPatterns list", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST });
    expect(workboxOf(opts)["globPatterns"]).toEqual([
      "**/*.{js,css,html,ico,png,svg,webp,woff,woff2}",
    ]);
  });

  it("emits workbox.navigateFallbackDenylist from the exported default", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST });
    const denylist = workboxOf(opts)["navigateFallbackDenylist"];
    expect(denylist).toEqual([...DEFAULT_NAVIGATE_FALLBACK_DENYLIST]);
  });

  it("populates runtimeCaching via getRuntimeCaching", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST });
    const runtimeCaching = workboxOf(opts)["runtimeCaching"] as ReadonlyArray<{
      options?: { cacheName?: string };
    }>;
    // Default rule set: API, images, fonts, HTML.
    expect(runtimeCaching).toHaveLength(4);
    expect(runtimeCaching.map((r) => r.options?.cacheName)).toEqual([
      "stackra-pwa-api",
      "stackra-pwa-images",
      "stackra-pwa-fonts",
      "stackra-pwa-html",
    ]);
  });

  it("forwards runtimeCaching overrides into getRuntimeCaching", () => {
    const opts = getVitePwaOptions({
      manifest: MANIFEST,
      runtimeCaching: { includeApi: false },
    });
    const rules = workboxOf(opts)["runtimeCaching"] as ReadonlyArray<{
      options?: { cacheName?: string };
    }>;
    expect(rules).toHaveLength(3);
    expect(rules[0]?.options?.cacheName).toBe("stackra-pwa-images");
  });

  it("emits cleanupOutdatedCaches:true, clientsClaim:true, skipWaiting:false by default", () => {
    const wb = workboxOf(getVitePwaOptions({ manifest: MANIFEST }));
    expect(wb["cleanupOutdatedCaches"]).toBe(true);
    expect(wb["clientsClaim"]).toBe(true);
    expect(wb["skipWaiting"]).toBe(false);
  });
});

describe("getVitePwaOptions — devEnabled", () => {
  it("defaults devOptions.enabled to false", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST });
    const dev = opts["devOptions"] as Record<string, unknown>;
    expect(dev["enabled"]).toBe(false);
  });

  it("emits devOptions.enabled:true when devEnabled is true", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST, devEnabled: true });
    const dev = opts["devOptions"] as Record<string, unknown>;
    expect(dev["enabled"]).toBe(true);
  });
});

describe("getVitePwaOptions — workboxExtras", () => {
  it("merges workboxExtras into the workbox config", () => {
    const opts = getVitePwaOptions({
      manifest: MANIFEST,
      workboxExtras: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
    });
    expect(workboxOf(opts)["maximumFileSizeToCacheInBytes"]).toBe(5 * 1024 * 1024);
  });

  it("workboxExtras can override the default globPatterns", () => {
    const opts = getVitePwaOptions({
      manifest: MANIFEST,
      workboxExtras: { globPatterns: ["**/*.{js,css}"] },
    });
    expect(workboxOf(opts)["globPatterns"]).toEqual(["**/*.{js,css}"]);
  });
});

describe("getVitePwaOptions — navigate fallback overrides", () => {
  it("honours navigateFallback: null", () => {
    const opts = getVitePwaOptions({ manifest: MANIFEST, navigateFallback: null });
    expect(workboxOf(opts)["navigateFallback"]).toBeNull();
  });

  it("honours a custom navigateFallbackDenylist", () => {
    const custom = [/^\/custom\//];
    const opts = getVitePwaOptions({ manifest: MANIFEST, navigateFallbackDenylist: custom });
    expect(workboxOf(opts)["navigateFallbackDenylist"]).toEqual([...custom]);
  });
});

describe("DEFAULT_NAVIGATE_FALLBACK_DENYLIST", () => {
  it("excludes /api/*", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/api/users"))).toBe(true);
  });
  it("excludes /broadcasting/*", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/broadcasting/auth"))).toBe(
      true,
    );
  });
  it("excludes files with an extension", () => {
    expect(DEFAULT_NAVIGATE_FALLBACK_DENYLIST.some((rx) => rx.test("/asset.js"))).toBe(true);
  });
});
