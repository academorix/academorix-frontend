/**
 * @file use-consent-banner.hook.ts
 * @module @stackra/consent/react/hooks/use-consent-banner
 * @description React hook for consent banner visibility and actions.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { CONSENT_MANAGER } from "@stackra/contracts";
import type { ConsentManager } from "@/core/services/consent-manager.service";

/** Value returned by {@link useConsentBanner}. */
export interface UseConsentBannerResult {
  /** Whether the banner should be shown (user has not decided yet). */
  readonly isVisible: boolean;
  /** Accept all non-required categories. */
  readonly accept: () => void;
  /** Reject all non-required categories. */
  readonly reject: () => void;
  /**
   * Signal intent to customize preferences. No-op at the hook level — the
   * consumer handles navigation to a preferences UI.
   */
  readonly customize: () => void;
}

/**
 * React hook for consent banner state and actions.
 *
 * Exposes a visibility flag and action callbacks needed to implement a
 * consent banner (web) or bottom sheet (native). Visible until the user
 * makes their first decision.
 *
 * @returns Banner visibility state and action handlers.
 *
 * @example
 * ```tsx
 * function Banner() {
 *   const { isVisible, accept, reject } = useConsentBanner();
 *   if (!isVisible) return null;
 *   return <ConsentBanner />;
 * }
 * ```
 */
export function useConsentBanner(): UseConsentBannerResult {
  const manager = useInject<ConsentManager>(CONSENT_MANAGER);

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.subscribe(onStoreChange),
    [manager],
  );
  const getSnapshot = useCallback(() => manager.getSnapshot(), [manager]);

  // Subscribe to trigger re-renders on preference changes.
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const accept = useCallback(() => manager.grantAll(), [manager]);
  const reject = useCallback(() => manager.revokeAll(), [manager]);
  const customize = useCallback(() => {
    // No-op at hook level — the consumer handles navigation to preferences UI.
  }, []);

  return {
    isVisible: !manager.isDecided(),
    accept,
    reject,
    customize,
  };
}
