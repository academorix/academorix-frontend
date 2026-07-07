/**
 * @file push-permission-banner.tsx
 * @module notifications/components/push-permission-banner
 *
 * @description
 * The "Enable push notifications" call-to-action rendered at the top
 * of the drawer. Explicit — we NEVER auto-prompt for permission (see
 * NOTIFICATIONS_PLAN §3), the banner only triggers the browser prompt
 * on user gesture.
 *
 * ## Visibility rules
 *
 *   1. Hidden entirely when the `webPush` feature flag is off (Phase
 *      0 default).
 *   2. Hidden when the browser lacks Push API support.
 *   3. Hidden when permission has already been granted OR blocked
 *      (a blocked state needs a per-browser recovery path — see the
 *      preferences page for that copy).
 *   4. Shown otherwise, with a single primary "Enable" button.
 *
 * ## Why keep the whole logic in one file
 *
 * The banner is tightly coupled to the browser's permission state,
 * which is imperative and lives outside React. Splitting the "is it
 * shown" logic from the "what happens on press" logic would just
 * double the surface without making anything clearer.
 */

import { isPushSupported } from "@academorix/notifications";
import { BellIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import { features } from "@/config/features.config";
import { registerPush } from "@/notifications/push/register-push";
import { emitNotificationTelemetry } from "@/notifications/telemetry";

/** Props for {@link PushPermissionBanner}. */
export interface PushPermissionBannerProps {
  /**
   * Called after a successful subscribe. Used by the drawer to close
   * itself so the user sees the shell (with the newly-enabled state)
   * without having to click twice.
   */
  readonly onSubscribed?: () => void;
}

/**
 * Renders the "Enable notifications" affordance when the browser is
 * capable AND the user has not yet granted or denied permission.
 *
 * @remarks
 * The `webPush` feature flag gates the WHOLE component tree — a
 * disabled flag returns `null` before we ever touch the Notification
 * API. That matters because module code should not observe the
 * browser's permission state unless the feature is actually enabled;
 * doing so would fire `Notification.permission` on tenants that
 * haven't opted into web push at all.
 */
export function PushPermissionBanner({ onSubscribed }: PushPermissionBannerProps): ReactNode {
  // Web Push flag off — render nothing.
  if (!features.webPush) {
    return null;
  }

  return <PushPermissionBannerInner onSubscribed={onSubscribed} />;
}

/**
 * The banner's body. Split out so the outer gate does not touch the
 * browser API at all when the flag is off.
 */
function PushPermissionBannerInner({ onSubscribed }: PushPermissionBannerProps): ReactNode {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !isPushSupported()) {
      return "unsupported";
    }

    return Notification.permission;
  });
  const [isBusy, setBusy] = useState(false);

  // The permission state can change without React knowing — an OS-level
  // preference change is fired as a `permissionchange` event on modern
  // browsers. We tail the property on a light interval as a fallback
  // (Safari doesn't fire the event).
  useEffect(() => {
    if (permission === "unsupported") {
      return;
    }

    const interval = window.setInterval(() => {
      setPermission(Notification.permission);
    }, 5000);

    return (): void => {
      window.clearInterval(interval);
    };
  }, [permission]);

  if (permission === "unsupported" || permission === "granted" || permission === "denied") {
    return null;
  }

  const handleEnable = async (): Promise<void> => {
    setBusy(true);
    emitNotificationTelemetry(EVENTS.notificationPermissionRequested, {
      surface: "drawer_banner",
    });

    try {
      const result = await registerPush();

      // Update local state — the effect above will also pick this up
      // but the immediate update keeps the render tight.
      setPermission(Notification.permission);

      if (result.status === "subscribed") {
        emitNotificationTelemetry(EVENTS.notificationPermissionGranted, {
          surface: "drawer_banner",
        });
        emitNotificationTelemetry(EVENTS.pushSubscriptionCreated, {
          surface: "drawer_banner",
        });
        onSubscribed?.();
      } else if (result.status === "permission_denied") {
        emitNotificationTelemetry(EVENTS.notificationPermissionDenied, {
          surface: "drawer_banner",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-start gap-3 border-b border-border bg-accent-soft px-4 py-3"
      data-testid="push-permission-banner"
    >
      <BellIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-soft-foreground" />
      <div className="flex-1 text-sm text-accent-soft-foreground">
        <div className="font-medium">Get instant updates</div>
        <p className="mt-0.5 text-xs">
          Enable browser notifications for urgent alerts even when Academorix is in the background.
        </p>
      </div>
      <Button
        aria-label="Enable notifications"
        isDisabled={isBusy}
        size="sm"
        variant="primary"
        onPress={() => {
          void handleEnable();
        }}
      >
        Enable
      </Button>
    </div>
  );
}
