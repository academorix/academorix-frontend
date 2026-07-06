/**
 * @file locale.util.ts
 * @module @academorix/http/device/locale.util
 *
 * @description
 * Default locale reader — reads `<html lang>` and falls back to
 * `navigator.language`. Kept as its own file so apps that want a
 * different source (e.g. tapped from a React hook via a closure) can
 * swap it out via `createDeviceHeadersReader({ readLocale })`.
 */

/**
 * The current UI locale, read from the `<html lang>` attribute (kept
 * in sync by `LocaleProvider`). Falls back to `navigator.language`
 * and then `"en"`.
 */
export function getDeviceLocale(): string {
  if (typeof document !== "undefined" && document.documentElement.lang) {
    return document.documentElement.lang;
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return "en";
}
