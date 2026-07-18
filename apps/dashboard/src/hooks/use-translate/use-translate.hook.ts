/**
 * @file use-translate.hook.ts
 * @module @academorix/dashboard/hooks/use-translate
 * @description React binding for {@link LocaleService.translate}.
 *
 *   Returns a translator function bound to the CURRENT locale — the
 *   returned function updates its identity on every locale change so
 *   consumers can safely depend on it in a `useEffect` / `useMemo`.
 */

import { useCallback, useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import { LocaleService } from "@/services/locale";
import { LOCALE_SERVICE } from "@/tokens/locale-service.token";

/**
 * Translator signature — identical to the legacy `useTranslate()` from
 * `providers/locale-provider`.
 *
 * @param key - Dot-keyed message id.
 * @param vars - Optional interpolation values.
 * @param fallback - Optional English default.
 * @returns Translated string (or the key when no match + no fallback).
 */
export type Translator = (
  key: string,
  vars?: Record<string, unknown>,
  fallback?: string,
) => string;

/**
 * Access a translator scoped to the active locale. Re-runs (identity
 * change) when the locale flips so callers memoising on the translator
 * pick up new translations.
 *
 * @example
 * ```tsx
 * const t = useTranslate();
 * <span>{t("app.assistant", undefined, "Assistant")}</span>
 * ```
 */
export function useTranslate(): Translator {
  const service = useInject<LocaleService>(LOCALE_SERVICE);
  // Read the snapshot so React re-renders on a locale flip — that
  // invalidates the memoised `translate` below.
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  // WHY the useCallback keyed on `snapshot.locale`: the service's
  // `translate` binding closes over `#snapshot`, so the same function
  // reference always resolves against the CURRENT locale — the identity
  // never needs to change. But consumers that memoise components on
  // `t` (dashboard route → deep child props) expect the identity to
  // flip on locale change so their memos invalidate. Keying on `locale`
  // provides that invalidation cheaply.
  return useCallback<Translator>(
    (key, vars, fallback) => service.translate(key, vars, fallback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service, snapshot.locale],
  );
}
