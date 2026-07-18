/**
 * @file use-i18n-provider.hook.ts
 * @module @academorix/dashboard/hooks/use-i18n-provider
 * @description React binding that returns the Refine `I18nProvider`
 *   bound to the current locale — consumed by `<Refine i18nProvider={…} />`.
 *
 *   The provider's identity flips on every locale change so `<Refine>`
 *   re-registers its own hooks with the new provider.
 */

import { useMemo, useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import type { I18nProvider } from "@refinedev/core";

import { LocaleService } from "@/services/locale";
import { LOCALE_SERVICE } from "@/tokens/locale-service.token";

/**
 * Read the Refine `I18nProvider` scoped to the current locale. Memoised
 * on the locale so the returned provider is stable across renders that
 * don't change the locale.
 *
 * @example
 * ```tsx
 * function RefineRoot() {
 *   const i18nProvider = useI18nProvider();
 *   return <Refine i18nProvider={i18nProvider}>…</Refine>;
 * }
 * ```
 */
export function useI18nProvider(): I18nProvider {
  const service = useInject<LocaleService>(LOCALE_SERVICE);
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  // WHY memoise on locale: the factory builds a fresh Refine provider
  // object each call. If we returned a new one every render, Refine's
  // own internal memoisation would invalidate on every parent re-render
  // — expensive. Keying on `locale` gives it a stable identity across
  // renders that leave the locale unchanged.
  return useMemo(
    () => service.createI18nProvider(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service, snapshot.locale],
  );
}
