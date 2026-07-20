/**
 * @file use-consent.hook.ts
 * @module @stackra/consent/react/hooks
 * @description React hook for reactive consent state management.
 *   Uses `useSyncExternalStore` to subscribe to `ConsentManager` changes.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { CONSENT_MANAGER } from "@stackra/contracts";
import type { ConsentManager } from "@/core/services/consent-manager.service";

/** Value returned by {@link useConsent}. */
export interface UseConsentResult {
  /** Current consent preference map keyed by category slug. */
  readonly preferences: Record<string, boolean>;
  /** Whether consent is granted for a category. */
  readonly hasConsent: (category: string) => boolean;
  /** Grant consent for a single category. */
  readonly grantConsent: (category: string) => void;
  /** Revoke consent for a single category. */
  readonly revokeConsent: (category: string) => void;
  /** Grant all non-required categories. */
  readonly grantAll: () => void;
  /** Revoke all non-required categories. */
  readonly revokeAll: () => void;
  /** Whether the user has made an explicit decision. */
  readonly isDecided: boolean;
  /** Bulk-set consent preferences. */
  readonly setPreferences: (prefs: Record<string, boolean>) => void;
}

/**
 * React hook for reactive consent state management.
 *
 * Subscribes to the `ConsentManager` via `useSyncExternalStore` for
 * efficient re-renders and returns the full consent API surface.
 *
 * @returns Reactive consent state and mutation methods.
 *
 * @example
 * ```tsx
 * function AnalyticsLoader() {
 *   const { hasConsent } = useConsent();
 *   if (hasConsent('analytics')) loadAnalytics();
 *   return null;
 * }
 * ```
 */
export function useConsent(): UseConsentResult {
  const manager = useInject<ConsentManager>(CONSENT_MANAGER);

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.subscribe(onStoreChange),
    [manager],
  );
  const getSnapshot = useCallback(() => manager.getSnapshot(), [manager]);

  const preferences = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const hasConsent = useCallback((category: string) => manager.hasConsent(category), [manager]);
  const grantConsent = useCallback((category: string) => manager.grantConsent(category), [manager]);
  const revokeConsent = useCallback(
    (category: string) => manager.revokeConsent(category),
    [manager],
  );
  const grantAll = useCallback(() => manager.grantAll(), [manager]);
  const revokeAll = useCallback(() => manager.revokeAll(), [manager]);
  const setPreferences = useCallback(
    (prefs: Record<string, boolean>) => manager.setPreferences(prefs),
    [manager],
  );

  return {
    preferences,
    hasConsent,
    grantConsent,
    revokeConsent,
    grantAll,
    revokeAll,
    isDecided: manager.isDecided(),
    setPreferences,
  };
}
