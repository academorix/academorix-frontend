/**
 * @file use-utm-params.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description UTM parameter hook.
 *
 *   Reads `utm_source|medium|campaign|term|content` on first mount
 *   and caches the result to `sessionStorage` so a SPA navigation
 *   past the initial URL still surfaces the same attribution.
 */

import { useMemo, useEffect } from 'react';

import { parseUtmParams } from '@/core/utils';
import type { IPwaUtmParams } from '@/core/interfaces';

/** Storage key holding the cached UTM params. */
const STORAGE_KEY = 'stackra:pwa:utm';

/**
 * Read the current UTM parameters, cached to `sessionStorage`.
 *
 * The value is computed once on first render and never changes for
 * the lifetime of the hook — UTM attribution is "first navigation
 * sticky" by design.
 *
 * @example
 * ```tsx
 * import { useUtmParams } from '@stackra/pwa/react';
 *
 * function AttributionDebug() {
 *   const utm = useUtmParams();
 *   return <pre>{JSON.stringify(utm, null, 2)}</pre>;
 * }
 * ```
 */
export function useUtmParams(): IPwaUtmParams {
  // `useMemo` with an empty dep array — the parsed result is stable
  // across re-renders. SSR-safe: `parseUtmParams` returns `{}` when
  // `window` is absent.
  const utm = useMemo<IPwaUtmParams>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = window.sessionStorage?.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached) as IPwaUtmParams;
    } catch {
      // fail-soft — corrupt storage falls back to parsing the URL.
    }
    return parseUtmParams();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Object.keys(utm).length === 0) return;
    try {
      // Persist once so future SPA navigations reuse the attribution.
      window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // fail-soft — private mode / quota exceeded.
    }
  }, [utm]);

  return utm;
}
