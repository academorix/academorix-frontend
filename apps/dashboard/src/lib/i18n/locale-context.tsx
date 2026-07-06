/**
 * @file locale-context.tsx
 * @module lib/i18n/locale-context
 *
 * @description
 * Holds the active {@link Locale} for the app and exposes it (plus a setter and
 * the derived Refine {@link I18nProvider}) via context. Responsibilities:
 *
 * - Initialize from the persisted preference (`localStorage`), else `"en"`.
 * - Persist changes so the choice survives reloads.
 * - Keep the document's `lang`/`dir` attributes in sync (drives RTL for Arabic).
 * - Rebuild the `i18nProvider` whenever the locale changes so translations and
 *   `getLocale()` stay correct.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/i18n.types";
import type { I18nProvider } from "@refinedev/core";
import type { ReactNode } from "react";

import { createI18nProvider } from "@/lib/i18n/i18n-provider";
import { isRtlLocale, LOCALES } from "@/lib/i18n/i18n.types";

/** `localStorage` key holding the user's locale preference. */
const STORAGE_KEY = "academorix.locale";

/** The value exposed by {@link LocaleContext}. */
interface LocaleContextValue {
  /** The active locale. */
  locale: Locale;
  /** Switches the active locale (and persists it). */
  setLocale: (locale: Locale) => void;
  /** Refine i18n provider bound to the active locale. */
  i18nProvider: I18nProvider;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Reads and validates the persisted locale, defaulting to `"en"`. */
function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    // Ignore storage access errors (private mode, disabled storage).
  }

  return "en";
}

/** Props for {@link LocaleProvider}. */
interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * Provides locale state, a persisting setter, and the derived i18n provider to
 * the tree. Mount above `<Refine>` so the provider can be passed into it.
 */
export function LocaleProvider({ children }: LocaleProviderProps): ReactNode {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors.
    }
  }, []);

  // Keep the document language + direction in sync (RTL for Arabic).
  useEffect(() => {
    const root = document.documentElement;

    root.lang = locale;
    root.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale]);

  const i18nProvider = useMemo(() => createI18nProvider(locale, setLocale), [locale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, i18nProvider }),
    [locale, setLocale, i18nProvider],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Reads the locale context, throwing if used outside {@link LocaleProvider}. */
function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a <LocaleProvider>.");
  }

  return context;
}

/** Access the active locale and the setter to change it. */
export function useLocale(): Pick<LocaleContextValue, "locale" | "setLocale"> {
  const { locale, setLocale } = useLocaleContext();

  return { locale, setLocale };
}

/** Access the Refine i18n provider bound to the active locale (for `<Refine>`). */
export function useI18nProvider(): I18nProvider {
  return useLocaleContext().i18nProvider;
}
