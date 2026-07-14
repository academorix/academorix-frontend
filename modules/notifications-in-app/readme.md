# notifications-in-app

The in-app notification channel. Thin wrapper around Laravel Reverb (self-hosted WebSocket server, Pusher/Ably as pluggable alternatives).

> **Position in the wave.** Wave 1 channel module. Depends on `foundation`, `workspaces`, `notifications` (core). Zero downstream `extendedBy` \u2014 channels are terminal.

## 1. What this channel does

- **Handoff**: subscribes to core's `NotificationDispatched` event with `channel=in_app`.
- **Write**: creates a `NotificationDelivery` row (channel=in_app, state=delivered) via core's DispatchGateway. In-app delivery is guaranteed by the DB write \u2014 no provider fan-out.
- **Broadcast**: emits a Reverb event on `user.{id}.notifications` (declared by core's broadcasts.json). The connected SPA updates the bell badge + inbox list live.

## 2. What this channel does NOT own

- No Notification / NotificationDelivery / NotificationTemplate entities \u2014 those are core's.
- No inbox UI \u2014 that's core's SDUI.
- No preferences UI \u2014 that's core's SDUI.
- No policies \u2014 access to inbox rows is enforced by core's NotificationPolicy.

## 3. Delivery semantics

Unlike mail / sms / push, in-app is:

- **Synchronous delivery** \u2014 the DB write is the delivery. There's no bounce, no retry.
- **Best-effort broadcast** \u2014 if Reverb is down, the DB write still succeeds; users see the notification on next inbox refresh. The `notifications.in-app.broadcast` kill switch flips this off during Reverb incidents.
- **Open tracked implicitly** \u2014 opened_at = when the user loads the inbox screen (front-end sets `notification.seen`).
- **Click tracked** \u2014 links in in-app notifications route through core's click-tracking middleware.

## 4. Providers

Laravel Reverb by default. `BroadcastManager` accepts Pusher / Ably as pluggable alternatives via `config('broadcasting.default')`. This module does not care which broadcaster is active \u2014 it dispatches through Laravel's `broadcast()` helper.

## 5. Config surface

See `config.json`. Two knobs:

- `notifications-in-app.broadcast_enabled` (bool, default true) \u2014 emits the Reverb broadcast on write. Off = DB-only writes (poll-on-refresh degrade).
- `notifications-in-app.batch_broadcast_threshold` (int, default 5) \u2014 above N in-app notifications for the same user in a short window, collapse into a single `notifications.bulk` broadcast to reduce socket chatter.

## 6. Files

```
notifications-in-app/
├── module.json         readme.md            changelog.md
├── traits.json
├── listeners.json      jobs.json            broadcasts.json
├── health.json         metrics.json
├── data-classes.json   errors.json
├── feature-flags.json  config.json
```

Twelve files. No entities, no SDUI, no data seeds.
