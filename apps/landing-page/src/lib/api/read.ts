/**
 * @file read.ts
 * @module lib/api/read
 *
 * @description
 * Bilingual reader for the marketing app's flat JSON fixtures under
 * `public/data/*.json`. Every fixture stores translatable strings as
 * `{ en, ar }` leaves; this module walks the parsed tree at request
 * time and collapses every leaf to the visitor's active locale.
 *
 * Server-only. Uses Node's `fs.readFile`. Import from Server
 * Components, route handlers, `generateStaticParams`,
 * `generateMetadata`, and `sitemap.ts`. Never from Client Components.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { Locale } from "@/config/i18n.config";
import type { Localized, LocalizedString } from "@/lib/types";

import { DEFAULT_LOCALE, isSupportedLocale } from "@/config/i18n.config";

/** Absolute filesystem path to the flat JSON root. */
const DATA_ROOT = path.join(process.cwd(), "public", "data");

/**
 * In-process cache of collapsed payloads. Next.js reuses the same
 * process across streaming render passes so caching here saves
 * repeated FS + parse + walk cost per page. Keyed by
 * `{locale}:{name}` so two locales don't collide.
 */
const CACHE = new Map<string, unknown>();

/** Foundation-envelope shape (`{ data: ... }`). */
interface Envelope<T> {
  data: T;
}

/**
 * Reads `public/data/{name}.json` and returns the payload collapsed
 * for `locale`. Throws when the file is missing so getters can turn
 * that into `notFound()` for dynamic routes.
 */
export async function readJson<T>(name: string, locale: string): Promise<Localized<T>> {
  const safeLocale = normalizeLocale(locale);
  const cacheKey = `${safeLocale}:${name}`;
  const cached = CACHE.get(cacheKey);

  if (cached !== undefined) {
    return cached as Localized<T>;
  }

  const raw = await fs.readFile(path.join(DATA_ROOT, `${name}.json`), "utf-8");
  const parsed: unknown = JSON.parse(raw);
  const payload = unwrapEnvelope<T>(parsed);
  const localized = localize(payload, safeLocale) as Localized<T>;

  CACHE.set(cacheKey, localized);

  return localized;
}

/** Reads a `Record<slug, T>` fixture and returns values in JSON key order. */
export async function readCollection<T>(
  name: string,
  locale: string,
): Promise<Array<Localized<T>>> {
  const map = await readJson<Record<string, T>>(name, locale);

  return Object.values(map) as Array<Localized<T>>;
}

/** Reads a `Record<slug, T>` fixture and returns the entry for `slug`, or `null`. */
export async function readCollectionEntry<T>(
  name: string,
  slug: string,
  locale: string,
): Promise<Localized<T> | null> {
  const map = await readJson<Record<string, T>>(name, locale);
  const entry = (map as Record<string, unknown>)[slug];

  return (entry as Localized<T> | undefined) ?? null;
}

/** Returns every top-level key from a `Record<slug, T>` fixture. */
export async function readCollectionSlugs(name: string): Promise<string[]> {
  const map = await readJson<Record<string, unknown>>(name, DEFAULT_LOCALE);

  return Object.keys(map);
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function normalizeLocale(value: string): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

function unwrapEnvelope<T>(parsed: unknown): T {
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "data" in (parsed as Record<string, unknown>)
  ) {
    return (parsed as Envelope<T>).data;
  }

  return parsed as T;
}

function isLocalizedLeaf(value: unknown): value is LocalizedString {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.en !== "string") {
    return false;
  }

  for (const [key, val] of Object.entries(record)) {
    if (typeof val !== "string") {
      return false;
    }
    if (key.length < 2 || key.length > 3) {
      return false;
    }
  }

  return true;
}

function localize(value: unknown, locale: Locale): unknown {
  if (isLocalizedLeaf(value)) {
    const record = value as unknown as Record<string, string>;

    return record[locale] ?? record[DEFAULT_LOCALE] ?? "";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => localize(entry, locale));
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      result[key] = localize(val, locale);
    }

    return result;
  }

  return value;
}
