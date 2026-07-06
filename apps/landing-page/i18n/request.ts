/**
 * @file request.ts
 * @module i18n/request
 *
 * @description
 * Server-side `next-intl` request loader. Runs once per request on the
 * server (edge or Node), reads the resolved locale from the URL segment,
 * validates it against `routing.locales`, then loads the corresponding
 * message catalogue from `messages/{locale}.json`.
 *
 * ## What it does
 *
 *   1. Reads `requestLocale` (set by the middleware from the URL segment).
 *   2. Falls back to `routing.defaultLocale` if absent or invalid.
 *   3. Dynamically imports the message file — Next bundles each locale
 *      as its own chunk so we don't ship Arabic strings to English users.
 *   4. Returns the `locale` + `messages` object that `NextIntlClientProvider`
 *      and every server-side `getTranslations()` call consume.
 *
 * ## Why dynamic imports
 *
 * Static imports would fan every locale into every route bundle. Dynamic
 * imports keep bundles per-locale, which matters as message catalogues
 * grow past 20-30 kB.
 */

import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { routing } from "@/i18n/routing";

/**
 * `next-intl` request configuration. Registered in `next.config.mjs` via
 * `createNextIntlPlugin("./i18n/request.ts")`.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is a Promise in v4 — always await, never trust the raw value.
  const resolved = await requestLocale;

  const locale: Locale = (routing.locales as readonly string[]).includes(resolved ?? "")
    ? (resolved as Locale)
    : (routing.defaultLocale as Locale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
