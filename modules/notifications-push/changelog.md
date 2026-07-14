# notifications-push — changelog

## [Unreleased] — inception

- Push notification channel authored. Wraps FCM + APNs + Expo + OneSignal via own MultipleInstanceManager.
- Owns `PushSubscription` entity + admin device management surface.
- Device tokens: RESTRICTED tier, KMS-encrypted at rest.
- COPPA VPC gate on marketing-priority sends.
- Provider webhook receiving delegated to `webhook` module (namespace=notifications-push).
- Feature flags per provider.

### Compatibility

- Depends on `foundation`, `tenancy`, `notifications` (core), `webhook`.
- No breaking change surface — inception release.
