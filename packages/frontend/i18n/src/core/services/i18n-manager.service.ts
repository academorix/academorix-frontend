/**
 * @file i18n-manager.service.ts
 * @module @stackra/i18n/core/services
 * @description Core translation engine. Handles key resolution, interpolation,
 *   pluralization, fallback chains, and namespace management.
 */

import { Injectable, Inject } from '@stackra/container';
import type { II18nLoader, I18nTranslation, TranslateOptions } from '@stackra/contracts';

import { I18N_CONFIG } from '../constants';
import type { II18nConfig } from '../interfaces';
import { interpolate } from '../utils/interpolate.util';
import { getPluralObject, selectPlural } from '../utils/pluralize.util';
import { resolveLanguage, getNextFallbackLanguage } from '../utils/resolve-language.util';
import {
  DEFAULT_KEY_SEPARATOR,
  DEFAULT_NAMESPACE_SEPARATOR,
  DEFAULT_INTERPOLATION_PREFIX,
  DEFAULT_INTERPOLATION_SUFFIX,
} from '../constants';

// ============================================================================
// Service
// ============================================================================

/**
 * Core translation engine.
 *
 * Manages the translation store and provides `t()` / `translate()` methods
 * for resolving translation keys to localized strings.
 */
@Injectable()
export class I18nManager {
  /** All loaded translations keyed by language. */
  private translations: Record<string, I18nTranslation> = {};
  /** List of supported language codes. */
  private supportedLocales: string[] = [];
  /** Configured loader instance. */
  private loader?: II18nLoader;
  /** Module configuration. */
  private readonly config: II18nConfig;
  /** Current locale getter (wired by module). */
  private getCurrentLocale: () => string;

  /**
   * Creates the I18nManager.
   *
   * Initializes the translation engine with the provided configuration.
   * If a loader class is specified in config, it is instantiated here.
   *
   * @param config - I18n module configuration
   */
  public constructor(@Inject(I18N_CONFIG) config: II18nConfig) {
    this.config = config;
    this.supportedLocales = config.supportedLocales ?? [config.defaultLocale];
    this.getCurrentLocale = () => config.defaultLocale;

    // Initialize the loader from config
    if (config.loader) {
      if (typeof config.loader === 'string') {
        // String driver name — resolved lazily when translations are loaded
        // Built-in drivers: 'static', 'http', 'bundled'
        // The actual loader class is resolved by the module or provided via loaderOptions
      } else {
        const LoaderClass = config.loader;
        this.loader = new LoaderClass(config.loaderOptions);
      }
    }
  }

  // ── Configuration Wiring ──────────────────────────────────────────────────

  /**
   * Set the locale getter — wired by `I18nLocaleService.onModuleInit()` so
   * the manager reads the locale via a fresh closure each translate call
   * (never a stale copy). This one-way injection keeps
   * `I18nManager → I18nLocaleService` DI edge single-directional (locale
   * service depends on manager, not the other way around).
   *
   * @param getter - Function that returns the current locale.
   */
  public setLocaleGetter(getter: () => string): void {
    this.getCurrentLocale = getter;
  }

  // ── Translation API ───────────────────────────────────────────────────────

  /**
   * Translate a key to the current (or specified) locale.
   *
   * @param key - Dot-separated translation key path
   * @param options - Translation options
   * @returns The translated string, or fallback
   */
  public translate(key: string, options?: TranslateOptions): string {
    const lang = options?.lang ?? this.getCurrentLocale();

    if (options?.debug || lang === 'debug') return key;

    const resolvedLang = resolveLanguage(lang, this.supportedLocales, this.config.fallbacks);
    const translationsByLang = this.translations[resolvedLang];

    const result = this.resolveKey(key, translationsByLang, resolvedLang, options);

    if (result !== undefined) return result as string;

    // Fallback chain
    if (resolvedLang !== this.config.defaultLocale) {
      const nextFallback = getNextFallbackLanguage(resolvedLang, this.config.defaultLocale);
      if (nextFallback !== lang) {
        return this.translate(key, { ...options, lang: nextFallback });
      }
    }

    // Missing key behavior
    return options?.defaultValue ?? this.handleMissingKey(key);
  }

  /** Shorthand alias for translate(). */
  public t(key: string, options?: TranslateOptions): string {
    return this.translate(key, options);
  }

  // ── Data Management ───────────────────────────────────────────────────────

  /** Get supported language codes. */
  public getSupportedLanguages(): string[] {
    return [...this.supportedLocales];
  }

  /** Get all translations. */
  public getTranslations(): Record<string, I18nTranslation> {
    return this.translations;
  }

  /** Load all translations via the configured loader. */
  public async refresh(): Promise<void> {
    if (!this.loader) return;

    const langs = await this.loader.languages();
    this.supportedLocales = langs;

    const all: Record<string, I18nTranslation> = {};
    for (const locale of langs) {
      all[locale] = await this.loader.load(locale);
    }
    this.translations = all;
  }

  /** Load translations for a single locale. */
  public async loadLocale(locale: string): Promise<void> {
    if (!this.loader) return;
    this.translations[locale] = await this.loader.load(locale);
  }

  /** Set translations directly (for static loader / tests). */
  public setTranslations(translations: Record<string, I18nTranslation>, languages: string[]): void {
    this.translations = translations;
    this.supportedLocales = languages;
  }

  /** Merge namespace-scoped translations. */
  public mergeTranslations(
    namespace: string,
    localeTranslations: Record<string, Record<string, unknown>>
  ): void {
    for (const [locale, trans] of Object.entries(localeTranslations)) {
      if (!this.translations[locale]) this.translations[locale] = {};
      (this.translations[locale] as Record<string, unknown>)[namespace] = trans;
    }
  }

  /** Load translations for a namespace using a separate loader. */
  public async loadNamespace(namespace: string, loader: II18nLoader): Promise<void> {
    const currentLocale = this.getCurrentLocale();
    const translations = await loader.load(currentLocale);
    if (!this.translations[currentLocale]) this.translations[currentLocale] = {};
    (this.translations[currentLocale] as Record<string, unknown>)[namespace] = translations;
  }

  // ── Private: Key Resolution Engine ────────────────────────────────────────

  private resolveKey(
    key: string,
    translations: I18nTranslation | undefined,
    lang: string,
    options?: TranslateOptions
  ): string | undefined {
    if (!translations) return undefined;

    let value: unknown = this.getByPath(translations, key, options);
    if (value === undefined) return undefined;

    // Pluralization
    const args = options?.args;
    const count =
      options?.count ?? (args && !Array.isArray(args) ? (args as any).count : undefined);
    if (count !== undefined) {
      const plural = getPluralObject(value);
      if (plural) {
        const selected = selectPlural(plural, Number(count), lang);
        if (selected !== undefined) value = selected;
      }
    }

    // Object/array returns
    if (typeof value === 'object' && value !== null) {
      const shouldReturn = options?.returnObjects ?? this.config.returnObjects ?? true;
      if (!shouldReturn) return key;
      if (Array.isArray(value)) {
        const join = options?.joinArrays ?? this.config.joinArrays;
        if (typeof join === 'string') return (value as unknown[]).map(String).join(join);
      }
      return JSON.stringify(value);
    }

    // String interpolation
    if (typeof value === 'string' && args) {
      const prefix = this.config.interpolation?.prefix ?? DEFAULT_INTERPOLATION_PREFIX;
      const suffix = this.config.interpolation?.suffix ?? DEFAULT_INTERPOLATION_SUFFIX;
      const argsObj = Array.isArray(args)
        ? Object.assign({}, ...args.filter((a) => typeof a === 'object'))
        : args;
      if (count !== undefined) (argsObj as any).count = count;
      return interpolate(value, argsObj as Record<string, unknown>, prefix, suffix);
    }

    return typeof value === 'string' ? value : String(value);
  }

  private getByPath(
    translations: I18nTranslation,
    key: string,
    options?: TranslateOptions
  ): unknown {
    // Direct match
    if (key in translations) return translations[key];

    // Namespace separator
    const nsSep = options?.nsSeparator ?? this.config.nsSeparator ?? DEFAULT_NAMESPACE_SEPARATOR;
    if (nsSep && key.includes(nsSep as string)) {
      const idx = key.indexOf(nsSep as string);
      const ns = key.slice(0, idx);
      const rest = key.slice(idx + (nsSep as string).length);
      const nsTranslations = translations[ns];
      if (nsTranslations && typeof nsTranslations === 'object') {
        return this.getByPath(nsTranslations as I18nTranslation, rest, {
          ...options,
          nsSeparator: false,
        });
      }
    }

    // Key separator (dot-path traversal)
    const keySep = options?.keySeparator ?? this.config.keySeparator ?? DEFAULT_KEY_SEPARATOR;
    if (!keySep || !key.includes(keySep as string)) return undefined;

    const segments = key.split(keySep as string);
    let current: unknown = translations;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object')
        return undefined;
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private handleMissingKey(key: string): string {
    const behavior = this.config.missingKeyBehavior ?? 'key';
    if (behavior === 'empty') return '';
    if (behavior === 'throw') throw new Error(`[i18n] Missing translation key: "${key}"`);
    return key;
  }
}
