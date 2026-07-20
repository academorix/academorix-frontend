# notifications-in-app — changelog

## [Unreleased] — inception

Channel-driver module for the in-app notification transport. Registers the
`in_app` channel with the parent notifications module's channel registry.

### Owned artefacts

- 2 entities: `InAppMessage` (denormalised inbox row for the user's bell UI) +
  `InAppMessageRead` (per-view read / dismissed state).
- 1 channel driver: `InAppChannel` (registers via `#[AsNotificationChannel]`).
- 1 attribute: `#[AsNotificationChannel]` — attribute-driven registration of
  channel drivers into the parent's `NotificationChannelRegistry`.
- 4 tenant-facing actions: list, show, mark-as-read, mark-all-as-read.
- 1 command: `notifications:in-app:test-broadcast`.
- 1 job: `BroadcastInAppNotificationJob`.
- 1 listener: `HandleNotificationDispatched` (filters `channel = in_app`).
- 3 events: `InAppMessageDelivered`, `InAppMessageBroadcast`,
  `InAppBulkMarkAllRead`.
- Reverb broadcast into `user.{id}.notifications` on delivery.

### Compatibility

- Depends on `foundation`, `tenancy`, `notifications` (core).
- Extended by no other module (leaf).

### Migration notes

None — inception release.
