/**
 * @file use-locale.hook.ts
 * @module @academorix/dashboard/hooks/use-locale
 * @description React binding for {@link LocaleService} — active locale +
 *   direction + setter.
 *
 *   Mirrors the shape the legacy `<LocaleProvider>` exposed as
 *   `useLocale()`. Every existing call site migrates by swapping the
 *   import path.
 */

import { useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import type { Locale } from "@/i18n/config";

import { LocaleService } from "@/services/locale";
import { LOCALE_SERVICE } from "@/tokens/locale-service.token";

/** Result of {@link useLocale}. Mirrors the legacy context slice. */
export interface UseLocaleResult {
  /** Active locale. */
  locale: Locale;
  /** Text direction. */
  dir: "ltr" | "rtl";
  /** Update the active locale. */
  setLocale: (locale: Locale) => void;
}

/**
 * Reads the active locale + a setter. `useSyncExternalStore` snaps
 * subscribers to the service's reactive store so a language switch
 * re-renders the whole tree in one commit.
 *
 * @example
 * ```tsx
 * function LanguageSwitcher() {
 *   const { locale, setLocale } = useLocale();
 *   return <Select value={locale} onChange={setLocale}>…</Select>;
 * }
 * ```
 */
export function useLocale(): UseLocaleResult {
  const service = useInject<LocaleService>(LOCALE_SERVICE);
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  return {
    locale: snapshot.locale,
    dir: snapshot.dir,
    setLocale: service.setLocale,
  };
}
