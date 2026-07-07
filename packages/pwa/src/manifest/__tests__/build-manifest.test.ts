/**
 * @file build-manifest.test.ts
 * @module @academorix/pwa/manifest/__tests__/build-manifest.test
 *
 * @description
 * Tests for {@link buildManifest}. Verifies:
 *
 *  - Minimal input → a valid W3C-shaped manifest with sane defaults
 *    (`dir: "auto"`, `start_url: "/"`, `scope: "/"`,
 *    `display: "standalone"`).
 *  - Optional inputs (`shortcuts`, `translations`, `displayOverride`,
 *    `categories`, `extra`) are merged when present and omitted otherwise.
 *  - The internal `id` field on shortcuts is stripped before emit.
 */

import { describe, expect, it } from "vitest";

import { buildManifest } from "../build-manifest.util";

import type {
  BuildManifestInput,
  ManifestIcon,
  ManifestShortcut,
  ManifestTranslation,
  WebAppManifest,
} from "../";

const ICONS: readonly ManifestIcon[] = [
  { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
];

const MINIMAL_INPUT: BuildManifestInput = {
  name: "Academorix",
  shortName: "Academorix",
  description: "The operating system for modern academies.",
  lang: "en-US",
  themeColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  icons: ICONS,
};

describe("buildManifest() — minimal input", () => {
  it("returns a manifest that passes structural typecheck", () => {
    const manifest: WebAppManifest = buildManifest(MINIMAL_INPUT);

    expect(manifest.name).toBe("Academorix");
    expect(manifest.short_name).toBe("Academorix");
    expect(manifest.description).toBe(MINIMAL_INPUT.description);
    expect(manifest.lang).toBe("en-US");
    expect(manifest.theme_color).toBe("#0EA5E9");
    expect(manifest.background_color).toBe("#FFFFFF");
    expect(manifest.icons).toBe(ICONS);
  });

  it("defaults dir to 'auto'", () => {
    expect(buildManifest(MINIMAL_INPUT).dir).toBe("auto");
  });

  it("defaults start_url to '/'", () => {
    expect(buildManifest(MINIMAL_INPUT).start_url).toBe("/");
  });

  it("defaults scope to '/'", () => {
    expect(buildManifest(MINIMAL_INPUT).scope).toBe("/");
  });

  it("defaults display to 'standalone'", () => {
    expect(buildManifest(MINIMAL_INPUT).display).toBe("standalone");
  });

  it("does not emit shortcuts when the caller omits them", () => {
    const manifest = buildManifest(MINIMAL_INPUT);

    expect("shortcuts" in manifest).toBe(false);
    expect(manifest.shortcuts).toBeUndefined();
  });

  it("does not emit translations when the caller omits them", () => {
    const manifest = buildManifest(MINIMAL_INPUT);

    expect("translations" in manifest).toBe(false);
    expect(manifest.translations).toBeUndefined();
  });

  it("does not emit display_override when the caller omits it", () => {
    const manifest = buildManifest(MINIMAL_INPUT);

    expect("display_override" in manifest).toBe(false);
  });

  it("does not emit categories when the caller omits them", () => {
    const manifest = buildManifest(MINIMAL_INPUT);

    expect("categories" in manifest).toBe(false);
  });
});

describe("buildManifest() — override defaults", () => {
  it("honours a custom dir override (e.g. 'rtl' for Arabic-primary apps)", () => {
    expect(buildManifest({ ...MINIMAL_INPUT, dir: "rtl" }).dir).toBe("rtl");
    expect(buildManifest({ ...MINIMAL_INPUT, dir: "ltr" }).dir).toBe("ltr");
  });

  it("honours a custom startUrl", () => {
    expect(buildManifest({ ...MINIMAL_INPUT, startUrl: "/dashboard" }).start_url).toBe(
      "/dashboard",
    );
  });

  it("honours a custom scope", () => {
    expect(buildManifest({ ...MINIMAL_INPUT, scope: "/app" }).scope).toBe("/app");
  });

  it("honours a custom display mode", () => {
    expect(buildManifest({ ...MINIMAL_INPUT, display: "fullscreen" }).display).toBe("fullscreen");
  });
});

describe("buildManifest() — shortcuts", () => {
  it("strips the internal `id` field from every shortcut on emit", () => {
    const shortcuts: readonly ManifestShortcut[] = [
      {
        id: "athletes",
        name: "Athletes",
        url: "/athletes",
        description: "Manage athletes.",
      },
      { id: "sessions", name: "Sessions", url: "/sessions" },
    ];

    const manifest = buildManifest({ ...MINIMAL_INPUT, shortcuts });

    expect(manifest.shortcuts).toHaveLength(2);
    for (const emitted of manifest.shortcuts ?? []) {
      expect("id" in emitted).toBe(false);
      expect(emitted.name).toBeTypeOf("string");
      expect(emitted.url).toBeTypeOf("string");
    }
  });

  it("preserves every non-id field on the shortcut verbatim", () => {
    const shortcuts: readonly ManifestShortcut[] = [
      {
        id: "athletes",
        name: "Athletes",
        short_name: "Athl.",
        description: "Manage athletes.",
        url: "/athletes",
        icons: [{ src: "/i.png", sizes: "96x96", type: "image/png" }],
      },
    ];

    const manifest = buildManifest({ ...MINIMAL_INPUT, shortcuts });

    expect(manifest.shortcuts?.[0]).toEqual({
      name: "Athletes",
      short_name: "Athl.",
      description: "Manage athletes.",
      url: "/athletes",
      icons: [{ src: "/i.png", sizes: "96x96", type: "image/png" }],
    });
  });

  it("returns a fresh array (does not mutate the caller's input)", () => {
    const shortcuts: readonly ManifestShortcut[] = [{ id: "a", name: "A", url: "/a" }];

    const manifest = buildManifest({ ...MINIMAL_INPUT, shortcuts });

    expect(manifest.shortcuts).not.toBe(shortcuts);
    expect(shortcuts[0]?.id).toBe("a"); // Input unchanged.
  });
});

describe("buildManifest() — translations", () => {
  it("passes the translations object through verbatim", () => {
    const translations: Readonly<Record<string, ManifestTranslation>> = {
      "ar-EG": {
        name: "أكاديمُريكس",
        short_name: "أكاديمُريكس",
        description: "…",
      },
      "fr-FR": { name: "Academorix (FR)" },
    };

    const manifest = buildManifest({ ...MINIMAL_INPUT, translations });

    expect(manifest.translations).toBe(translations);
  });
});

describe("buildManifest() — displayOverride", () => {
  it("spreads the value into the emitted display_override array", () => {
    const displayOverride = ["window-controls-overlay", "standalone"] as const;

    const manifest = buildManifest({ ...MINIMAL_INPUT, displayOverride });

    expect(manifest.display_override).toEqual(["window-controls-overlay", "standalone"]);
  });
});

describe("buildManifest() — categories + extra", () => {
  it("merges the categories array when provided", () => {
    const categories = ["education", "productivity"] as const;

    const manifest = buildManifest({ ...MINIMAL_INPUT, categories });

    expect(manifest.categories).toBe(categories);
  });

  it("spreads the extra object into the top level of the manifest", () => {
    const manifest = buildManifest({
      ...MINIMAL_INPUT,
      extra: {
        prefer_related_applications: false,
        related_applications: [],
      },
    });

    expect(manifest.prefer_related_applications).toBe(false);
    expect(manifest.related_applications).toEqual([]);
  });

  it("allows extra to override earlier fields (last-write-wins spread)", () => {
    const manifest = buildManifest({
      ...MINIMAL_INPUT,
      extra: { name: "OverriddenName" },
    });

    // `extra` spreads AFTER the standard fields, so it wins on collision.
    expect(manifest.name).toBe("OverriddenName");
  });
});
