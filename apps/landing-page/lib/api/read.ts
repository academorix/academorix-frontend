/**
 * @file read.ts
 * @module lib/api/read
 *
 * @description
 * Server-side reader for the marketing app's mock JSON fixtures under
 * `public/data/{locale}/`. Mirrors the pattern in `apps/web/src/providers/
 * data/mock-data-provider.ts` — same envelope-or-bare-array handling —
 * optimised for Next.js Server Components in an i18n-aware setup:
 *
 *   - Reads directly from the filesystem via `fs.readFile` (works during
 *     `next build`, no dev server required).
 *   - Locale-aware: `readJson<T>("site", "ar")` reads
 *     `public/data/ar/site.json`, falling back to `public/data/en/site.json`
 *     if the Arabic version isn't shipped yet. Content teams can ship
 *     translations incrementally.
 *   - Caches parsed payloads in-process (keyed by `{locale}:{name}`) so
 *     re-renders within a request don't re-open the file.
 *   - Never bundles the JSON into the client — every call is Server-only.
 *
 * When we're ready to hit a real API (backend or CMS), swap this file's
 * internals for `fetch()` against the origin — every consumer function in
 * `lib/api/*.ts` stays the same. Just add a `locale` header/query and
 * fall back to `en` on 404.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { routing } from "@/i18n/routing";

/** Shape of a Laravel-style envelope (`{ data: ... }`). Accepted transparently. */
type Envelope<T> = { data: T };

/** In-process cache so a single request only reads each fixture once. */
const CACHE = new Map<string, unknown>();

/** Absolute filesystem path to the `public/data/` directory. */
const DATA_ROOT = path.join(process.cwd(), "public", "data");

/** The always-present fallback locale — every fixture ships in English. */
const FALLBACK_LOCALE: string = routing.defaultLocale;

/**
 * Reads `public/data/{locale}/{name}.json` (falling back to English when
 * the localised file is missing), transparently unwrapping `{ data }`
 * envelopes so consumers always receive the payload directly.
 *
 * Throws when neither the localised nor the English file exists — feed
 * that exception to Next's `notFound()` in a route handler.
 *
 * @typeParam T - Expected payload shape after unwrapping.
 * @param name - Fixture name without extension (e.g. `"products"`).
 * @param locale - The visitor's active locale (`"en"`, `"ar"`, …).
 */
export async function readJson<T>(name: string, locale: string): Promise<T> {
  const cacheKey = `${locale}:${name}`;
  const cached = CACHE.get(cacheKey);

  if (cached !== undefined) {
    return cached as T;
  }

  const raw = await readLocalisedFile(name, locale);
  const parsed: unknown = JSON.parse(raw);

  // Transparent envelope unwrap — matches apps/web's mock provider.
  const payload: T =
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "data" in (parsed as Record<string, unknown>)
      ? (parsed as Envelope<T>).data
      : (parsed as T);

  CACHE.set(cacheKey, payload);

  return payload;
}

/**
 * Reads the raw JSON string for a fixture, preferring the localised file
 * and falling back to English when the translation hasn't been shipped.
 */
async function readLocalisedFile(name: string, locale: string): Promise<string> {
  const primary = path.join(DATA_ROOT, locale, `${name}.json`);

  try {
    return await fs.readFile(primary, "utf-8");
  } catch (error) {
    // Only fall back for missing-file errors — other IO issues should bubble.
    const isMissing = (error as NodeJS.ErrnoException).code === "ENOENT";

    if (!isMissing || locale === FALLBACK_LOCALE) {
      throw error;
    }
  }

  const fallback = path.join(DATA_ROOT, FALLBACK_LOCALE, `${name}.json`);

  return fs.readFile(fallback, "utf-8");
}

/**
 * Convenience wrapper — reads a fixture that stores a `Record<slug, T>`
 * (e.g. `products.json`), returning the values as an ordered array in the
 * order the JSON declares them.
 *
 * @typeParam T - Entry shape.
 * @param name - Fixture name.
 * @param locale - Active locale.
 */
export async function readCollection<T>(name: string, locale: string): Promise<T[]> {
  const map = await readJson<Record<string, T>>(name, locale);

  return Object.values(map);
}

/**
 * Convenience wrapper — reads a fixture that stores a `Record<slug, T>`
 * and returns the entry for `slug`, or `null` if absent.
 *
 * @typeParam T - Entry shape.
 * @param name - Fixture name.
 * @param slug - Key inside the fixture.
 * @param locale - Active locale.
 */
export async function readCollectionEntry<T>(
  name: string,
  slug: string,
  locale: string,
): Promise<T | null> {
  const map = await readJson<Record<string, T>>(name, locale);

  return map[slug] ?? null;
}

/**
 * Returns every key in a `Record<slug, T>` fixture — used by dynamic
 * routes for `generateStaticParams()`. Reads from the English (default)
 * catalogue so slugs stay stable across locales; localised routes rely
 * on the shared slug and translate the surrounding content.
 *
 * @param name - Fixture name.
 */
export async function readCollectionSlugs(name: string): Promise<string[]> {
  const map = await readJson<Record<string, unknown>>(name, FALLBACK_LOCALE);

  return Object.keys(map);
}
