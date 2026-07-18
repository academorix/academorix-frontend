import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { dictionaries, locales, localeMeta } from "./dictionaries";
import type { Locale } from "./dictionaries";

const STORAGE_KEY = "academorix-locale";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored && locales.includes(stored as Locale)) return stored as Locale;

  const nav = window.navigator.language?.slice(0, 2);

  return nav === "ar" ? "ar" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const dir = localeMeta[locale].dir;

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("lang", locale);
    root.setAttribute("dir", dir);
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const table = dictionaries[locale] ?? dictionaries.en;
      let value = table[key] ?? dictionaries.en[key] ?? key;

      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.split("{" + name + "}").join(replacement);
        }
      }

      return value;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, setLocale, t }),
    [locale, dir, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);

  if (!ctx) throw new Error("useI18n must be used within a LocaleProvider");

  return ctx;
}

export { locales, localeMeta };
export type { Locale };
