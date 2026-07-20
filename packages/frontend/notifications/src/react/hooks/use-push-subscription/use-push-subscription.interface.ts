/**
 * @file use-push-subscription.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape + input shape for the
 *   {@link usePushSubscription} hook.
 */

import type { IPushSubscriptionResult } from "@/core/interfaces";

/**
 * Options accepted by {@link usePushSubscription}.
 *
 * `vapidPublicKey` overrides the key configured at module init —
 * useful when the app fetches the VAPID key from a config endpoint
 * at runtime rather than at build time. Passed straight through to
 * the platform adapter (web-only — the native adapter ignores it).
 */
export interface IUsePushSubscriptionOptions {
  /** Per-call VAPID public key override (web only). */
  readonly vapidPublicKey?: string;
}

/**
 * Value returned by {@link usePushSubscription}.
 */
export interface IUsePushSubscriptionResult {
  /** Current subscription envelope (or `null` when none). */
  readonly subscription: IPushSubscriptionResult | null;
  /** Whether the platform's push APIs are available. */
  readonly isSupported: boolean;
  /** Whether a subscribe / unsubscribe is in flight. */
  readonly isPending: boolean;
  /** Error surfaced from the last operation, if any. */
  readonly error: Error | null;
  /** Subscribe (or return the existing subscription). */
  readonly subscribe: () => Promise<IPushSubscriptionResult | null>;
  /** Unsubscribe. Returns `true` when the subscription was cancelled. */
  readonly unsubscribe: () => Promise<boolean>;
  /** Force-refresh the subscription snapshot. */
  readonly refresh: () => Promise<void>;
}
