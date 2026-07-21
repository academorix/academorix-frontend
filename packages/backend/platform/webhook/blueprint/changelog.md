# webhook — changelog

## [Unreleased] — inception

Wave 1 shared infrastructure module. Reimplementing `stackra/laravel-webhook`
shape under our namespace (Path B).

### Owned artefacts

- 2 entities: `WebhookSubscription` + `WebhookDelivery` with
  spatie/laravel-model-states state machines.
- 14 events (subscription lifecycle + delivery lifecycle + probe + inbound).
- 4 jobs: `DispatchWebhookJob` + `WebhookProbeJob` +
  `PruneWebhookDeliveriesJob` + `AutoUpgradePinnedSubscriptionsJob`.
- 7 commands: `webhook:list`, `webhook:destinations`, `webhook:retry`,
  `webhook:rotate-secret`, `webhook:test`, `webhook:probe`, `webhook:prune`.
- 3 Notification classes: `WebhookSubscriptionDisabledNotification`,
  `WebhookSubscriptionUpgradedNotification`, `WebhookProbeFailedNotification`.
- 2 attributes: `#[AsWebhookEvent]`, `#[AsWebhookDestination]`.
- 4 destination drivers: HttpsDestination + EventBridgeDestination +
  PubSubDestination + MtlsHttpsDestination (three feature-flag guarded).
- 2 backoff strategies: StaticArrayBackoffStrategy +
  RetryAfterAwareBackoffStrategy.
- 1 middleware: `webhooks.verify` (parameterised with two secret keys for
  rotation grace on inbound).

### Compatibility

- Depends on `foundation` + `versioning` + `tenants`.
- Extended by every module that emits outbound events or receives inbound
  provider webhooks.
- No breaking change surface \u2014 inception release.

### Migration notes

Channel modules (`notifications-mail`, `notifications-push`,
`notifications-sms`) refactor their provider webhook handling to consume this
module's `InboundWebhookReceived` event. Their `webhooks.verify:{provider}`
middleware becomes `webhooks.verify:cfg.key.1,cfg.key.2` with secret keys
registered here.
