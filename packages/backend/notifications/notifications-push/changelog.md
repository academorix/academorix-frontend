# Changelog

All notable changes to `stackra/notifications-push`.

## [Unreleased]

### Added

- Initial scaffolding — enterprise-day-1 shape (attribute-first DI, `#[Bind]` on
  interfaces, `#[UseModel]` + `#[Cacheable]` + `#[Filterable]` on the
  repository, `SeedsPermissionEnum` seeder, `HydratesFrom`-driven provider
  registry).
- `PushSubscription` model + migration + factory + policy + observer.
- FCM / APNs / Expo / OneSignal provider drivers under
  `Stackra\Notifications\Push\Transports\`.
- Signature strategies for provider webhooks: `FcmSignatureStrategy`,
  `ApnsFeedbackStrategy`, `OneSignalSignatureStrategy`.
- Attribute + registry for provider drivers so downstream apps can plug in
  additional transports.
