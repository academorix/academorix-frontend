# academorix/webhook

Outbound webhook substrate for Academorix. Owns two aggregates:
`WebhookSubscription` (the customer-registered destination + event filter) and
`WebhookDelivery` (the per-attempt outbound audit trail).

## Aggregates

| Aggregate             | ULID prefix | Purpose                                                                                                    |
| --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `WebhookSubscription` | `whs_`      | Registered destination + subscribed events + api_version pin + signing secret (with rotation grace).       |
| `WebhookDelivery`     | `whd_`      | Append-only per-attempt audit row: request URL + payload + response + latency + signature + attempt count. |

## Install

```bash
composer require academorix/webhook
```

## Contributes

- **Contracts (framework-swappable)**: `WebhookSigner`, `WebhookSender`,
  `WebhookEventDispatcher`, `WebhookRegistry`, `WebhookDestinationRegistry`,
  `SecretRotator`, `BackoffStrategyResolver`. Default impls ship — consumer apps
  override any binding.
- **Attributes**: `#[AsWebhookEvent]` (mark an event class as broadcastable),
  `#[AsWebhookDestination]` (register a destination driver).
- **Destinations (4)**: `HttpsDestination` (ships in v1),
  `EventBridgeDestination`, `PubSubDestination`, `MtlsHttpsDestination`
  (feature-flag guarded).
- **Backoff strategies (2)**: `StaticArrayBackoffStrategy`,
  `RetryAfterAwareBackoffStrategy`.
- **Permissions**: `WebhookPermission` (view, manage, manage-own — dual-guard).
- **Commands**: `webhook:list`, `webhook:destinations`, `webhook:retry`,
  `webhook:rotate-secret`, `webhook:test`, `webhook:probe`, `webhook:prune`.
- **Events (14)**: subscription lifecycle + delivery lifecycle + probe
  outcomes + inbound receiver.
- **Jobs (4)**: `DispatchWebhookJob`, `WebhookProbeJob`,
  `PruneWebhookDeliveriesJob`, `AutoUpgradePinnedSubscriptionsJob`.
- **Middleware**: `webhooks.verify` — inbound-webhook signature guard.
- **Casts (3)**: `WebhookPayloadCast` (encrypted), `DestinationConfigCast`
  (encrypted), `BackoffConfigCast` (plain JSON).

## Signing spec

Every outbound request carries the following headers:

| Header                         | Value                                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| `X-Webhook-ID`                 | Delivery ULID (`whd_...`). Idempotency key for the receiver.              |
| `X-Webhook-Event`              | Event name (e.g. `invitation.sent`).                                      |
| `X-Webhook-Event-Version`      | Resolved payload version (e.g. `v1`).                                     |
| `X-Webhook-Timestamp`          | Unix timestamp when the payload was signed.                               |
| `X-Webhook-Signature`          | `hex(hmac_sha256(timestamp + '.' + event + '.' + payload, secret))`.      |
| `X-Webhook-Signature-Previous` | Only during rotation grace — signature computed with the previous secret. |
| `X-Webhook-Attempt`            | 1-indexed attempt number. Enables receiver dedup.                         |

Receivers reject when `abs(now - timestamp) > replay_window_seconds` (default
300).

## Rotation grace

`webhook:rotate-secret <subscription>` moves the current secret into
`signing_secret_previous`, generates a new secret, and sets a grace window
(default 24h). During the grace window every outbound request carries BOTH
signatures so receivers can migrate without downtime. After the window the
previous secret is cleared.

## Destination drivers

| Driver        | Kind          | Requires config                                                | Ships in v1 | Feature flag                      |
| ------------- | ------------- | -------------------------------------------------------------- | ----------- | --------------------------------- |
| `https`       | standard      | `url`                                                          | yes         | none                              |
| `eventbridge` | aws           | `region`, `event_bus_name`, `source`                           | stub        | `webhook.destination.eventbridge` |
| `pubsub`      | gcp           | `project_id`, `topic_name`                                     | stub        | `webhook.destination.pubsub`      |
| `mtls-https`  | high-security | `url`, `client_cert_path`, `client_key_path`, `ca_bundle_path` | stub        | `webhook.destination.mtls`        |

The stub destinations throw `\RuntimeException` at dispatch time — consumer apps
override `#[Bind]` with a real implementation once the required SDK is
available.

## Tests

```bash
composer install
vendor/bin/pest
```
