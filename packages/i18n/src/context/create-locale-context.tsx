/**
 * @file create-locale-context.tsx
 * @module @academorix/i18n/context/create-locale-context
 *
 * @description
 * Factory that returns a typed `{ LocaleProvider, useLocale,
 * isSupportedLocale, isRtlLocale, resolveLocale }` bundle bound to
 * an app's concrete locale union.
 *
 * Why a factory over a package-level context? React's context object
 * carries a `defaultValue`; a shared context would need every app
 * to agree on the same default locale (and the same type). The
 * factory gives each app its own strongly-typed instance while
 * reusing the same runtime behaviour.
 *
 * ## What each returned member does
 *
 *  - `LocaleProvider` — React provider. On mount, reads the persisted
 *    preference from `localStorage`; keeps `<html lang>` + `<html dir>`
 *    in sync; persists changes.
 *
 *  - `useLocale` — hook that returns `{ locale, setLocale }`. Throws
 *    when used outside the provider (developer-error signal).
 *
 *  - `isSupportedLocale` — narrowing predicate. Returns true when the
 *    argument is one of the configured locales.
 *
 *  - `resolveLocale` — safe coercion. Returns the argument if
 *    supported, else the configured default.
 *
 *  - `isRtlLocale` — reads `rtlLocales` from the bound config.
 *
 * @example
 * ```tsx
 * // apps/dashboard/src/lib/i18n/locale-context.tsx
 * import { createLocaleContext } from "@academorix/i18n/context";
 * import { i18nConfig, type Locale } from "@/config/i18n.config";
 *
 * export const {
 *   LocaleProvider,
 *   useLocale,
 *   isSupportedLocale,
 *   isRtlLocale,
 *   resolveLocale,
 * } = createLocaleContext<Locale>(i18nConfig);
 * ```
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { I18nConfig } from "../config/i18n-config.type";
import type { ReactNode } from "react";

/**
 * The value the provider makes available through context.
 *
 * @typeParam TLocale - The app's supported-locale union.
 */
export interface LocaleContextValue<TLocale extends string> {
  /** The active locale. */
  readonly locale: TLocale;
  /** Switches the active locale (and persists it). */
  readonly setLocale: (locale: TLocale) => void;
}

/** Props for a locale-bound `LocaleProvider`. */
export interface LocaleProviderProps<TLocale extends string> {
  readonly children: ReactNode;
  /**
   * Optional override for the initial locale — bypasses the
   * `localStorage` lookup. Useful in tests and for SSR where the
   * server may inject a locale from an `Accept-Language` header.
   */
  readonly initialLocale?: TLocale;
}

/**
 * The bundle returned by {@link createLocaleContext}. Each app
 * instantiates one at boot.
 */
export interface LocaleContextBundle<TLocale extends string> {
  /** Wrap the app tree; must be above every consumer. */
  readonly LocaleProvider: (props: LocaleProviderProps<TLocale>) => ReactNode;
  /** Read the active locale + setter from context. */
  readonly useLocale: () => LocaleContextValue<TLocale>;
  /** Narrowing predicate — `value is TLocale`. */
  readonly isSupportedLocale: (value: string) => value is TLocale;
  /** True when the locale should render right-to-left. */
  readonly isRtlLocale: (locale: string) => boolean;
  /** Returns the input if supported, else the configured default. */
  readonly resolveLocale: (value: string | null | undefined) => TLocale;
  /** The bound config (useful for tests + downstream tooling). */
  readonly config: Readonly<I18nConfig<TLocale>>;
}

/**
 * Creates a locale-bound provider + hooks pair.
 *
 * The returned {@link LocaleProviderProps.LocaleProvider} handles:
 *   - initial state resolution (localStorage → default),
 *   - persistence on change,
 *   - `<html lang>` + `<html dir>` sync (RTL for Arabic, LTR otherwise),
 *   - memoized context value so downstream renders are stable.
 *
 * @typeParam TLocale - Inferred from `config.locales`.
 * @param config - The app's i18n config (usually via `defineI18nConfig`).
 * @returns The bound provider, hooks, and predicates.
 */
export function createLocaleContext<TLocale extends string>(
  config: I18nConfig<TLocale>,
): LocaleContextBundle<TLocale> {
  const LocaleContext = createContext<LocaleContextValue<TLocale> | null>(null);

  LocaleContext.displayName = "LocaleContext";

  function isSupportedLocale(value: string): value is TLocale {
    return (config.locales as readonly string[]).includes(value);
  }

  function isRtlLocale(locale: string): boolean {
    return (config.rtlLocales as readonly string[]).includes(locale);
  }

  function resolveLocale(value: string | null | undefined): TLocale {
    if (value && isSupportedLocale(value)) {
      return value;
    }

    return config.defaultLocale;
  }

  /**
   * Reads the persisted preference. Tolerates disabled / cross-origin-
   * blocked storage (private browsing, iframe without `allow-same-origin`,
   * corporate policy) by silently falling back to the default.
   */
  function readStoredLocale(): TLocale {
    if (typeof window === "undefined") {
      return config.defaultLocale;
    }

    try {
      const stored = window.localStorage.getItem(config.storageKey);

      if (stored && isSupportedLocale(stored)) {
        return stored;
      }
    } catch {
      // Ignore storage-access errors.
    }

    return config.defaultLocale;
  }

  function LocaleProvider({ children, initialLocale }: LocaleProviderProps<TLocale>): ReactNode {
    const [locale, setLocaleState] = useState<TLocale>(() => initialLocale ?? readStoredLocale());

    const setLocale = useCallback((next: TLocale) => {
      setLocaleState(next);

      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(config.storageKey, next);
      } catch {
        // Ignore storage-write errors.
      }
    }, []);

    // Keep the document language + direction in sync.
    useEffect(() => {
      if (typeof document === "undefined") {
        return;
      }

      const root = document.documentElement;

      root.lang = locale;
      root.dir = isRtlLocale(locale) ? "rtl" : "ltr";
    }, [locale]);

    const value = useMemo<LocaleContextValue<TLocale>>(
      () => ({ locale, setLocale }),
      [locale, setLocale],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
  }

  function useLocale(): LocaleContextValue<TLocale> {
    const value = useContext(LocaleContext);

    if (!value) {
      throw new Error(
        "useLocale must be used within a <LocaleProvider>. " +
          "Make sure the provider is mounted above the component tree.",
      );
    }

    return value;
  }

  return {
    LocaleProvider,
    useLocale,
    isSupportedLocale,
    isRtlLocale,
    resolveLocale,
    config,
  };
}
