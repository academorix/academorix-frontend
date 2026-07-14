# webhook

Webhook substrate. Wave 1 shared infrastructure. Reimplementing the `stackra/laravel-webhook` shape under our namespace (Path B).

> **Position in the wave.** Depends on `foundation` + `versioning` + `workspaces`. Extended BY every module that publishes outbound events (notifications-*, subscription, invitations, ...) OR receives inbound provider webhooks (notifications-mail from Mailgun, notifications-sms from Twilio, subscription from Stripe, workspaces from DNS providers).

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| Customer-registered subscription URLs + destinations | `WebhookSubscription` |
| Per-attempt outbound delivery audit trail | `WebhookDelivery` |
| Attribute-driven event registration | `#[AsWebhookEvent]` |
| Attribute-driven destination registration | `#[AsWebhookDestination]` |
| Signing (HMAC-SHA256 + rotation grace) | `WebhookSigner` binding |
| Backoff strategy resolution | `BackoffStrategyResolver` binding |
| Fan-out orchestration (Bus::batch) | `WebhookEventDispatcher` binding |
| Universal inbound receiver | `POST /webhooks/inbound/{namespace}/{provider}` |
| Signature verification middleware | `webhooks.verify` |
| Auto-disable on 410 / N failures | `WebhookSubscriptionObserver` |
| Health probes | `webhook-subscriptions-reachable` |

## 2. Outbound flow

```
Publisher fires an event (any module):

  event(new InvitationSent($invitation));
       │
       ▼
  WebhookEventDispatcher (subscriber, auto-registered by compiler):
    - Reads #[AsWebhookEvent(name: 'invitation.sent', version: 'v1')] on the event class
    - Queries active WebhookSubscription rows where events @> ['invitation.sent']
    - For each matching subscription: applies versioning module's payload transformer chain
      (subscription.api_version = v1, publisher emitted v3 → chain V3→V2→V1)
    - Wraps per-subscription DispatchWebhookJob dispatches in a single Bus::batch()
       │
       ▼
  DispatchWebhookJob (per subscription, queued):
    - Loads subscription config (destination + backoff + rate limit + signing secret)
    - Checks rate limit (per-subscription, requests/minute)
    - Resolves destination driver: HttpsDestination / EventBridgeDestination / etc.
    - Calls WebhookSigner::sign() → adds X-Webhook-* headers
    - Calls destination driver's send() method
    - Persists WebhookDelivery row with response
       │
       ▼
  On success (2xx): fire WebhookDelivered
  On retryable (408/425/429/5xx): schedule retry per BackoffStrategy, fire WebhookDeliveryFailed
  On permanent (410): mark subscription disabled, fire WebhookSubscriptionDisabled + WebhookDeliveryFailedPermanent
  On other 4xx: fire WebhookDeliveryFailedPermanent (no retry, no auto-disable)
```

## 3. Inbound flow

```
Provider (e.g. Mailgun) POSTs to /webhooks/inbound/mail/mailgun

  POST /webhooks/inbound/mail/mailgun
       │
       ▼
  webhooks.verify:notifications-mail.webhook_secrets.mailgun,notifications-mail.webhook_secrets.mailgun_previous
    - Reads provider's signature per convention (Mailgun HMAC-SHA256, SendGrid Ed25519, etc.)
    - Verifies against configured secret OR previous secret (rotation grace)
    - Refuses with 401 WEBHOOK_SIGNATURE_INVALID on failure
       │
       ▼
  InboundWebhookController@ingest:
    - Persists a WebhookReceipt row (optional \u2014 audit trail)
    - Fires InboundWebhookReceived event with { namespace, provider, payload, headers }
       │
       ▼
  Downstream module listens:
    - notifications-mail's IngestMailProviderWebhookListener filters on namespace=notifications-mail
    - Normalises Mailgun-specific payload → MailDelivered/Opened/Clicked/Bounced/Complaint event
    - Core notifications aggregates
```

## 4. Attribute-driven registration

Build-time compiler walks the codebase for `#[AsWebhookEvent]` + `#[AsWebhookDestination]` classes + populates registries at boot. Runtime lookup is O(1).

```php
#[AsWebhookEvent(name: 'invitation.sent', version: 'v1', description: 'Fired when an invitation is dispatched.')]
final readonly class InvitationSent
{
    public function __construct(
        public string $invitationId,
        public string $email,
        public string $workspaceId,
    ) {}
}
```

```php
#[AsWebhookDestination(name: 'eventbridge', supportsBatching: true, requiresConfig: ['region', 'event_bus_name', 'source'])]
final class EventBridgeDestination implements DestinationInterface
{
    public function send(WebhookDelivery $delivery, array $config): DeliveryResult { ... }
}
```

## 5. Signing + rotation grace

Every outbound request carries 7 headers. Signature is `hex(hmac_sha256(timestamp . '.' . event . '.' . payload, secret))`.

**Rotation grace**: when the workspace rotates a signing secret, the previous secret is retained for `signing.rotation_grace_seconds` (default 24h). During grace, both `X-Webhook-Signature` (new secret) and `X-Webhook-Signature-Previous` (old secret) are emitted. Receivers can flip-cut without coordinating timing with the sender.

## 6. Auto-disable

Two triggers auto-disable a subscription (transition state → disabled):

- Receiver returned `410 Gone` → immediate disable + `WebhookSubscriptionDisabled` event with reason=`gone`.
- N consecutive failures (default 30, per-subscription config) → disable + reason=`failure_threshold`.

Customer admins receive `WebhookSubscriptionDisabledNotification` (mail + in-app). Admin can `POST /subscriptions/{id}/resume` to re-enable.

## 7. Rate limiting

Per-subscription `rate_limit_per_minute` column (nullable = unlimited). Enforced by `WebhookSender` before dispatch. On limit hit: the delivery is deferred to the next minute + a `webhook.rate_limit_deferred_total` counter increments.

## 8. Fan-out batching

`WebhookEventDispatcher` wraps per-subscription `DispatchWebhookJob` dispatches in a single `Bus::batch()`. Ops see "the order.placed batch dispatched 47 deliveries" as one Horizon unit. `on-completion` + `on-failure` hooks on the batch fire aggregate events.

Batch name pattern: `webhook:{event_name}:{timestamp}` — e.g. `webhook:invitation.sent:2024-10-15T08:00:00Z`.

## 9. API version integration

`WebhookSubscription.api_version` (nullable FK to `versioning::api_versions.slug`):

- Null → publisher's current version (default lookup).
- Set → transformer chain applied at dispatch. If chain can't compose (missing transformer edge): delivery fails with `VERSIONING_TRANSFORMER_MISSING` + subscription auto-paused.
- Sunset cascade: when the referenced version transitions to `sunset`, subscriptions upgrade to the version's `migration_target_slug` if set (via `AutoUpgradePinnedSubscriptionsJob`); otherwise paused.

## 10. Destinations

**HTTPS** — the default. Standard `POST` (configurable verb) with signed JSON body.

**EventBridge** (AWS) — feature-flag guarded. Publishes to a per-subscription EventBus. Supports batching (up to 10 events per PutEvents call). Uses IAM Role auth via instance profile.

**PubSub** (GCP) — feature-flag guarded. Publishes to a per-subscription topic. Supports batching. Uses service account key from Secret Manager.

**mTLS HTTPS** — feature-flag guarded. HTTPS with client-cert authentication for high-security receivers (banking, government). Requires client_cert + client_key + ca_bundle configured on the subscription.

New destinations register via `#[AsWebhookDestination]`. The build-time compiler discovers + validates.

## 11. Middleware

`webhooks.verify:cfg.key.primary,cfg.key.previous` — parameterised signature verification. Loads secrets from config at boot (Doppler-backed in production). Two-key parameter enables rotation grace on the inbound side.

## 12. Retention

- `WebhookDelivery` — 30 days hot (default; per config `webhook.audit.prune_after_days`). Pruned by `webhook:prune` scheduled daily. Chunked in batches of 1000 to bound transaction size.
- `WebhookSubscription` — while active. Soft-deleted subscriptions retained 90 days for admin recovery + hard-purged.

## 13. Extending

**Publish an event**:
1. Add `#[AsWebhookEvent(name: 'billing.invoice_paid', version: 'v1')]` on your event class.
2. Fire the event via Laravel's dispatcher. Webhook module handles the rest.

**Register a destination**:
1. Implement `DestinationInterface`.
2. Annotate with `#[AsWebhookDestination(name: 'my-destination', requiresConfig: [...])]`.
3. Build-time compiler picks it up.

**Register a backoff strategy**:
1. Implement `BackoffStrategyInterface::nextDelaySeconds(int $attempt): int`.
2. Add to `webhook.backoff_strategies` config.
3. Subscription can select via the `backoff_strategy` column.

## 14. Files

```
webhook/
├── module.json          readme.md              changelog.md
├── traits.json          relations.json         routes.json           middleware.json
├── events.json          listeners.json         observers.json
├── jobs.json            schedule.json          commands.json
├── notifications.json   policies.json          permissions.json
├── features.json        feature-flags.json     entitlements.json
├── health.json          metrics.json           analytics.json        caches.json          retention.json
├── compliance.json      data-classes.json      errors.json
├── config.json
├── schemas/
│   ├── webhook-subscription.schema.json
│   └── webhook-delivery.schema.json
├── data/
│   └── webhook-events-catalog.json   (bootstrap: webhook.test, webhook.probe)
└── sdui/
    ├── readme.md
    ├── resources/webhook-subscription/{list,show,create,edit}.screen.json
    ├── resources/webhook-delivery/{list,show}.screen.json
    └── widgets/webhook-delivery-status-chip.widget.json
```

## 15. What this module does NOT do

- **Doesn't own event schemas.** Modules that publish events own their event DTOs + `#[AsWebhookEvent]` annotations.
- **Doesn't own subscriber authentication.** Signing secrets belong to subscribers; this module signs outbound + verifies inbound.
- **Doesn't own payload versioning.** `versioning` module owns the ApiVersion registry + transformer chain resolver.
- **Doesn't own provider-specific normalisation.** Channel modules (notifications-mail, etc.) subscribe to `InboundWebhookReceived` events + normalise their provider's payload shape.
- **Doesn't own consumer analytics.** `compliance` module aggregates subscription-affects-workspace-data reports for DPO surfacing.
