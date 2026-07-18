/**
 * @file locale-provider.tsx
 * @module providers/locale-provider
 *
 * @description
 * Owns the active locale, persists it, syncs `<html lang>` + `<html dir>`,
 * and derives a Refine `I18nProvider` bound to the active locale. Consumers
 * read `useLocale()` for the value + setter or `useI18nProvider()` when
 * wiring `<Refine i18nProvider={…} />`.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { I18nProvider } from "@refinedev/core";
import type { ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  isRtlLocale,
  isSupportedLocale,
  LOCALE_BCP47,
  LOCALE_STORAGE_KEY,
} from "@/i18n/config";
import { CATALOGS } from "@/i18n/dictionaries";
import { createI18nProvider, translateMessage } from "@/i18n/i18n-provider";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, unknown>, fallback?: string) => string;
  i18nProvider: I18nProvider;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStored(): Locale {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (raw && isSupportedLocale(raw)) return raw;
  } catch {
    // ignore
  }

  const nav = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : undefined;

  return nav && isSupportedLocale(nav) ? nav : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStored);

  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("lang", LOCALE_BCP47[locale]);
    root.setAttribute("dir", dir);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const t = useCallback(
    (key: string, vars?: Record<string, unknown>, fallback?: string) =>
      translateMessage(CATALOGS, locale, key, vars, fallback),
    [locale],
  );

  const i18nProvider = useMemo(
    () => createI18nProvider(CATALOGS, locale, setLocale),
    [locale, setLocale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, dir, t, i18nProvider }),
    [locale, setLocale, dir, t, i18nProvider],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the locale + setter. */
export function useLocale(): Pick<LocaleContextValue, "locale" | "setLocale" | "dir"> {
  const ctx = useContext(LocaleContext);

  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>.");

  return { locale: ctx.locale, setLocale: ctx.setLocale, dir: ctx.dir };
}

/** The scoped translator — for consumers that need to translate outside Refine hooks. */
export function useTranslate(): LocaleContextValue["t"] {
  const ctx = useContext(LocaleContext);

  if (!ctx) throw new Error("useTranslate must be used inside <LocaleProvider>.");

  return ctx.t;
}

/** The Refine i18n provider — pass into `<Refine i18nProvider={…} />`. */
export function useI18nProvider(): I18nProvider {
  const ctx = useContext(LocaleContext);

  if (!ctx) throw new Error("useI18nProvider must be used inside <LocaleProvider>.");

  return ctx.i18nProvider;
}
