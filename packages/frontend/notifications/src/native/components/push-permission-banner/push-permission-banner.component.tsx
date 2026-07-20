/**
 * @file push-permission-banner.component.tsx
 * @module @stackra/notifications/native/components
 * @description Native "Enable push notifications" call-to-action.
 *
 *   Uses HeroUI Native's `Alert` compound with an `accent` status.
 *   On native, the OS-level prompt is a single one-shot request —
 *   the banner hides once the user has decided (`granted` or
 *   `denied`) and when the runtime doesn't support notifications
 *   at all (Node / SSR / very-old RN).
 *
 *   RN has no iOS Safari tutorial variant — the OS prompt IS the
 *   user experience. This banner is a soft nudge that fires the
 *   permission request on a real user gesture.
 */

import { useState, type ReactElement } from "react";
import { View } from "react-native";
import { Alert, Button } from "@stackra/ui/native";

import { useNotificationPermission } from "../../hooks";
import type { PushPermissionBannerProps } from "./push-permission-banner.interface";

/**
 * Native push-permission banner.
 *
 * @example
 * ```tsx
 * import { PushPermissionBanner } from '@stackra/notifications/native';
 * <PushPermissionBanner onGranted={() => refresh()} />
 * ```
 */
export function PushPermissionBanner({
  title = "Get instant updates",
  description = "Enable notifications so we can reach you when the app is in the background.",
  enableLabel = "Enable",
  onGranted,
  onDismissed,
  className,
}: PushPermissionBannerProps = {}): ReactElement | null {
  const { permission, isSupported, request } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);
  const [isPending, setPending] = useState(false);

  // Hide unless the runtime supports notifications AND the user
  // hasn't yet decided AND they haven't dismissed this session.
  if (!isSupported) return null;
  if (permission !== "default") return null;
  if (dismissed) return null;

  const handleEnable = async (): Promise<void> => {
    setPending(true);
    try {
      const result = await request();
      if (result === "granted") {
        onGranted?.();
      }
    } finally {
      setPending(false);
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
    onDismissed?.();
  };

  return (
    <Alert className={className} status="accent">
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
        <View className="mt-3 flex-row items-center gap-2">
          <Button
            isDisabled={isPending}
            size="sm"
            onPress={() => {
              void handleEnable();
            }}
          >
            <Button.Label>{enableLabel}</Button.Label>
          </Button>
          <Button size="sm" variant="ghost" onPress={handleDismiss}>
            <Button.Label>Not now</Button.Label>
          </Button>
        </View>
      </Alert.Content>
    </Alert>
  );
}
