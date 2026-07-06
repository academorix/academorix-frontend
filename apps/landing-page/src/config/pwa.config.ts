/**
 * @file pwa.config.ts
 * @module config/pwa.config
 *
 * @description
 * Structural configuration for the marketing app's Progressive Web
 * App manifest. Locale-agnostic constants (icons, display, categories,
 * theme colors) live here; per-locale strings (name, description,
 * shortcut labels) are pulled from `src/messages/{locale}.json` under
 * the `pwa.*` namespace and composed at request time by
 * `src/app/manifest.webmanifest/route.ts`.
 *
 * ## Locale flow
 *
 * Because Web App Manifests can't carry multiple locales natively, we
 * serve a different manifest per locale via a Route Handler with a
 * `?locale={code}` query. The install prompt's language + shortcut
 * labels reflect the locale the visitor was on when they installed.
 *
 * ## Icon files
 *
 * The manifest references these asset paths under `public/`:
 *
 *   - `/favicon.ico`               — Legacy 32×32 tab icon.
 *   - `/apple-touch-icon.png`      — 180×180 iOS home-screen icon.
 *   - `/pwa-64x64.png`             — Small manifest icon (high DPI).
 *   - `/pwa-192x192.png`           — Android launcher standard.
 *   - `/pwa-512x512.png`           — Android splash + Windows tile.
 *   - `/maskable-icon-512x512.png` — Android adaptive icon.
 *
 * These files must exist in `public/` before the manifest lists them
 * usefully. Generate them from `public/academorix-icon-tile.png` with
 * `@vite-pwa/assets-generator` — configured in `pwa-assets.config.ts`
 * and invoked manually via `pnpm generate-pwa-assets`. It's an opt-in
 * developer step (not a CI build step) so the native `sharp` binary
 * stays out of the Vercel hot path.
 */

import type { MetadataRoute } from "next";

import { DEFAULT_LOCALE, isRtlLocale, type Locale } from "@/config/i18n.config";
import { BRAND_COLORS } from "@/config/site.config";

/** The set of icon entries baked into every emitted manifest. */
export const PWA_ICONS: MetadataRoute.Manifest["icons"] = [
  {
    src: "/pwa-64x64.png",
    sizes: "64x64",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/pwa-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/maskable-icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

/** Icon used by every shortcut entry (Android launcher long-press menu). */
const SHORTCUT_ICON: MetadataRoute.Manifest["icons"] = [
  { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
];

/**
 * Non-translatable manifest defaults. Every field here is spec-driven
 * and read by browsers exactly as declared — do not remove one
 * without checking the Web App Manifest MDN page first.
 */
export const PWA_DEFAULTS = {
  /** Renders without browser chrome — the "installed app" feel. */
  display: "standalone" as const,

  /**
   * Fallback chain — if `standalone` isn't supported, try each in
   * order. `window-controls-overlay` lights up on desktop PWAs on
   * Windows / macOS Sonoma+; `minimal-ui` keeps the URL bar; the
   * final `browser` value is the last resort.
   */
  displayOverride: ["window-controls-overlay", "standalone", "minimal-ui", "browser"] as const,

  /** Vertical for phones, natural on tablets/desktops. */
  orientation: "any" as const,

  /** SW + manifest scope — every route under `/` is app-controlled. */
  scope: "/" as const,

  /** Light-mode address-bar tint. Kept in sync with the layout meta. */
  themeColor: BRAND_COLORS.light,

  /** Splash screen before first paint — matches globals.css `--bg`. */
  backgroundColor: "#FFFFFF",

  /** Store-listing category hints — surface in the install prompt. */
  categories: ["business", "productivity", "sports"] as const,

  /** We're a self-hosted app; don't advertise related native apps. */
  preferRelatedApplications: false,
} as const;

/** Shortcuts advertised in the OS jump-list (long-press / dock menu). */
export const PWA_SHORTCUTS_STRUCTURE = [
  { key: "pricing", path: "/pricing" },
  { key: "products", path: "/products" },
  { key: "sports", path: "/sports" },
  { key: "contactSales", path: "/contact-sales" },
] as const;

/** Union of shortcut keys — must line up with the `pwa.shortcuts` i18n keys. */
export type PwaShortcutKey = (typeof PWA_SHORTCUTS_STRUCTURE)[number]["key"];

/**
 * Per-shortcut i18n strings. Matches the structure under
 * `pwa.shortcuts.*` in `src/messages/{locale}.json`.
 */
export interface PwaShortcutMessages {
  name: string;
  shortName: string;
  description: string;
}

/**
 * Locale-aware strings the manifest needs. Sourced from
 * `src/messages/{locale}.json` under `pwa.*`.
 */
export interface PwaMessages {
  name: string;
  shortName: string;
  description: string;
  shortcuts: Readonly<Record<PwaShortcutKey, PwaShortcutMessages>>;
}

/** Options accepted by {@link buildManifest}. */
export interface BuildManifestOptions {
  locale: Locale;
  messages: PwaMessages;
}

/**
 * Composes the locale-appropriate absolute path for `start_url` and
 * shortcut URLs. English (the default locale) stays bare; other
 * locales are prefixed with `/{code}` — matching next-intl's
 * `"as-needed"` policy.
 */
function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Builds the full Web App Manifest for the given locale. Consumed by
 * `src/app/manifest.webmanifest/route.ts` and (indirectly, via that
 * route) by every browser that fetches `manifest.webmanifest`.
 */
export function buildManifest(options: BuildManifestOptions): MetadataRoute.Manifest {
  const { locale, messages } = options;
  const isRtl = isRtlLocale(locale);

  const shortcuts: MetadataRoute.Manifest["shortcuts"] = PWA_SHORTCUTS_STRUCTURE.map((entry) => {
    const shortcut = messages.shortcuts[entry.key];

    return {
      name: shortcut.name,
      short_name: shortcut.shortName,
      description: shortcut.description,
      url: `${localePath(locale, entry.path)}?source=pwa-shortcut`,
      icons: SHORTCUT_ICON,
    };
  });

  return {
    id: "/?source=pwa",
    name: messages.name,
    short_name: messages.shortName,
    description: messages.description,
    lang: locale,
    dir: isRtl ? "rtl" : "ltr",
    display: PWA_DEFAULTS.display,
    display_override: [...PWA_DEFAULTS.displayOverride],
    orientation: PWA_DEFAULTS.orientation,
    theme_color: PWA_DEFAULTS.themeColor,
    background_color: PWA_DEFAULTS.backgroundColor,
    scope: PWA_DEFAULTS.scope,
    start_url: `${localePath(locale, "/")}${locale === DEFAULT_LOCALE ? "" : "/"}?source=pwa`,
    categories: [...PWA_DEFAULTS.categories],
    icons: PWA_ICONS,
    shortcuts,
    prefer_related_applications: PWA_DEFAULTS.preferRelatedApplications,
  };
}

/** Aggregate handle for barrel consumers. */
export const pwa = {
  icons: PWA_ICONS,
  defaults: PWA_DEFAULTS,
  shortcuts: PWA_SHORTCUTS_STRUCTURE,
  buildManifest,
} as const;
