# notifications/notifications-in-app — Phase 3 implementation status

## Status: PARTIAL — channel driver + broadcast contract landed; realtime transport swap pending

## What landed

- `AsNotificationChannel` attribute — marks the module's driver as
  discoverable by the notifications core's channel registry.
- `InAppChannelDriver` — receives `NotificationDispatched` and
  publishes to the recipient's private channel via
  `Illuminate\Broadcasting`. The DB row already exists at this
  point (persisted by the core's `DefaultDispatchGateway`); the
  driver's job is real-time delivery — the DB row is queryable
  independently.
- Broadcast contract — the payload published on
  `private-user.{id}.notifications` matches the wire-visible
  `NotificationData` DTO so the frontend consumes the same shape
  from both the initial `GET /notifications` and the socket.

## What's pending

### Transports

- **Pusher** — the default. Requires `PUSHER_APP_KEY` +
  `PUSHER_APP_SECRET` + `PUSHER_APP_CLUSTER` from Doppler.
  `config/broadcasting.php` already scaffolded.
- **Laravel Reverb** — the self-hosted alternative. Ships with
  Laravel 12 out of the box. Preferred for on-prem / air-gapped
  deployments.
- **Ably** — the third-choice provider. Only wire if a customer
  requests it.

### Read + delivery ACK

- WebSocket ACK — the client-side SDK should call `POST
  /notifications/{id}/seen` after render. Already wired in the
  notifications core inbox action; needs a realtime cross-check
  path so the second-tab dismisses the toast when the first tab
  acks.
- Presence — the tenant admin dashboard needs a
  `presence-tenant.{id}.staff-online` channel to render who's
  online. Move this to `platform/realtime`; not this module's
  concern.

### Domain events

- `InAppSent` — emitted by `InAppChannelDriver` after broadcast.
- `InAppSeen` — emitted when the client sends the ACK.

### Cross-module dependencies

- **`notifications/notifications`** — dispatches
  `NotificationDispatched`; the driver listens.
- **`platform/realtime`** (planned) — will own the transport
  configuration. This module then just publishes; the transport
  routes.

## Backlog priorities

1. **P0 — Pusher wire-up** (unblocks all realtime UX).
2. **P0 — Broadcast payload freeze** — treat the shape as a public
   contract; changes need a version bump.
3. **P1 — Reverb-first for on-prem tenants.**
