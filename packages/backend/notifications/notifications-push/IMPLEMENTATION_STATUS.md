# notifications/notifications-push — Phase 3 implementation status

## Status: SCAFFOLDED — model + subscription table landed; APNs/FCM transports pending

## What landed

- `PushSubscription` model + interface — carries `device_token`, `platform`
  (`ios` / `android` / `web`), `endpoint`, `user_id`, `tenant_id`, plus
  `p256dh` + `auth` for web-push RFC 8291.
- `AsNotificationChannel` attribute stub.

## What's pending

### Actions to complete

- `RegisterPushSubscription` (POST `/api/v1/tenant/notification-subscriptions`)
  — creates a `PushSubscription` row. Dedup on `(user_id, device_token)`.
- `DeregisterPushSubscription` (DELETE `/{subscription}`) — revokes a
  subscription (client sign-out).
- `ListMyPushSubscriptions` (GET) — the "manage my devices" view.

### Services + jobs

- **APNs transport** — `PushChannelDriverApns` wrapping the `pushok/pushok`
  library. HTTP/2 push with JWT signer per Apple spec. Certificate + team-id +
  key-id from Doppler.
- **FCM transport** — `PushChannelDriverFcm` wrapping the `kreait/firebase-php`
  SDK. Server-key auth. Handles topic + token send.
- **Expo transport** — `PushChannelDriverExpo` for the Expo push service (React
  Native tenant clients). Batches up to 100 messages per HTTP call.
- **Web-push transport** — `PushChannelDriverWebPush` wrapping
  `minishlink/web-push` for browser push notifications (VAPID signed).
- `PruneExpiredSubscriptionsJob` — nightly cleanup of expired device tokens
  (marked `expired` by transport errors).

### Domain events

- `PushSent` — from the driver after transport ACK.
- `PushBounced` — from transport error handlers (invalid token, unregistered
  app).
- `SubscriptionRegistered` / `SubscriptionRevoked` — from the register /
  deregister actions.

### Cross-module dependencies

- **`notifications/notifications`** — receives `NotificationDispatched` from the
  core.
- Mobile clients (`apps/mobile`) — call the register action after the OS-level
  permission grant.

## Backlog priorities

1. **P0 — Subscription CRUD actions** (blocking mobile client integration).
2. **P0 — FCM + APNs transport** (the two production runtimes).
3. **P1 — Expo transport** (dev / preview builds).
4. **P2 — Web-push transport** (browser channel).
