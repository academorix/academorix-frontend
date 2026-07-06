/**
 * @file i18n.config.ts
 * @module config/i18n.config
 *
 * @description
 * Single source of truth for every locale-related constant in the dashboard
 * SPA. Consumed by:
 *
 *  - `src/lib/i18n/locale-context.tsx` — persists the active locale in
 *    localStorage under {@link LOCALE_STORAGE_KEY}.
 *  - `src/lib/i18n/i18n-provider.ts` — feeds the Refine i18n provider.
 *  - `src/components/i18n/language-switcher.tsx` — renders LOCALES /
 *    LOCALE_LABELS in the dropdown.
 *  - `src/config/pwa.config.ts` — pulls Arabic translations into the Web
 *    App Manifest `translations` field so the installed PWA displays in the
 *    user's language after install (subject to browser support).
 *  - `vite.config.ts` — indirectly, via `pwa.config.ts`.
 *  - Playwright a11y suites — assert `<html dir>` flips per locale.
 *
 * ## Adding a locale
 *
 *  1. Append the ISO code to {@link LOCALES}.
 *  2. Add the native-script label to {@link LOCALE_LABELS}.
 *  3. If the script is right-to-left, add it to {@link RTL_LOCALES}.
 *  4. Ship the message catalog: `src/lib/i18n/messages/{code}.ts`.
 *  5. If the locale should show a translated PWA name, add an entry to
 *     {@link PWA_MANIFEST_TRANSLATIONS}.
 *
 * ## Design notes
 *
 *  - Constants are exported individually so tree-shaking works, plus one
 *    aggregate {@link i18nConfig} object for consumers that prefer a
 *    single import.
 *  - Predicates return type-narrowed booleans (`value is Locale`) so
 *    they double as compile-time guards.
 *  - This file DOES NOT import from React or any runtime dependency —
 *    it must be safely consumable from `vite.config.ts` at build time.
 */

// ---------------------------------------------------------------------------
// Locale registry
// ---------------------------------------------------------------------------

/**
 * Every locale the dashboard supports. Order defines the language-switcher
 * display order — `en` is intentionally first because it doubles as the
 * fallback for missing translations.
 */
export const LOCALES = ["en", "ar"] as const;

/**
 * Union type of the supported locale codes. Preferred over `string` so
 * unrelated locale codes fail at compile time.
 */
export type Locale = (typeof LOCALES)[number];

/**
 * The default locale — used when no persisted preference exists and as the
 * fallback catalog when a translation key is missing in another locale.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Locales that should render right-to-left. Drives `<html dir="rtl">`,
 * HeroUI Popover anchor flips, and the sidebar mirror at the layout level.
 */
export const RTL_LOCALES: readonly Locale[] = ["ar"] as const;

/**
 * Human-readable label per locale — always in that locale's own script so
 * the language switcher reads correctly regardless of the active UI
 * language.
 */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ar: "العربية",
};

/**
 * BCP-47 tag per locale — used by `Intl.*` formatters (date, number,
 * relative time) and by `<html lang>`.
 *
 * We deliberately keep this map even when the tags happen to match the
 * short code (e.g. `en` → `en-US`) so a future move to `en-GB` or
 * `ar-EG` is a one-line change instead of a codebase-wide search.
 */
export const LOCALE_BCP47_TAGS: Readonly<Record<Locale, string>> = {
  en: "en-US",
  ar: "ar-EG",
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * `localStorage` key that holds the user's locale preference. Kept as a
 * config export (not a magic string inside `locale-context.tsx`) so
 * server-side auth handlers, Playwright fixtures, and analytics can all
 * agree on the shape.
 */
export const LOCALE_STORAGE_KEY = "academorix.locale";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** IANA timezone used as a fallback when the user hasn't set a preference. */
export const DEFAULT_TIME_ZONE = "UTC";

/**
 * ISO 4217 currency code per locale. We default all locales to `USD` — the
 * currency the plan catalog is priced in — but the Settings > Locale page
 * lets tenants override.
 */
export const CURRENCY_BY_LOCALE: Readonly<Record<Locale, string>> = {
  en: "USD",
  ar: "USD",
};

// ---------------------------------------------------------------------------
// PWA manifest translations
// ---------------------------------------------------------------------------

/**
 * Per-locale strings that surface on the OS-level "installed app" chrome:
 * launcher tile name, splash screen title, home-screen icon label,
 * shortcut names, etc.
 *
 * Consumed by `src/config/pwa.config.ts` when it assembles the Web App
 * Manifest. The manifest's `translations` field (W3C draft; Chromium
 * 100+, Edge 100+, Samsung Internet 16+, Opera 86+, and Android in
 * general) picks up these values automatically. Browsers that don't
 * support `translations` fall back to the primary `name`/`short_name`
 * (English) — degrades gracefully.
 *
 * NOTE: This is separate from the general in-app message catalogs
 * (`messages/{locale}.ts`) because manifest strings are static + short
 * + build-time only. Keeping them here means the manifest generator can
 * run at build time without importing the runtime i18n machinery.
 */
export interface PwaManifestTranslation {
  /** Full product name shown on install prompt + splash screen. */
  name: string;
  /** Short home-screen label (target ≤ 12 chars per platform HIG). */
  shortName: string;
  /** One-line pitch shown in some install prompts. */
  description: string;
  /** Localised shortcut labels keyed by the shortcut's stable id. */
  shortcuts?: Readonly<Record<string, { name: string; shortName: string; description: string }>>;
}

/**
 * Manifest translation table. English is the primary language and lives
 * inline in `pwa.config.ts`; every OTHER locale appears here so the
 * manifest generator can inject a `translations["ar"]` block.
 */
export const PWA_MANIFEST_TRANSLATIONS: Readonly<Partial<Record<Locale, PwaManifestTranslation>>> =
  {
    ar: {
      name: "أكاديمُريكس — عمليات الأكاديميات",
      shortName: "أكاديمُريكس",
      description:
        "أكاديمُريكس — نظام تشغيل الأكاديميات الحديثة. أدر اللاعبين، الفرق، الجلسات، المباريات، المدفوعات، وحماية الأطفال من مكان واحد.",
      shortcuts: {
        // Ids must match `pwa.config.ts` → `manifest.shortcuts[].id`
        // (or fall back to the shortcut's `url` when no id is set).
        dashboard: {
          name: "لوحة التحكم",
          shortName: "الرئيسية",
          description: "نظرة عامة على النشاط ومؤشرات الأداء الرئيسية",
        },
        athletes: {
          name: "اللاعبون",
          shortName: "اللاعبون",
          description: "قائمة اللاعبين والتسجيلات وحماية الأطفال",
        },
        sessions: {
          name: "الجلسات",
          shortName: "الجلسات",
          description: "جلسات التدريب والحضور",
        },
        command: {
          name: "لوحة الأوامر",
          shortName: "بحث",
          description: "الانتقال إلى أي مكان عبر ⌘K",
        },
      },
    },
  };

// ---------------------------------------------------------------------------
// Predicates + helpers
// ---------------------------------------------------------------------------

/** True when the locale renders right-to-left. */
export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/**
 * Narrowing predicate — returns true when the string is a supported
 * locale. Use before casting arbitrary input to {@link Locale}.
 */
export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve any raw string to a safe {@link Locale}. Returns the matching
 * locale if supported, else {@link DEFAULT_LOCALE}. Useful when reading
 * from `localStorage`, URLs, or `Accept-Language` headers where the
 * input could be anything.
 */
export function resolveLocale(value: string | null | undefined): Locale {
  if (value && isSupportedLocale(value)) {
    return value;
  }

  return DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Aggregate handle
// ---------------------------------------------------------------------------

/**
 * Bundled i18n config for consumers that prefer one import over many.
 * Prefer the named exports at call sites for tree-shaking; this shape
 * exists for readability in tests and one-off scripts.
 */
export const i18nConfig = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  rtlLocales: RTL_LOCALES,
  labels: LOCALE_LABELS,
  bcp47: LOCALE_BCP47_TAGS,
  storageKey: LOCALE_STORAGE_KEY,
  timeZone: DEFAULT_TIME_ZONE,
  currencyByLocale: CURRENCY_BY_LOCALE,
  pwaTranslations: PWA_MANIFEST_TRANSLATIONS,
} as const;
