/**
 * @file push-permission-banner.component.tsx
 * @module @stackra/notifications/react/components
 * @description "Enable push notifications" call-to-action, rendered
 *   at the top of the drawer or standalone in an app shell.
 *
 *   Explicit — never auto-prompts for permission. The banner only
 *   triggers the browser prompt on a user gesture, and hides on
 *   unsupported environments + when the user has already
 *   granted/denied.
 *
 *   Uses HeroUI's `Alert` compound — title / description via
 *   `Alert.Title` + `Alert.Description`, action via a sibling
 *   `Button` (Alert has no built-in action slot in the current
 *   HeroUI OSS release).
 */

import { useState, type ReactElement } from 'react';
import { Alert, Button } from '@stackra/ui/react';
import { BellIcon } from '@stackra/ui/icons/heroicon/outline';

import { useNotificationPermission } from '../../hooks/use-notification-permission';
import { usePushSubscription } from '../../hooks/use-push-subscription';
import type { PushPermissionBannerProps } from './push-permission-banner.interface';

/**
 * Renders the "Enable notifications" affordance when the browser is
 * capable AND the user has not yet decided.
 *
 * @example
 * ```tsx
 * import { PushPermissionBanner } from '@stackra/notifications/react';
 * <PushPermissionBanner vapidPublicKey={import.meta.env.VITE_VAPID_KEY} />
 * ```
 */
export function PushPermissionBanner({
  title = 'Get instant updates',
  description = 'Enable browser notifications so we can reach you when the app is in the background.',
  enableLabel = 'Enable',
  vapidPublicKey,
  onSubscribed,
  onDismissed,
  className,
}: PushPermissionBannerProps = {}): ReactElement | null {
  const { permission, isSupported, request } = useNotificationPermission();
  const { subscribe, isPending } = usePushSubscription(
    vapidPublicKey ? { vapidPublicKey } : undefined
  );
  const [dismissed, setDismissed] = useState(false);

  // Hide unless the browser supports notifications AND the user
  // hasn't yet made a decision AND they haven't dismissed us this
  // session.
  if (!isSupported) return null;
  if (permission !== 'default') return null;
  if (dismissed) return null;

  const handleEnable = async (): Promise<void> => {
    const result = await request();
    if (result === 'granted') {
      // Best-effort subscribe — a failure lands in `usePushSubscription`'s
      // `error`; the banner just closes when the permission is granted.
      await subscribe();
      onSubscribed?.();
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
    onDismissed?.();
  };

  return (
    <Alert status="accent" className={className} data-notifications-push-banner="">
      <Alert.Indicator>
        <BellIcon aria-hidden="true" className="size-4" />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="sm"
            isDisabled={isPending}
            onPress={() => {
              void handleEnable();
            }}
          >
            {enableLabel}
          </Button>
          <Button size="sm" variant="ghost" onPress={handleDismiss}>
            Not now
          </Button>
        </div>
      </Alert.Content>
    </Alert>
  );
}
