/**
 * @file use-i18n.hook.ts
 * @module @stackra/i18n/react/hooks
 * @description Primary hook for accessing i18n in React components.
 *   Provides the `t()` function, locale state, direction, and switching.
 *
 *   Uses `useInject()` from `@stackra/container/react` to access the
 *   I18nManager and I18nLocaleService via proper DI tokens.
 */

import { useCallback } from "react";
import { useInject } from "@stackra/container/react";
import { I18N_MANAGER, I18N_LOCALE_SERVICE, type TranslateOptions } from "@stackra/contracts";

import type { I18nManager } from "../services/i18n-manager.service";
import type { I18nLocaleService } from "../services/i18n-locale.service";
import type { UseI18nReturn } from "../interfaces";

/**
 * Access the i18n system from a React component.
 *
 * Uses DI injection via `useInject()` — requires `I18nModule.forRoot()` or
 * `WebI18nModule.forRoot()` to be registered in the module tree.
 *
 * @typeParam K - Generated translations type for autocomplete
 * @returns i18n state and functions
 *
 * @example
 * ```typescript
 * const { t, locale, setLocale, dir } = useI18n();
 * return <h1 dir={dir}>{t("common.hello")}</h1>;
 * ```
 */
export function useI18n<K = Record<string, unknown>>(): UseI18nReturn<K> {
  const manager = useInject<I18nManager>(I18N_MANAGER);
  const localeService = useInject<I18nLocaleService>(I18N_LOCALE_SERVICE);

  const locale = localeService.getLocale();
  const dir = localeService.getDir();

  const setLocale = useCallback(
    async (newLocale: string) => {
      await localeService.setLocale(newLocale);
    },
    [localeService],
  );

  const t = useCallback(
    (key: string, options?: TranslateOptions) => {
      return manager.t(key, { ...options, lang: locale });
    },
    [manager, locale],
  );

  return {
    locale,
    dir,
    isRTL: dir === "rtl",
    languages: localeService.getSupportedLocales(),
    setLocale,
    isLoading: false,
    t: t as UseI18nReturn<K>["t"],
  };
}
