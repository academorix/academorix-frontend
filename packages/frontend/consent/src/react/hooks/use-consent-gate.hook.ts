/**
 * @file use-consent-gate.hook.ts
 * @module @stackra/consent/react/hooks
 * @description React hook for gating features behind consent.
 *   Returns whether a category is allowed and whether consent is pending.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';

import { CONSENT_MANAGER } from '@stackra/contracts';
import type { ConsentManager } from '@/core/services/consent-manager.service';

/** Value returned by {@link useConsentGate}. */
export interface UseConsentGateResult {
  /** Whether the gated category is currently granted. */
  readonly allowed: boolean;
  /** Whether the user has not yet made an explicit decision. */
  readonly pending: boolean;
}

/**
 * React hook for gating features behind a specific consent category.
 *
 * The `pending` flag indicates the user has not yet interacted with the
 * consent UI — useful for showing placeholder states.
 *
 * @param category - Category slug to check consent for.
 * @returns `allowed` and `pending` flags.
 *
 * @example
 * ```tsx
 * function TrackingPixel() {
 *   const { allowed, pending } = useConsentGate('marketing');
 *   if (pending) return <ConsentPlaceholder />;
 *   if (!allowed) return null;
 *   return <Pixel />;
 * }
 * ```
 */
export function useConsentGate(category: string): UseConsentGateResult {
  const manager = useInject<ConsentManager>(CONSENT_MANAGER);

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.subscribe(onStoreChange),
    [manager]
  );
  const getSnapshot = useCallback(() => manager.getSnapshot(), [manager]);

  // Subscribe to trigger re-renders on preference changes.
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    allowed: manager.hasConsent(category),
    pending: !manager.isDecided(),
  };
}
