# @academorix/notifications

Backend-shaped `Notification` DTO, preferences model with quiet hours + safety
allowlist, a React inbox provider, `usePushSubscription` hook, and
service-worker push handlers.

- Depends on `@academorix/core`, `@academorix/http`, `@academorix/realtime`.
- Peer-depends on React 19.

## Public API

| Subpath                                    | Exports                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@academorix/notifications/types`          | `Notification`, `NotificationChannel`, `NotificationStatus`, `NotificationDataRef`                                                                                                  |
| `@academorix/notifications/preferences`    | `NotificationPreferences`, `PreferenceDefaults`, `PerChildPreferences`, `QuietHoursWindow`, `isDeliveryAllowed`, `isWithinQuietHours`, `isQuietHoursWindow`, `MANDATORY_PUSH_TYPES` |
| `@academorix/notifications/context`        | `createNotificationsContext()` → `{ NotificationsProvider, useNotifications }`                                                                                                      |
| `@academorix/notifications/push`           | `isPushSupported`, `getExistingPushSubscription`, `subscribeToPush`, `unsubscribeFromPush`, `serializePushSubscription`, `urlBase64ToUint8Array`                                    |
| `@academorix/notifications/hooks`          | `usePushSubscription({ registration, vapidPublicKey })`                                                                                                                             |
| `@academorix/notifications/service-worker` | `handlePushEvent(event, registration)`, `handleNotificationClickEvent(event)`                                                                                                       |

> No more `/config` subpath. Categories are gone — routing is driven by
> `channel + type` on the wire, and the safety allowlist lives in
> `MANDATORY_PUSH_TYPES`.

## Design principles

- **One DTO, three surfaces.** In-app React lists, Web Push, and native OS
  (Tauri) all render the same `Notification` object; the backend picks the
  channel and the client observes.
- **Wire-format snake_case.** Field names match the Laravel `NotificationData`
  DTO one-for-one so a fetched JSON payload casts directly to `Notification` —
  no mapper layer.
- **Compliance is a first-class predicate.** `isDeliveryAllowed` encodes
  mandatory-push types, per-channel opt-outs, per-event opt-outs, and quiet
  hours in one function shared by the UI and the fixture-preview flow.
- **Never auto-prompt.** `subscribeToPush` must be called from a user gesture.
  `usePushSubscription` doesn't fire the prompt on mount — the caller decides.
- **Presentation-agnostic.** The provider stores state; apps choose the
  rendering (HeroUI Popover, side sheet, native panel). No forced dependency on
  a specific toast library.

## Backend contract

The types in `types/notification.type.ts` + `preferences/preferences.type.ts`
mirror the Laravel DTOs one-for-one. Both DTOs emit snake_case via
`MapOutputName(SnakeCaseMapper::class)`.

### `Notification` ↔ `NotificationData`

| Wire field       | TS field         | Type                                                       |
| ---------------- | ---------------- | ---------------------------------------------------------- |
| `id`             | `id`             | `string` (prefixed `notif_*`)                              |
| `tenant_id`      | `tenant_id`      | `string \| null`                                           |
| `user_id`        | `user_id`        | `string \| null`                                           |
| `template_id`    | `template_id`    | `string \| null`                                           |
| `type`           | `type`           | `string` (domain event, e.g. `"invitation_sent"`)          |
| `channel`        | `channel`        | `"push" \| "email" \| "sms" \| "whatsapp"`                 |
| `title`          | `title`          | `string \| null`                                           |
| `body_preview`   | `body_preview`   | `string \| null`                                           |
| `data_ref`       | `data_ref`       | `Record<string, unknown>` (small primitives + ids only)    |
| `status`         | `status`         | `"queued" \| "sent" \| "delivered" \| "read" \| "bounced"` |
| `sent_at`        | `sent_at`        | `string \| null` (ISO 8601)                                |
| `read_at`        | `read_at`        | `string \| null`                                           |
| `failure_reason` | `failure_reason` | `string \| null`                                           |
| `notes`          | `notes`          | `string \| null`                                           |
| `created_at`     | `created_at`     | `string \| null`                                           |
| `updated_at`     | `updated_at`     | `string \| null`                                           |

Source:
`backend/modules/Communication/src/Data/Notifications/NotificationData.php`.

### `NotificationPreferences` ↔ `NotificationPreferenceData`

| Wire field    | TS field      | Type                                                           |
| ------------- | ------------- | -------------------------------------------------------------- |
| `id`          | `id`          | `string` (prefixed `np_*`)                                     |
| `tenant_id`   | `tenant_id`   | `string \| null`                                               |
| `user_id`     | `user_id`     | `string \| null`                                               |
| `defaults`    | `defaults`    | `Record<string, unknown>` (channel + event opt-ins)            |
| `per_child`   | `per_child`   | `Record<string, PreferenceDefaults>` (keyed by athlete id)     |
| `quiet_hours` | `quiet_hours` | `QuietHoursWindow \| Record<string, never>` (empty when unset) |
| `updated_at`  | `updated_at`  | `string \| null`                                               |

Source:
`backend/modules/Communication/src/Data/NotificationPreferences/NotificationPreferenceData.php`.

## Delivery predicate — `isDeliveryAllowed`

The client's compliance-check for `(channel, type)` tuples. Precedence:

1. `MANDATORY_PUSH_TYPES` bypasses every gate on the push channel.
2. `preferences.defaults[type] === false` — per-event opt-out (all channels).
3. `preferences.defaults[channel] === false` — per-channel opt-out.
4. Quiet hours window blocks in-window deliveries (non-mandatory only).
5. Otherwise, allow.

```ts
import { isDeliveryAllowed } from "@academorix/notifications/preferences";

const allowed = isDeliveryAllowed({
  channel: "push",
  type: "payment_due",
  preferences: userPreferences,
});
```

The predicate is deliberately generous — no explicit opt-in is required. The
backend is the source of truth; this predicate exists so the UI can preview what
a preferences change will affect and so consumers can filter historical
notifications correctly.

## Usage

### 1. Wire the provider

```tsx
// apps/dashboard/src/lib/notifications.ts
import { createNotificationsContext } from "@academorix/notifications/context";

export const { NotificationsProvider, useNotifications } =
  createNotificationsContext();
```

```tsx
// apps/dashboard/src/providers.tsx
<NotificationsProvider initialNotifications={initial}>
  <App />
</NotificationsProvider>
```

### 2. Consume in components

```tsx
import { useNotifications } from "@/lib/notifications";

function NotificationBell() {
  const { unreadCount } = useNotifications();

  return <Badge count={unreadCount} />;
}
```

### 3. Push subscription (in a user gesture!)

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
          // TODO(backend): POST /notifications/subscriptions
          // doesn't exist yet — see "TODO — backend endpoints".
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

### 4. Service worker

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

## TODO — backend endpoints

The read endpoints exist (fixture-first, read-only):

- `GET /notifications`
- `GET /notifications/{id}`
- `GET /notification-preferences`
- `GET /notification-preferences/{id}`

The following write endpoints DO NOT exist yet. Consumers wire them with TODO
markers until the backend catches up:

- `POST /notifications/{id}/read` — mark a single notification as read.
- `POST /notifications/read-all` — bulk mark-read.
- `POST /notifications/subscriptions` — register a Web Push subscription.
- `DELETE /notifications/subscriptions/{id}` — tear down a subscription.
- `PUT /notification-preferences` — update preferences.

Filed as: backend Communication module write endpoints (see
`.kiro/specs/*/tasks.md` in the backend workspace once the tasks land).
