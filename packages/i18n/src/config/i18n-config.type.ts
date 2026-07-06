/**
 * @file i18n-config.type.ts
 * @module @academorix/i18n/config/i18n-config.type
 *
 * @description
 * Shape of the workspace's i18n config surface. Every app declares its
 * concrete locale tuple + labels + storage key by satisfying this
 * interface (usually via {@link defineI18nConfig}).
 *
 * The generic parameter `TLocale` is the app's supported-locale union.
 * Downstream types (Provider, hook, predicates) narrow to it so the
 * app's call sites can't accidentally set an unsupported locale.
 */

/**
 * The i18n contract an app configures at boot.
 *
 * Not created directly — apps declare a `LOCALES` `readonly` tuple and
 * pass it through {@link defineI18nConfig} to preserve literal types.
 */
export interface I18nConfig<TLocale extends string> {
  /** The complete set of supported locale codes. Order = UI display order. */
  readonly locales: readonly TLocale[];

  /** The default locale — persisted preference falls back here. */
  readonly defaultLocale: TLocale;

  /**
   * Locales that render right-to-left. Drives `<html dir="rtl">` and
   * component-level flips (Popover anchor, sidebar mirror, etc.).
   */
  readonly rtlLocales: readonly TLocale[];

  /**
   * Human-readable label per locale — always in that locale's own
   * script so the language switcher reads correctly regardless of
   * the active UI language.
   */
  readonly labels: Readonly<Record<TLocale, string>>;

  /**
   * BCP-47 tag per locale — used by `Intl.*` formatters (date, number,
   * relative time) and by `<html lang>`.
   *
   * Keep this map even when tags happen to match the short code
   * (e.g. `en` → `en-US`) so a future move to `en-GB` / `ar-EG` is a
   * one-line change instead of a codebase-wide search.
   */
  readonly bcp47: Readonly<Record<TLocale, string>>;

  /**
   * `localStorage` / cookie key that holds the user's locale
   * preference. Kept as config (not a magic string in the provider)
   * so server-side auth handlers, tests, and analytics can all agree.
   */
  readonly storageKey: string;

  /**
   * IANA timezone used as fallback when the user hasn't set a
   * preference. Optional — Intl formatters default to the user's
   * system timezone when omitted.
   */
  readonly timeZone?: string;

  /**
   * ISO 4217 currency code per locale. Optional — apps that don't
   * format money can omit this.
   */
  readonly currencyByLocale?: Readonly<Record<TLocale, string>>;
}
