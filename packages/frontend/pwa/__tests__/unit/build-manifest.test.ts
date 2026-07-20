/**
 * @file build-manifest.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Tests for {@link buildManifest}. Covers base fields,
 *   default values, optional field spreading, shortcut id-stripping,
 *   translations pass-through, orientation, density extension, and
 *   the full W3C + Chromium-specific extension surface (Launch
 *   Handler, File / Protocol / URL Handling, Share Target, Widgets,
 *   Tab Strip, Note Taking, Edge Side Panel).
 */

import { describe, expect, it } from "vitest";

import { buildManifest } from "@/manifest";
import type {
  IBuildManifestInput,
  IManifestIcon,
  IManifestShortcut,
  IManifestTranslation,
  IWebAppManifest,
} from "@/manifest";

const ICONS: readonly IManifestIcon[] = [
  { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
];

const MINIMAL: IBuildManifestInput = {
  name: "Stackra",
  shortName: "Stackra",
  description: "The operating system for modern teams.",
  lang: "en-US",
  themeColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  icons: ICONS,
};

describe("buildManifest — minimal input", () => {
  it("produces a manifest that passes structural typecheck", () => {
    const manifest: IWebAppManifest = buildManifest(MINIMAL);
    expect(manifest.name).toBe("Stackra");
    expect(manifest.short_name).toBe("Stackra");
    expect(manifest.description).toBe(MINIMAL.description);
    expect(manifest.lang).toBe("en-US");
    expect(manifest.theme_color).toBe("#0EA5E9");
    expect(manifest.background_color).toBe("#FFFFFF");
    expect(manifest.icons).toBe(ICONS);
  });

  it("defaults dir/scope/start_url/display", () => {
    const m = buildManifest(MINIMAL);
    expect(m.dir).toBe("auto");
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("omits optional fields when the caller did not provide them", () => {
    const m = buildManifest(MINIMAL);
    // Every optional W3C or Chromium field should be absent.
    for (const key of [
      "shortcuts",
      "translations",
      "display_override",
      "categories",
      "keywords",
      "orientation",
      "screenshots",
      "id",
      "version",
      "author",
      "prefer_related_applications",
      "related_applications",
      "launch_handler",
      "edge_side_panel",
      "file_handlers",
      "protocol_handlers",
      "url_handlers",
      "share_target",
      "note_taking",
      "widgets",
      "tab_strip",
      "permissions",
      "capture_links",
      "handle_links",
      "scope_extensions",
      "launch_queue",
    ] as const) {
      expect(key in m).toBe(false);
    }
  });
});

describe("buildManifest — overrides", () => {
  it("honours dir / startUrl / scope / display overrides", () => {
    expect(buildManifest({ ...MINIMAL, dir: "rtl" }).dir).toBe("rtl");
    expect(buildManifest({ ...MINIMAL, startUrl: "/dashboard" }).start_url).toBe("/dashboard");
    expect(buildManifest({ ...MINIMAL, scope: "/app" }).scope).toBe("/app");
    expect(buildManifest({ ...MINIMAL, display: "fullscreen" }).display).toBe("fullscreen");
  });

  it("emits orientation when provided (legacy Magento parity)", () => {
    expect(buildManifest({ ...MINIMAL, orientation: "portrait" }).orientation).toBe("portrait");
  });

  it("emits display_override when provided", () => {
    const m = buildManifest({
      ...MINIMAL,
      displayOverride: ["window-controls-overlay", "standalone"],
    });
    expect(m.display_override).toEqual(["window-controls-overlay", "standalone"]);
  });
});

describe("buildManifest — shortcuts", () => {
  it("strips the internal `id` field from every shortcut", () => {
    const shortcuts: readonly IManifestShortcut[] = [
      { id: "inbox", name: "Inbox", url: "/inbox" },
      { id: "settings", name: "Settings", url: "/settings" },
    ];
    const m = buildManifest({ ...MINIMAL, shortcuts });
    expect(m.shortcuts).toHaveLength(2);
    for (const emitted of m.shortcuts ?? []) {
      expect("id" in emitted).toBe(false);
    }
  });

  it("preserves every non-id field on the shortcut verbatim", () => {
    const shortcuts: readonly IManifestShortcut[] = [
      {
        id: "inbox",
        name: "Inbox",
        short_name: "In",
        description: "Unread messages",
        url: "/inbox",
        icons: [{ src: "/i.png", sizes: "96x96", type: "image/png" }],
      },
    ];
    const m = buildManifest({ ...MINIMAL, shortcuts });
    expect(m.shortcuts?.[0]).toEqual({
      name: "Inbox",
      short_name: "In",
      description: "Unread messages",
      url: "/inbox",
      icons: [{ src: "/i.png", sizes: "96x96", type: "image/png" }],
    });
  });

  it("does not mutate the caller-provided shortcuts array", () => {
    const shortcuts: readonly IManifestShortcut[] = [{ id: "a", name: "A", url: "/a" }];
    buildManifest({ ...MINIMAL, shortcuts });
    expect(shortcuts[0]?.id).toBe("a");
  });
});

describe("buildManifest — translations", () => {
  it("passes the translations map through verbatim (widened shape)", () => {
    const translations: Readonly<Record<string, IManifestTranslation>> = {
      // W3C-standard fields
      "ar-EG": { name: "ستكرا", short_name: "ستكرا" },
      // Extended surface — the widened shape now accepts every field
      // W3C localises: description, dir, categories, keywords,
      // shortcuts, screenshots.
      "fr-FR": {
        name: "Stackra (FR)",
        description: "Le système d’exploitation…",
        dir: "ltr",
        categories: ["productivité"],
        keywords: ["collaboration"],
        shortcuts: [{ name: "Boîte de réception", url: "/inbox" }],
      },
      // Free-form extension per the `[key: string]: unknown` tail —
      // plugin fields pass through untouched.
      "zh-CN": { name: "Stackra", "x-plugin-tone": "formal" },
    };
    const m = buildManifest({ ...MINIMAL, translations });
    expect(m.translations).toBe(translations);
    expect(m.translations?.["fr-FR"]?.description).toBe("Le système d’exploitation…");
    expect(m.translations?.["zh-CN"]?.["x-plugin-tone"]).toBe("formal");
  });
});

describe("buildManifest — density extension + screenshots + categories + extra", () => {
  it("preserves the density field on icons", () => {
    const iconsWithDensity: readonly IManifestIcon[] = [
      { src: "/i.png", sizes: "72x72", type: "image/png", density: "1.5" },
    ];
    const m = buildManifest({ ...MINIMAL, icons: iconsWithDensity });
    expect(m.icons?.[0]?.density).toBe("1.5");
  });

  it("spreads categories + screenshots when provided", () => {
    const categories = ["productivity", "business"] as const;
    const screenshots = [{ src: "/s.png", sizes: "1080x1920", type: "image/png" }] as const;
    const m = buildManifest({ ...MINIMAL, categories, screenshots });
    expect(m.categories).toBe(categories);
    expect(m.screenshots).toBe(screenshots);
  });

  it("spreads `extra` into the top level (last-write-wins)", () => {
    const m = buildManifest({
      ...MINIMAL,
      extra: {
        prefer_related_applications: false,
        related_applications: [],
        name: "OverriddenName",
      },
    });
    expect(m.prefer_related_applications).toBe(false);
    expect(m.related_applications).toEqual([]);
    expect(m.name).toBe("OverriddenName");
  });
});

describe("buildManifest — W3C extensions", () => {
  it("emits `id` (manifest_id) verbatim", () => {
    const m = buildManifest({ ...MINIMAL, id: "/?source=pwa" });
    expect(m.id).toBe("/?source=pwa");
  });

  it("emits keywords when provided", () => {
    const keywords = ["collaboration", "chat"] as const;
    const m = buildManifest({ ...MINIMAL, keywords });
    expect(m.keywords).toBe(keywords);
  });

  it("emits non-standard version + author when provided", () => {
    const m = buildManifest({ ...MINIMAL, version: "1.2.3", author: "Stackra Team" });
    expect(m.version).toBe("1.2.3");
    expect(m.author).toBe("Stackra Team");
  });

  it("emits related_applications + prefer_related_applications", () => {
    const related = [
      { platform: "play", url: "https://play.google.com/store/apps/details?id=com.stackra" },
    ] as const;
    const m = buildManifest({
      ...MINIMAL,
      preferRelatedApplications: true,
      relatedApplications: related,
    });
    expect(m.prefer_related_applications).toBe(true);
    expect(m.related_applications).toBe(related);
  });

  it("emits launch_handler with a single client_mode value", () => {
    const m = buildManifest({ ...MINIMAL, launchHandler: { client_mode: "focus-existing" } });
    expect(m.launch_handler).toEqual({ client_mode: "focus-existing" });
  });

  it("emits launch_handler with an array of client_mode preferences", () => {
    const m = buildManifest({
      ...MINIMAL,
      launchHandler: { client_mode: ["focus-existing", "navigate-new"] },
    });
    expect(m.launch_handler?.client_mode).toEqual(["focus-existing", "navigate-new"]);
  });

  it("emits edge_side_panel", () => {
    const m = buildManifest({ ...MINIMAL, edgeSidePanel: { preferred_width: 480 } });
    expect(m.edge_side_panel).toEqual({ preferred_width: 480 });
  });
});

describe("buildManifest — Chromium APIs", () => {
  it("emits file_handlers verbatim", () => {
    const fileHandlers = [{ action: "/open", accept: { "text/plain": [".txt"] } }] as const;
    const m = buildManifest({ ...MINIMAL, fileHandlers });
    expect(m.file_handlers).toBe(fileHandlers);
  });

  it("emits protocol_handlers verbatim", () => {
    const protocolHandlers = [{ protocol: "web+stackra", url: "/open?u=%s" }] as const;
    const m = buildManifest({ ...MINIMAL, protocolHandlers });
    expect(m.protocol_handlers).toBe(protocolHandlers);
  });

  it("emits url_handlers verbatim", () => {
    const urlHandlers = [{ origin: "https://stackra.com" }] as const;
    const m = buildManifest({ ...MINIMAL, urlHandlers });
    expect(m.url_handlers).toBe(urlHandlers);
  });

  it("emits share_target with method / enctype / params verbatim", () => {
    const shareTarget = {
      action: "/share",
      method: "POST" as const,
      enctype: "multipart/form-data" as const,
      params: {
        title: "t",
        text: "x",
        url: "u",
        files: [{ name: "attachments", accept: ["image/*"] }],
      },
    };
    const m = buildManifest({ ...MINIMAL, shareTarget });
    expect(m.share_target).toEqual(shareTarget);
  });

  it("emits note_taking verbatim", () => {
    const m = buildManifest({ ...MINIMAL, noteTaking: { new_note_url: "/notes/new" } });
    expect(m.note_taking).toEqual({ new_note_url: "/notes/new" });
  });

  it("emits widgets verbatim", () => {
    const widgets = [{ name: "Inbox widget", tag: "inbox" }] as const;
    const m = buildManifest({ ...MINIMAL, widgets });
    expect(m.widgets).toBe(widgets);
  });

  it("emits tab_strip verbatim", () => {
    const tabStrip = {
      home_tab: {
        icons: [{ src: "/home.png", sizes: "48x48", type: "image/png" }],
        scope_patterns: ["/inbox"],
      },
    };
    const m = buildManifest({ ...MINIMAL, tabStrip });
    expect(m.tab_strip).toEqual(tabStrip);
  });

  it("emits capture_links / handle_links / scope_extensions", () => {
    const scopeExtensions = ["https://cdn.stackra.com"] as const;
    const m = buildManifest({
      ...MINIMAL,
      captureLinks: "new-client",
      handleLinks: "preferred",
      scopeExtensions,
    });
    expect(m.capture_links).toBe("new-client");
    expect(m.handle_links).toBe("preferred");
    expect(m.scope_extensions).toBe(scopeExtensions);
  });

  it("emits permissions + launch_queue verbatim", () => {
    const permissions = ["clipboard-read"] as const;
    const launchQueue = { fooOpaque: true };
    const m = buildManifest({ ...MINIMAL, permissions, launchQueue });
    expect(m.permissions).toBe(permissions);
    expect(m.launch_queue).toBe(launchQueue);
  });
});
