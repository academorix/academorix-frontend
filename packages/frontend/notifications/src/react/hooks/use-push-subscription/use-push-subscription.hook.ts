/**
 * @file use-push-subscription.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description React binding for the shared
 *   {@link PushSubscriptionManager}.
 *
 *   Consumers who want push must first import a platform module
 *   (`PushModule` on web, `NativeNotificationModule` on native) so
 *   an adapter is registered under `PUSH_SUBSCRIPTION_ADAPTER`.
 *   The hook injects the manager through {@link PUSH_SUBSCRIPTION_MANAGER}
 *   and exposes `subscribe`, `unsubscribe`, and `refresh`
 *   callbacks alongside a reactive `subscription` snapshot.
 */

import { useCallback, useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';

import { PUSH_SUBSCRIPTION_MANAGER } from '@/core/constants';
import type { IPushSubscriptionResult, PushSubscriptionManager } from '@/core';
import type {
  IUsePushSubscriptionOptions,
  IUsePushSubscriptionResult,
} from './use-push-subscription.interface';

/**
 * Manage the push subscription lifecycle.
 *
 * @example
 * ```tsx
 * import { usePushSubscription } from '@stackra/notifications/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function PushToggle() {
 *   const { subscription, subscribe, unsubscribe, isPending } = usePushSubscription({
 *     vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string,
 *   });
 *   return (
 *     <Button
 *       isDisabled={isPending}
 *       onPress={() => (subscription ? unsubscribe() : subscribe())}
 *     >
 *       {subscription ? 'Disable' : 'Enable'} notifications
 *     </Button>
 *   );
 * }
 * ```
 */
export function usePushSubscription(
  options?: IUsePushSubscriptionOptions
): IUsePushSubscriptionResult {
  const manager = useInject<PushSubscriptionManager>(PUSH_SUBSCRIPTION_MANAGER);
  const [subscription, setSubscription] = useState<IPushSubscriptionResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const next = await manager.getSubscription();
    setSubscription(next);
  }, [manager]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Capture the caller-supplied key so `subscribe()` picks it up
  // without re-creating the callback on every render.
  const vapidKey = options?.vapidPublicKey;

  const subscribe = useCallback(async (): Promise<IPushSubscriptionResult | null> => {
    setIsPending(true);
    setError(null);
    try {
      const next = await manager.subscribe(vapidKey);
      setSubscription(next);
      return next;
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      return null;
    } finally {
      setIsPending(false);
    }
  }, [manager, vapidKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    try {
      const success = await manager.unsubscribe();
      if (success) setSubscription(null);
      return success;
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [manager]);

  return {
    subscription,
    isSupported: manager.isSupported(),
    isPending,
    error,
    subscribe,
    unsubscribe,
    refresh,
  };
}
