/**
 * @file use-locale.hook.ts
 * @module @stackra/i18n/core/hooks/use-locale
 * @description Lightweight hook for locale state only (no translation function).
 *
 *   Uses `useInject()` from `@stackra/container/react` for proper DI access.
 */

import { useCallback } from "react";
import { useInject } from "@stackra/container/react";
import { I18N_LOCALE_SERVICE } from "@stackra/contracts";

import type { I18nLocaleService } from "../../services/i18n-locale.service";
import type { UseLocaleReturn } from "../../interfaces";

/**
 * Access locale state from a React component (lighter than useI18n).
 *
 * Uses DI injection — requires `I18nModule.forRoot()` or `WebI18nModule.forRoot()`
 * to be registered in the module tree.
 *
 * @returns Locale state and setter
 */
export function useLocale(): UseLocaleReturn {
  const localeService = useInject<I18nLocaleService>(I18N_LOCALE_SERVICE);

  const locale = localeService.getLocale();
  const dir = localeService.getDir();

  const setLocale = useCallback(
    async (newLocale: string) => {
      await localeService.setLocale(newLocale);
    },
    [localeService],
  );

  return {
    locale,
    dir,
    isRTL: dir === "rtl",
    setLocale,
    languages: localeService.getSupportedLocales(),
  };
}
