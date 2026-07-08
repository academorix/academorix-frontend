/**
 * @file branding.ts
 * @module lib/tenancy/branding
 *
 * @description
 * Converts a tenant's `TenantBranding` payload into the DOM writes that
 * apply the brand — CSS variables on `<html>`, the tab title prefix, and
 * the favicon href.
 *
 * ## Why oklch
 *
 * HeroUI v3 stores every color as an oklch CSS variable and derives every
 * downstream token (`--accent-hover`, `--accent-soft`, chart-1..chart-5,
 * focus outlines) via `color-mix()` / `oklch(from ...)` calculations off
 * that one primitive. Overriding a single variable — `--accent` — cascades
 * a full brand palette across buttons, focus rings, links, chips, charts,
 * and every Pro component.
 *
 * Tenants ship hex, so we parse `#RRGGBB` → sRGB → linear RGB → OKLab →
 * OKLCH inline (no runtime dep). Rounding is generous (2 decimals of L, 3
 * of C, 1 of H) which is well within the perceptual difference threshold
 * and keeps the emitted CSS short.
 *
 * ## Readable foreground
 *
 * The accent text color (`--accent-foreground`) has to contrast the accent
 * background. We derive it from the accent's own lightness: if L ≥ 65 the
 * accent is bright and we use a near-black foreground; otherwise a
 * near-white foreground. This mirrors the WCAG "large text 3:1" cutoff for
 * typical accent hues and matches HeroUI's default choice.
 *
 * ## Idempotence + reset
 *
 * `applyBrandingToDom(null)` clears every property this module has ever
 * written, restoring the shell's default theme. Safe to call on every
 * tenant switch or during test teardown.
 */

import type { TenantBranding } from "@/types";

/** Every CSS custom property this module writes; kept small on purpose. */
const BRAND_CSS_PROPS = ["--accent", "--accent-foreground", "--focus", "--link"] as const;

/** Attribute we set on the favicon `<link>` so we can find it again on updates. */
const FAVICON_LINK_ATTR = "data-tenant-favicon";

/** Fallback favicon URL when the tenant has no custom icon. */
const DEFAULT_FAVICON_HREF = "/favicon.ico";

/** Parsed OKLCH color with fields in the CSS-standard ranges. */
export interface OklchColor {
  /** Perceived lightness, 0..100 (percent). */
  l: number;
  /** Chroma, 0..~0.4 for typical sRGB colors. */
  c: number;
  /** Hue in degrees, 0..360. */
  h: number;
}

/**
 * Parse a `#RGB`, `#RRGGBB`, or `#RRGGBBAA` hex string into RGB channels in
 * the 0..1 range. Returns null for anything that isn't a valid hex color so
 * callers can decide how to fall back.
 */
function parseHexToLinearRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, "");
  let normalized: string | null = null;

  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    // #RGB → #RRGGBB (each nibble doubled).
    normalized = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    normalized = cleaned;
  } else if (/^[0-9a-f]{8}$/i.test(cleaned)) {
    // #RRGGBBAA → drop alpha; we don't emit rgba in the palette.
    normalized = cleaned.slice(0, 6);
  }

  if (normalized === null) {
    return null;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;

  // sRGB → linear RGB (inverse gamma) — the correct input for the OKLab
  // matrix. Standard 2.4 gamma with the piecewise threshold at 0.04045.
  const toLinear = (channel: number): number =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return [toLinear(r), toLinear(g), toLinear(b)];
}

/**
 * Convert a linear sRGB triple to OKLCH.
 *
 * Steps:
 *   1. Linear RGB → OKLab (Björn Ottosson's published matrix + cube root).
 *   2. OKLab → OKLCH via polar coordinates (`sqrt(a² + b²)` for chroma,
 *      `atan2(b, a)` for hue in degrees).
 */
function linearRgbToOklch([r, g, b]: [number, number, number]): OklchColor {
  // Linear RGB → LMS (Björn Ottosson's OKLab paper).
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Cube root to compress the perceptually-linear space.
  const l3 = Math.cbrt(l);
  const m3 = Math.cbrt(m);
  const s3 = Math.cbrt(s);

  // LMS' → OKLab.
  const okL = 0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3;
  const okA = 1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3;
  const okB = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3;

  // OKLab → OKLCH.
  const chroma = Math.sqrt(okA * okA + okB * okB);
  let hue = (Math.atan2(okB, okA) * 180) / Math.PI;

  if (hue < 0) {
    hue += 360;
  }

  return {
    // Round to 2 decimals of percent, 3 of chroma, 1 of hue — well under
    // any perceptual difference threshold.
    l: Math.round(okL * 10000) / 100,
    c: Math.round(chroma * 1000) / 1000,
    h: Math.round(hue * 10) / 10,
  };
}

/**
 * Convert a `#RRGGBB` (or `#RGB` / `#RRGGBBAA`) hex string to a CSS oklch()
 * literal (e.g. `"oklch(62.04% 0.195 253.83)"`), or `null` when the input
 * cannot be parsed.
 */
export function hexToOklch(hex: string): string | null {
  const rgb = parseHexToLinearRgb(hex);

  if (rgb === null) {
    return null;
  }

  const { l, c, h } = linearRgbToOklch(rgb);

  return `oklch(${l}% ${c} ${h})`;
}

/**
 * Choose a readable foreground for a given accent OKLCH lightness.
 *
 * Threshold at L=65: values at or above are considered "light accents"
 * (pastels, mid-tone yellows) and get a near-black foreground; darker
 * accents get near-white. The cutoff aligns with WCAG large-text 3:1 in
 * the typical brand-hue range.
 *
 * The returned string is an `oklch(...)` literal ready to drop into a CSS
 * variable value.
 */
export function readableForegroundFor(accentLightness: number): string {
  return accentLightness >= 65 ? "oklch(15% 0 0)" : "oklch(99.11% 0 0)";
}

/**
 * Build a map of CSS custom-property overrides from a `TenantBranding`
 * payload. Only the properties this module writes (`--accent`,
 * `--accent-foreground`, `--focus`, `--link`) are populated; every
 * downstream token (soft variants, hover shades, chart series) inherits
 * automatically via HeroUI's `color-mix()` / `oklch(from ...)` derivations.
 *
 * Returns an empty object when `primary_color` is missing or malformed —
 * callers should treat that as "keep the default theme".
 */
export function brandingToCssVars(branding: TenantBranding): Record<string, string> {
  const primary = branding.primary_color;

  if (!primary) {
    return {};
  }

  const accent = hexToOklch(primary);

  if (accent === null) {
    return {};
  }

  // Re-parse just to get lightness for the foreground contrast decision —
  // we deliberately do NOT expose OklchColor from hexToOklch to keep the
  // public surface CSS-string oriented.
  const rgb = parseHexToLinearRgb(primary);
  const { l } = linearRgbToOklch(rgb as [number, number, number]);
  const foreground = readableForegroundFor(l);

  return {
    "--accent": accent,
    "--accent-foreground": foreground,
    "--focus": accent,
    "--link": accent,
  };
}

/**
 * Write brand CSS variables to `document.documentElement`. Only the four
 * properties enumerated in {@link BRAND_CSS_PROPS} are touched; anything
 * else on the element is left alone. Callers who want to reset the brand
 * should pass `null`, which explicitly removes every property this module
 * has ever written.
 *
 * Safe to call in non-DOM environments (SSR, tests without a document) —
 * the function no-ops when `document` is not defined.
 */
function writeCssVarsToDom(vars: Record<string, string> | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  if (vars === null) {
    for (const prop of BRAND_CSS_PROPS) {
      root.style.removeProperty(prop);
    }

    return;
  }

  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value);
  }
}

/**
 * Update the document `<title>` so the browser tab reads
 * "<Tenant Name> · Academorix". When `tenantName` is null we restore the
 * bare product title.
 *
 * Deliberately keeps the format server-agnostic — the shell's Refine
 * `DocumentTitleHandler` will later prepend the current route's title
 * (e.g. "Athletes · Riverside · Academorix") on top of this baseline.
 */
function writeDocumentTitle(tenantName: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  document.title = tenantName === null ? "Academorix" : `${tenantName} · Academorix`;
}

/**
 * Swap the `<link rel="icon">` href to the tenant's favicon URL. When
 * `href` is null we restore the default favicon.
 *
 * Preserves the existing `<link>` if one is already present (we tag it with
 * a `data-tenant-favicon` attribute so subsequent updates find the same
 * element instead of stacking new ones). Creates a fresh element on the
 * first call.
 */
function writeFaviconHref(href: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const nextHref = href ?? DEFAULT_FAVICON_HREF;

  let link = document.head.querySelector<HTMLLinkElement>(`link[${FAVICON_LINK_ATTR}]`);

  if (link === null) {
    // Adopt an existing rel="icon" if the shell already ships one; else
    // create a fresh element. We tag whichever we end up with so future
    // writes update the same node.
    link = document.head.querySelector<HTMLLinkElement>("link[rel~='icon']");

    if (link === null) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.setAttribute(FAVICON_LINK_ATTR, "");
  }

  link.href = nextHref;
}

/**
 * Apply a `TenantBranding` payload to the current document — writes the
 * CSS variable overrides on `<html>`, updates the tab title, and swaps
 * the favicon. Pass `null` (with no tenant name) to reset everything to
 * the shell defaults.
 *
 * Safe to call at any time; deterministic (same input → same DOM state);
 * survives repeated invocations with different inputs.
 *
 * @param branding    White-label branding, or null to reset.
 * @param tenantName  Human-readable tenant name for the title; when omitted
 *                    the title is left alone. Pass `null` explicitly to
 *                    reset the title to the bare product name.
 */
export function applyBrandingToDom(
  branding: TenantBranding | null,
  tenantName?: string | null,
): void {
  writeCssVarsToDom(branding === null ? null : brandingToCssVars(branding));

  if (tenantName !== undefined) {
    writeDocumentTitle(tenantName);
  }

  if (branding !== null || tenantName === null) {
    writeFaviconHref(branding?.favicon_url ?? null);
  }
}
