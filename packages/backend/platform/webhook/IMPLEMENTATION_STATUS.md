# platform/webhook — Phase 3 implementation status

## Status: PARTIAL — inbound receive path + subscription CRUD + delivery attempts landed; outbound delivery worker + retry ladder pending

## What landed

### Aggregate

- `WebhookSubscription` — outbound webhook subscriptions. Tenant registers a
  callback URL + secret + event filter. `WebhookSubscriptionInterface` column
  contract with `secret` (encrypted at rest via Laravel Encrypter cast),
  `signing_algorithm` (HS256 default), `event_filter` JSON, `state` (`active` /
  `paused` / `suspended`), plus rate-limit knobs.
- `WebhookDelivery` — per-attempt delivery record. Carries the attempt count,
  response status, response body preview, signature-header snapshot for audit.
- `WebhookEvent` — the tenant-visible event queue that subscriptions consume.
  Fan-out point.

### Inbound receiver (central plane)

- `ReceiveInboundWebhook` (POST `/webhooks/inbound/{namespace}/{provider}`) —
  the public receiver for third-party webhooks (Stripe, Paddle, GitHub, ...).
  The `webhooks.verify` middleware validates the shape of `X-Webhook-*` headers;
  the provider-specific secret check lives in the event listener registered per
  namespace. Dispatches `InboundWebhookReceived` with `namespace`, `provider`,
  `payload`, `headers` (Authorization stripped).
- Provider-specific handlers subscribe to `InboundWebhookReceived` and
  deduplicate on `(namespace, provider, provider_event_id)` before dispatching
  to the module's domain-event handler. This is where
  `finance/gateway::WebhookHandler` picks up Stripe / Paddle events.

### Outbound subscription management (tenant surface)

- `CreateSubscription` (POST `/api/v1/tenant/webhook-subscriptions`) — create a
  new outbound subscription. Auto-generates a 32-byte secret + returns it once
  (client MUST persist immediately).
- `ShowSubscription`, `ListSubscriptions`, `UpdateSubscription`,
  `DeleteSubscription` — full CRUD.
- `PauseSubscription`, `ResumeSubscription` — lifecycle.
- `RotateSecret` (POST `/{subscription}/rotate-secret`) — generates a new
  secret + returns it (old secret honoured for a 24h overlap window per the
  blueprint).
- `TestSubscription` (POST `/{subscription}/test`) — dispatches a synthetic test
  event to the subscription URL. Rate-limited.
- `ListDeliveries`, `ShowDelivery`, `RetryDelivery` — delivery attempt
  inspection + administrative retry.

### Platform-tier surface

- `ListSubscriptions`, `ShowSubscription`, `PauseSubscription`,
  `ResumeSubscription`, `ListDeliveries` — cross-tenant surface for support /
  abuse investigation. Gated by `platform.webhooks.viewAny`.

### Services

- `HmacSha256Signer` — signs outbound payloads:
  `HMAC-SHA256(secret, timestamp + '.' + body)`, emits
  `X-Academorix-Signature-256: t=<timestamp>,v1=<signature>` header per the
  Stripe convention.
- `VerifyInboundWebhook` — validates the shape of an incoming
  `X-Webhook-Signature` header + delegates to a per-namespace signer registered
  via `#[AsWebhookSigner]`.

## What's pending

### Actions to complete

- Delivery finaliser — no dedicated action. The `RetryDelivery` action currently
  re-enqueues via `DeliverWebhookJob`; that job is a stub.

### Services + jobs to complete

- `DeliverWebhookJob` — currently a stub. Should:
  1. Load the `WebhookDelivery` by id.
  2. Sign the payload via `HmacSha256Signer`.
  3. POST to the subscription URL with a 30s HTTP timeout.
  4. Record the response (status, body preview, latency) on the
     `WebhookDelivery` row.
  5. On 2xx: mark delivered + emit `WebhookDelivered`.
  6. On 4xx (except 429): mark permanently failed + emit
     `WebhookDeliveryFailed` + auto-pause the subscription after 3 consecutive
     4xx.
  7. On 5xx / 429 / timeout: back off + retry via
     `Backoff(30, 300, 900, 3600, 14400)` (5-attempt ladder over ~5.5h) —
     `#[Backoff]` attribute on the job class.
- `FanOutWebhookEventJob` — reads `webhook_events`, matches against every
  `WebhookSubscription` whose `event_filter` accepts the event, creates one
  `WebhookDelivery` per match, enqueues `DeliverWebhookJob` per delivery. Called
  from the domain-event listener that emitted the event.
- `WebhookSubscriptionSuspender` — reads `webhook_deliveries` for stuck-failure
  patterns + auto-suspends subscriptions (>50% failure rate over 100 attempts).

### Domain events to dispatch

Per `modules/platform/blueprints/webhook/events.json`:

- `InboundWebhookReceived` — WIRED.
- `OutboundWebhookQueued` — from the fanout job when a `WebhookDelivery` is
  created.
- `WebhookDelivered` — from `DeliverWebhookJob` on 2xx.
- `WebhookDeliveryFailed` — from `DeliverWebhookJob` after all retries
  exhausted.
- `WebhookSubscriptionCreated` / `WebhookSubscriptionPaused` /
  `WebhookSubscriptionResumed` / `WebhookSubscriptionSuspended` /
  `WebhookSubscriptionSecretRotated` — WIRED via observer + action callbacks.

### Cross-module dependencies

- **`finance/gateway`** — pre-existing Stripe / Paddle webhook handlers
  subscribe to `InboundWebhookReceived` in the `stripe` / `paddle` namespace.
  This wiring is already documented in `finance/gateway`'s recent commit
  history.
- **`notifications/notifications`** — every module that emits a domain event
  that should escape to a tenant integration publishes it via
  `WebhookEventPublisher` (Actions/Support). This is the outbound bridge —
  pending.
- **`observability/audit`** — every subscription secret rotation + every
  subscription creation lands in the audit log. Verified via the `Auditable`
  trait on `WebhookSubscription`.

### Rate-limit + middleware wiring

- `webhooks.verify` — WIRED. Custom middleware in the module.
- Inbound rate limit — the receiver is on the `api` group's default 60/min.
  Should be lifted to 600/min per `(namespace, provider)` since payment
  providers legitimately burst.
- Outbound rate limit — enforced by the subscription's
  `max_deliveries_per_minute` field. Pending.

## Backlog priorities

1. **P0 — `DeliverWebhookJob` implementation.** Without this, outbound
   subscriptions land in the DB but nothing goes out over the wire.
2. **P0 — Retry ladder + exponential backoff.**
3. **P1 — Auto-suspend on stuck-failure.**
4. **P1 — Outbound rate limiting.**
5. **P2 — Diagnostic tooling for tenants (delivery detail view +
   replay-single-delivery).**
