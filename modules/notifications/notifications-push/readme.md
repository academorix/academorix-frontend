# `academorix/notifications-push`

Push notification channel for Academorix — Firebase Cloud Messaging (Android +
Web), Apple Push Notification service (iOS), Expo (React Native), and OneSignal
(enterprise). Enterprise-day-1 shape: attribute-first DI, `#[Bind]` on
interfaces, `#[UseModel]` on repositories, `#[Cacheable]` + `#[Filterable]`
config, `SeedsPermissionEnum` trait, and no property arrays on the provider.

## What it owns

- **`PushSubscription` aggregate** — device tokens per user + application,
  encrypted at rest, fingerprinted for admin visibility. `device_token` NEVER
  returned on any API response.
- **`PushTransportManager`** — MultipleInstanceManager wrapping the four
  supported providers.
- **`PushChannel`** — registered with the core notifications channel registry
  under slug `push`.
- **Provider webhook strategies** — FCM Cloud Pub/Sub OIDC signature, APNs
  Feedback Service, OneSignal HMAC. Registered against the shared webhook
  module.
- **Priority 27** — after notifications core (25), before mail (26 - already
  landed) and SMS (28).

## Non-goals

- Push notification content templating — that lives in
  `academorix/notifications` (the core module).
- Inbound webhook receiver — delegated to `academorix/webhook`. This module
  ships only the per-provider signature strategies.
- Cross-channel dispatch orchestration — the core notifications module fans
  out to enabled channels via the `NotificationChannelRegistry`.

## Compliance

- **GDPR Art. 32** — device tokens encrypted at rest (AES-256, KMS-backed);
  fingerprint (SHA-256) exposed to admins for support diagnostics.
- **COPPA VPC** — marketing pushes to minors without verified parental
  consent are refused at send-time and audit-logged.
- **GDPR Art. 17** — `PurgeSubscriptionsForErasedUser` listener hard-deletes
  every subscription for an erased user.
