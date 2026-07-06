/**
 * @file route.ts
 * @module app/manifest.webmanifest/route
 *
 * @description
 * Locale-aware Web App Manifest handler. Standard Web App Manifests
 * are single-locale — the spec has no cross-locale composition — so
 * we serve DIFFERENT JSON documents at the same URL depending on the
 * `?locale=` query. The visitor installs the flavour of the app
 * matching the language they were browsing in.
 *
 * ## URL contract
 *
 *   `GET /manifest.webmanifest?locale=en` → English manifest.
 *   `GET /manifest.webmanifest?locale=ar` → Arabic manifest (RTL).
 *
 * Any unknown / missing locale falls back to {@link DEFAULT_LOCALE}
 * so a browser that fetches the bare URL (some crawlers do) still
 * gets a valid document.
 *
 * ## Why a Route Handler
 *
 *  - Next's `app/manifest.ts` convention only supports a single
 *    manifest per project; it can't read query params. A Route
 *    Handler is the escape hatch.
 *  - `manifest.webmanifest` contains a dot, so the next-intl
 *    middleware matcher `.*\\..*` explicitly excludes it — the
 *    handler responds directly without a locale rewrite.
 *
 * ## Caching
 *
 * The manifest changes rarely (only when translations or the PWA
 * config change) so we set a modest `max-age=3600` with
 * `stale-while-revalidate=86400`. Browsers refetch daily but keep
 * serving the cached copy in the meantime.
 */

import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "@/config/i18n.config";
import { buildManifest, type PwaMessages } from "@/config/pwa.config";

export const runtime = "nodejs";

/**
 * Loads the `pwa.*` slice from the compiled message catalog for the
 * given locale. The dynamic import path is a template literal so
 * Next's chunking still splits per-locale JSON without shipping every
 * language to every request.
 */
async function loadPwaMessages(locale: Locale): Promise<PwaMessages> {
  const module = (await import(`@/messages/${locale}.json`)) as {
    default: { pwa: PwaMessages };
  };

  return module.default.pwa;
}

/** Emits `application/manifest+json` for the requested locale. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale: Locale =
    requestedLocale && isSupportedLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;

  const messages = await loadPwaMessages(locale);
  const manifest = buildManifest({ locale, messages });

  return NextResponse.json(manifest, {
    headers: {
      // Web App Manifest MIME type — Chrome + Firefox both accept
      // `application/json` too, but the spec-preferred value gets
      // us cleaner Lighthouse audits.
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
