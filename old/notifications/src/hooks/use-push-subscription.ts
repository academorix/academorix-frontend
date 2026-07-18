/**
 * @file use-push-subscription.ts
 * @module @academorix/notifications/hooks/use-push-subscription
 *
 * @description
 * `usePushSubscription()` — React hook that manages the Web Push
 * lifecycle for a service-worker registration. Exposes:
 *
 *  - `isSupported` — quick capability check.
 *  - `permission` — current `Notification.permission` value.
 *  - `subscription` — the live `PushSubscription`, or `null`.
 *  - `subscribe()` — prompt the user + create a new subscription.
 *  - `unsubscribe()` — tear down the current subscription.
 *  - `isLoading` — while `subscribe` / `unsubscribe` is in flight.
 *  - `error` — the last thrown error from a lifecycle call.
 *
 * The hook is intentionally UN-opinionated about server sync — the
 * caller runs the `POST /notifications/subscriptions` /
 * `DELETE /notifications/subscriptions/{id}` calls itself with the
 * `serializePushSubscription()` output.
 *
 * ## Compliance
 *
 * NEVER call `subscribe()` outside a user gesture. Chrome blocks
 * the permission prompt when it fires from an effect / timer;
 * doing so unnecessarily can permanently disable the prompt.
 *
 * @example
 * ```tsx
 * import {
 *   serializePushSubscription,
 *   usePushSubscription,
 * } from "@academorix/notifications";
 *
 * function NotificationSettings({ registration }: { registration: ServiceWorkerRegistration }) {
 *   const { subscription, subscribe, unsubscribe } = usePushSubscription({
 *     registration,
 *     vapidPublicKey: envConfig.pushVapidPublicKey,
 *   });
 *
 *   return subscription ? (
 *     <button onClick={unsubscribe}>Disable</button>
 *   ) : (
 *     <button onClick={async () => {
 *       const fresh = await subscribe();
 *       if (fresh) await api.post("/notifications/subscriptions", serializePushSubscription(fresh));
 *     }}>Enable notifications</button>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useState } from "react";

import {
  getExistingPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../push/push-subscription.util";

/** Options for {@link usePushSubscription}. */
export interface UsePushSubscriptionOptions {
  /** The active service-worker registration. */
  readonly registration: ServiceWorkerRegistration | null;
  /** Base64-url VAPID public key from the backend. */
  readonly vapidPublicKey: string;
}

/** Return value of {@link usePushSubscription}. */
export interface UsePushSubscriptionResult {
  readonly isSupported: boolean;
  readonly permission: NotificationPermission | null;
  readonly subscription: PushSubscription | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
  /** Resolves with the fresh subscription on success, `null` on denial. */
  readonly subscribe: () => Promise<PushSubscription | null>;
  /** Resolves with `true` when a subscription was torn down. */
  readonly unsubscribe: () => Promise<boolean>;
}

/**
 * Manages the Web Push subscription lifecycle for a service-worker
 * registration.
 */
export function usePushSubscription(
  options: UsePushSubscriptionOptions,
): UsePushSubscriptionResult {
  const { registration, vapidPublicKey } = options;

  const [supported] = useState<boolean>(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof Notification !== "undefined" ? Notification.permission : null,
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Read the existing subscription (does NOT prompt) on registration change.
  useEffect(() => {
    if (!registration) {
      return;
    }

    void getExistingPushSubscription(registration).then((existing) => {
      setSubscription(existing);
    });
  }, [registration]);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!registration || !supported) {
      return null;
    }

    setError(null);
    setLoading(true);

    try {
      // Requesting permission may prompt the user — must be inside a
      // user gesture. Callers are responsible for calling from a
      // click handler; we don't guard here.
      const granted = await Notification.requestPermission();

      setPermission(granted);

      if (granted !== "granted") {
        return null;
      }

      const fresh = await subscribeToPush({ registration, vapidPublicKey });

      setSubscription(fresh);

      return fresh;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));

      return null;
    } finally {
      setLoading(false);
    }
  }, [registration, supported, vapidPublicKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) {
      return false;
    }

    setError(null);
    setLoading(true);

    try {
      const removed = await unsubscribeFromPush(subscription);

      if (removed) {
        setSubscription(null);
      }

      return removed;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));

      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return {
    isSupported: supported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}
