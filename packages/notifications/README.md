# @academorix/notifications

Notification primitives for the Academorix workspace: canonical `Notification`
DTO, category preferences model, `usePushSubscription` hook, service-worker push
handlers, and a React notifications inbox provider.

- Depends on `@academorix/core`, `@academorix/http`, `@academorix/realtime`.
- Peer-depends on React 19.

## Public API

| Subpath                                    | Exports                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@academorix/notifications/types`          | `Notification<TCategory>`, `NotificationChannel`, `NotificationPriority`                                                                         |
| `@academorix/notifications/config`         | `defineNotificationCategories(list)`, `NotificationCategoryConfig<TId>`                                                                          |
| `@academorix/notifications/preferences`    | `NotificationPreferences<TCategory>`, `CategoryChannelPreferences`, `QuietHoursWindow`, `isDeliveryAllowed`, `isWithinQuietHours`                |
| `@academorix/notifications/context`        | `createNotificationsContext<TCategory>()` → `{ NotificationsProvider, useNotifications }`                                                        |
| `@academorix/notifications/push`           | `isPushSupported`, `getExistingPushSubscription`, `subscribeToPush`, `unsubscribeFromPush`, `serializePushSubscription`, `urlBase64ToUint8Array` |
| `@academorix/notifications/hooks`          | `usePushSubscription({ registration, vapidPublicKey })`                                                                                          |
| `@academorix/notifications/service-worker` | `handlePushEvent(event, registration)`, `handleNotificationClickEvent(event)`                                                                    |

## Design principles

- **One DTO, three surfaces.** In-app React toasts, Web Push, and native OS
  (Tauri) all render the same `Notification` object; the backend picks the
  channel and the client observes.
- **Compliance is a first-class predicate.** `isDeliveryAllowed` encodes DND,
  quiet hours, mandatory-push categories, and per- category channel toggles in
  one function used by both the UI and the backend contract check.
- **Never auto-prompt.** `subscribeToPush` MUST be called from a user gesture.
  `usePushSubscription` doesn't fire the prompt on mount — the caller decides
  when to ask.
- **Presentation-agnostic.** The provider stores state; apps choose the
  rendering (HeroUI Popover, side sheet, native panel). No forced dependency on
  a specific toast library.

## Usage

### 1. Declare categories

```ts
// apps/dashboard/src/config/notifications.config.ts
import { defineNotificationCategories } from "@academorix/notifications/config";

export const NOTIFICATION_CATEGORIES = defineNotificationCategories([
  {
    id: "operational",
    label: "Operational",
    description: "Attendance, sessions, day-to-day tenant activity",
    defaultPriority: "normal",
    defaultChannels: ["in-app"],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Invoices, payments, plan changes",
    defaultPriority: "normal",
    defaultChannels: ["in-app", "email"],
  },
  {
    id: "safety",
    label: "Child safety",
    description: "Safeguarding + emergency alerts",
    defaultPriority: "critical",
    defaultChannels: ["in-app", "push", "email"],
    mandatoryPush: true,
  },
] as const);

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[number]["id"];
```

### 2. Wire the provider

```tsx
import { createNotificationsContext } from "@academorix/notifications/context";
import type { NotificationCategory } from "@/config/notifications.config";

export const { NotificationsProvider, useNotifications } =
  createNotificationsContext<NotificationCategory>();

// apps/dashboard/src/providers.tsx
<NotificationsProvider initialNotifications={initial}>
  <App />
</NotificationsProvider>;
```

### 3. Consume in components

```tsx
import { useNotifications } from "@/lib/notifications";

function NotificationBell() {
  const { unreadCount } = useNotifications();
  return <Badge count={unreadCount} />;
}
```

### 4. Push subscription (in a user gesture!)

```tsx
import {
  serializePushSubscription,
  usePushSubscription,
} from "@academorix/notifications";
import { httpClient } from "@/lib/http";
import { envConfig } from "@/config/env.config";

function EnableNotificationsButton({
  registration,
}: {
  registration: ServiceWorkerRegistration;
}) {
  const { subscription, subscribe } = usePushSubscription({
    registration,
    vapidPublicKey: envConfig.pushVapidPublicKey,
  });

  return subscription ? null : (
    <Button
      onPress={async () => {
        const fresh = await subscribe();
        if (fresh) {
          await httpClient.post(
            "/notifications/subscriptions",
            serializePushSubscription(fresh),
          );
        }
      }}
    >
      Enable notifications
    </Button>
  );
}
```

### 5. Service worker

```ts
// apps/dashboard/src/pwa/sw.ts (Workbox injectManifest source)
import {
  handleNotificationClickEvent,
  handlePushEvent,
} from "@academorix/notifications/service-worker";

self.addEventListener("push", (event) =>
  handlePushEvent(
    event as PushEvent,
    (self as unknown as ServiceWorkerGlobalScope).registration,
  ),
);
self.addEventListener(
  "notificationclick",
  handleNotificationClickEvent as EventListener,
);
```
