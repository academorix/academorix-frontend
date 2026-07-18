/**
 * @file offline-banner.component.tsx
 * @module @stackra/network/react/components
 * @description OfflineBanner — renders a HeroUI `Alert` when the browser
 *   loses connectivity. Built on `@stackra/ui` (HeroUI / HeroUI Pro).
 */

import { Alert } from "@stackra/ui/react";

import { useNetworkStatus } from "@/core/hooks";
import type { OfflineBannerProps } from "@/react/interfaces";

/**
 * OfflineBanner — shows a `danger` HeroUI Alert when the browser is offline,
 * `null` when online.
 *
 * @param props - Component props (`title`, `message`, `className`)
 * @returns An `Alert` element when offline, `null` when online
 *
 * @example
 * ```tsx
 * import { OfflineBanner } from '@stackra/network/react';
 *
 * <OfflineBanner
 *   title="No connection"
 *   message="You're offline — changes will sync when reconnected."
 * />
 * ```
 */
export function OfflineBanner({
  title = "You are offline",
  message,
  className,
}: OfflineBannerProps): React.ReactElement | null {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <Alert status="danger" className={className} data-network-status="offline">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {message ? <Alert.Description>{message}</Alert.Description> : null}
      </Alert.Content>
    </Alert>
  );
}
