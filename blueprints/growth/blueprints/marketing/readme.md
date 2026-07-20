# marketing

Server-side ad-network conversion event forwarder. Wave 5 growth infrastructure.
The load-bearing marketing lane per `.kiro/steering/growth-and-observability.md`
§1 — captures business-milestone events from domain listeners + fans out to N
ad-network providers per tenant with retry + circuit-breaker + dead-letter
semantics.

## 1. What this module owns

| Concern                                | Owned artefact                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Canonical event ledger                 | `MarketingEvent` — one row per captured business milestone. 7-year retention. Financial audit.         |
| Per-provider delivery log              | `MarketingDelivery` — one row per (event × provider × attempt). 2-year retention.                      |
| Per-tenant provider connections        | `MarketingProviderConfig` — encrypted credentials + enabled event types + circuit-breaker state.       |
| Max-attempts-exceeded events           | `MarketingDeadLetter` — one row per event that exhausted retries. 7-year retention. Manual replay.     |
| Domain-event → marketing-event mapping | `MarketingEventCapturer` listener + `DomainEventMapper` registry.                                      |
| Fan-out orchestrator                   | `MarketingEventDispatcher` — evaluates eligible providers + enqueues one `DispatchToProviderJob` each. |
| Provider driver family                 | `MarketingProviderManager` (MultipleInstanceManager) — 9 drivers day-1.                                |
| Per-provider payload transformation    | `MarketingPayloadTransformer` — one implementation per provider; owns PII hashing rules.               |
| Retry + backoff                        | Exponential schedule: 1m / 5m / 30m / 2h / 12h / 24h. Max 6 attempts.                                  |
| Circuit-breaker                        | Per (tenant, provider). Opens after N consecutive failures; TTL-based auto-close; half-open probing.   |
| Dead-letter queue                      | `MarketingDeadLetter` rows + replay endpoint.                                                          |
| Consent gate                           | Two-phase — snapshotted at capture; re-checked at dispatch. `marketing` + `advertising` categories.    |
| Attribution snapshot                   | Pulled from `growth::attribution` at event-CREATE time. Immutable after snapshot.                      |
| Test mode                              | Per-provider sandbox dispatch for tenant onboarding validation.                                        |
| ROAS reporting                         | Aggregated per-campaign revenue rollups over the event ledger.                                         |

### 1.1 The four owned tables

- `marketing_events` — canonical event ledger. Belongs to `Tenant`. 7-year
  retention (financial audit).
- `marketing_deliveries` — per-provider-per-attempt delivery log. Belongs to
  `Tenant` + `MarketingEvent` (RESTRICT). 2-year retention.
- `marketing_provider_configs` — per-tenant provider connections. Belongs to
  `Tenant`. Retained while active + 90d grace after deactivation.
- `marketing_dead_letters` — max-attempts-exceeded events for manual replay.
  Belongs to `Tenant` + `MarketingEvent` (RESTRICT). 7-year retention (financial
  audit).

None of these carry `application_id`, `organization_id`, `region_id`, or
`scope_node_id` — every row is tenant-scoped per tenancy-columns.md §3 with the
forbidden columns of §5 explicitly absent. Enforced by the
tenancy-compliance-auditor.

## 2. Where this module sits in the growth lanes

Per `.kiro/steering/growth-and-observability.md` §1, marketing is Lane 5. Loss
tolerance ZERO — every event is a paid conversion signal; a lost event is wasted
ad-spend + broken attribution + a support ticket.

Distinct from:

- **Analytics** (Lane 4) — high-volume product-usage events; may drop on
  backpressure; consent `analytics` category; 2-year retention.
- **Audit** (Lane 2) — compliance-grade authorization + mutation record;
  regulator-facing; 7-year retention.
- **Monitoring** (Lane 1) — system health; sampled OK.

The two supporting modules that feed marketing:

- `growth::attribution` — snapshots UTM + click IDs + first/last-touch metadata
  at request boundary; `MarketingEventObserver` reads
  `AttributionResolver::forSubject($subject)` at capture time + freezes the
  snapshot into `marketing_events.attribution` jsonb.
- `compliance::consent` — `ConsentGate::snapshotFor($subject)` captures the
  consent state at event-create; re-checked at dispatch via
  `ConsentGate::allows($tenant, $subject, 'advertising')` before the wire call.

## 3. The MultipleInstanceManager pattern

Per `.kiro/steering/package-conventions.md`, marketing uses Laravel's canonical
`Illuminate\Support\MultipleInstanceManager`:

```
MarketingProviderManager (extends MultipleInstanceManager)
    → instance('meta_capi_meta_pixel_abc') → MetaCapiProvider driver
    → createMetaCapiDriver(config: MarketingProviderConfig)
    → createGoogleAdsDriver(config: MarketingProviderConfig)
    → createGoogleAnalytics4Driver(config: MarketingProviderConfig)
    → createGtmServerDriver(config: MarketingProviderConfig)
    → createTiktokEventsDriver(config: MarketingProviderConfig)
    → createLinkedinInsightDriver(config: MarketingProviderConfig)
    → createSnapchatCapiDriver(config: MarketingProviderConfig)
    → createPinterestCapiDriver(config: MarketingProviderConfig)
    → createCustomWebhookDriver(config: MarketingProviderConfig)
    → extend(name, factory) → runtime driver registration
```

The instance name for the manager is deterministic per config row —
`<provider>_<tenant_short_id>_<config_ulid>`. Consumers call
`$manager->instance($name)` (or `$manager->forConfig($config)`) to get a
provider driver bound to the tenant's encrypted credentials.

Fan-out is NOT a bespoke registry — it iterates the active provider configs for
`(tenant, event_type)` where `event_type IN config.enabled_event_types`. Each
provider gets its own `DispatchToProviderJob`. A throwing provider is isolated
per job — one Meta CAPI outage does not block Google Ads dispatch.

## 4. The event ledger + delivery ledger pattern

Per `.kiro/steering/growth-and-observability.md` §5, marketing follows the
two-table ledger:

- `marketing_events` — immutable-after-terminal-status. Snapshots consent +
  attribution at capture time. Retention: 7 years.
- `marketing_deliveries` — per-attempt log. Contains request payload, response,
  HTTP status, error details, retry state. Retention: 2 years.

Divergent retention deliberate — events retain longer (financial audit); the
per-attempt debugging window is shorter (support-tool needs).

## 5. Provider drivers (9 day-1)

Each provider ships:

1. A driver class implementing the `IMarketingProvider` contract (`name()`,
   `supports(MarketingEventType)`, `dispatch(...)`, `transform(...)`).
2. A JSON Schema in `data/providers/<provider>-config.schema.json` for
   `MarketingProviderConfig.config` validation.
3. A payload transformer that maps the canonical event shape to the provider's
   native contract — including PII hashing rules per provider.

### 5.1 The 9 providers

| Provider         | Endpoint                                                                              | Auth                   | PII shape                                   |
| ---------------- | ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| Meta CAPI        | `https://graph.facebook.com/v18.0/{pixel_id}/events`                                  | access_token in body   | SHA256 email, phone (E.164), fbc, fbp       |
| Google Ads       | `https://googleads.googleapis.com/v14/customers/{customer_id}:uploadClickConversions` | OAuth2 developer token | SHA256 email; gclid; click_time_utc         |
| GA4 Measurement  | `https://www.google-analytics.com/mp/collect?measurement_id={mid}&api_secret={key}`   | api_secret query param | client_id + user_id + session_id            |
| GTM Server       | Caller-configured URL                                                                 | HMAC-SHA256 signature  | Caller-configured schema                    |
| TikTok Events    | `https://business-api.tiktok.com/open_api/v1.3/pixel/track/`                          | Access-Token header    | SHA256 email, phone; ttclid                 |
| LinkedIn Insight | `https://api.linkedin.com/rest/conversionEvents`                                      | OAuth2 Bearer          | SHA256 email; user_info (firstName + title) |
| Snapchat CAPI    | `https://tr.snapchat.com/v2/conversion`                                               | Access-Token           | SHA256 email, phone; sccid                  |
| Pinterest CAPI   | `https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/events`                     | OAuth2 Bearer          | SHA256 email, phone; client_ip + ua         |
| Custom Webhook   | Caller-configured URL                                                                 | HMAC-SHA256 signature  | Raw event + attribution + consent           |

### 5.2 PII hashing

`PiiHasher` normalizes before SHA256:

- **Email** — lowercased + `.trim()`.
- **Phone** — E.164 normalization (`+`, country code, digits only; no
  formatting).
- **Name** — lowercased + ASCII-fold (removes diacritics).
- **IP address** — never hashed by default (providers accept raw for
  fingerprinting).
- **User agent** — never hashed.

Meta CAPI + Snapchat + Pinterest + TikTok require SHA256 of every identifying
field. Google Ads accepts SHA256 email OR raw + hash-at-dispatch. GA4
Measurement Protocol accepts raw client_id + user_id (no hashing).

## 6. Retry + backoff schedule

Per `MarketingProviderConfig.retry_config`:

```
attempt 1: dispatched immediately at event capture
attempt 2: dispatched after 60s
attempt 3: dispatched after 300s (5 min)
attempt 4: dispatched after 1800s (30 min)
attempt 5: dispatched after 7200s (2h)
attempt 6: dispatched after 43200s (12h)
attempt 7: dispatched after 86400s (24h)
final: dispatched after (max_attempts total). MarketingDeadLetter row created.
```

Transient failures (5xx, timeout, network reset) increment `attempt_number` +
schedule the next retry via `RetryFailedDeliveriesJob` (every 5min sweep).
Permanent failures (400 with `is_transient=false` from the provider mapper) skip
to dead-letter immediately.

## 7. Circuit-breaker

Per (tenant, provider) — a Meta CAPI outage for tenant A does not affect tenant
B or Google Ads dispatch for tenant A.

```
CLOSED (normal)
   │ N consecutive failures → OPEN
   ▼
OPEN (blocks all dispatch)
   │ open_duration_seconds elapsed → HALF_OPEN
   ▼
HALF_OPEN (allows 1 probe event)
   │ probe succeeds → CLOSED
   │ probe fails → OPEN
```

Defaults per `data/circuit-breaker-defaults.json` — 5 consecutive failures / 1h
open duration / 1 half-open probe. Ops can reset manually via
`marketing:reset-circuit-breaker` command or POST
`/api/v1/marketing/providers/{provider}/reset-circuit-breaker`.

## 8. Consent gate — two-phase

Per `.kiro/steering/growth-and-observability.md` §7 — every dispatch runs
`ConsentGate::allows($tenant, $subject, 'advertising')` BEFORE the HTTP call.

- **At capture** (in `MarketingEventObserver.creating`) — snapshot
  `ConsentGate::snapshotFor($subject)` into `marketing_events.consent_snapshot`
  jsonb. Refuses capture when consent is absent (no wasted work + no orphaned
  events).
- **At dispatch** (in `MarketingEventDispatcher::dispatch()`) — re-check via
  `ConsentGate::allows($tenant, $subject, 'advertising')`. A user who revoked
  consent between capture and dispatch has the delivery marked
  `status='suppressed_by_consent'` + never sees the wire.

Two-phase deliberate — the capture snapshot is the historical record; the
re-check protects the user.

## 9. Attribution snapshot — frozen at capture

Per `.kiro/steering/growth-and-observability.md` §8:

`MarketingEventObserver.creating` calls
`AttributionResolver::forSubject($subject)` + freezes the returned shape into
`marketing_events.attribution` jsonb. Once snapshotted, IMMUTABLE. Subsequent
attribution reset (new UTM, new campaign click) does not change historical
events — that's what makes ROAS reporting stable over 3+ month windows.

## 10. Test mode

Every provider config has `test_mode: bool` + optional `test_event_code` (Meta
CAPI's `test_event_code` parameter). When `test_mode=true`, dispatches route to
the provider's sandbox endpoint (`test_event_code` in the payload for Meta; the
sandbox subdomain for LinkedIn; etc.).

Test-mode configs are marked with a distinct chip in the SDUI provider list +
excluded from ROAS aggregation. Tenants use test-mode during onboarding to
validate credentials without polluting their production conversion counts.

## 11. Domain-event → marketing-event mapping

Domain code stays marketing-agnostic. The `MarketingEventCapturer` listener
subscribes to domain events (via
`#[AsDomainEventMapper('signup', 'user.registered')]` attribute on mapper
classes) + maps them into `MarketingEvent` rows.

Sample mappings shipped in `data/event-type-catalog.json`:

- `user::UserRegistered` → `marketing_events.event_type='signup'`
- `finance::SubscriptionStarted` → `event_type='subscription_started'` with
  `value_amount_cents` from the subscription's plan price
- `finance::MembershipPurchased` → `event_type='membership_purchased'`
- `facility::BookingCreated` (when payment_status='paid') →
  `event_type='session_booked'`
- `sports::AthleteEnrolled` → `event_type='athlete_enrolled'`
- `finance::RefundIssued` → `event_type='refund_issued'` (negative
  value_amount_cents)
- `finance::ChargebackFiled` → `event_type='chargeback_filed'`

Adding a new marketing-worthy domain event = ship a
`#[AsDomainEventMapper]`-decorated class + register it in the catalogue. No
downstream provider changes needed.

## 12. Tier gating

- **Small** — Meta / Google Ads / GA4 / Custom Webhook only (4 providers). Cap:
  1 provider config. 10k events/month. No LinkedIn / Snapchat / Pinterest / GTM
  Server.
- **Medium** — Full 9 providers. Cap: 3 provider configs. 100k events/month.
  ROAS report enabled.
- **Enterprise** — Full 9 providers. Unlimited configs. Unlimited events/month.
  Dead-letter replay enabled. 10-year retention available.

Enforced by `marketing_capture` (master) + `marketing_provider_slot` (config
cap) + `marketing_event_slot_per_month` (event volume) +
`marketing_advanced_providers` (Medium+) + `marketing_roas_report` (Medium+) +
`marketing_dead_letter_replay` (Enterprise) + `marketing_custom_webhook`
(Medium+) + `marketing_extended_retention` (Enterprise).

## 13. What this module does NOT do

- **Client-side pixel loading.** Server-side only. The frontend
  `@stackra/analytics` package handles pixel + measurement-protocol calls the
  browser needs; this module owns SERVER-side conversion API forwarding.
- **PII in analytics without hashing.** Meta CAPI requires SHA256. Every
  provider driver enforces its own hashing rules.
- **Cross-tenant event sharing.** Every row is tenant-scoped.
- **`application_id` on any row.** Marketing is a domain-plane concern; it
  cascades through `tenant_id → tenants.application_id`. Per tenancy-columns.md
  §2, only 8 rows carry `application_id` directly; `marketing_events` is not one
  of them.
- **`region_id` / `organization_id` / `scope_node_id` on any row.**
- **Manual event insertion via API.** Only via the domain-event listener path
  (prevents replay attacks + preserves the audit trail).
- **Provider-list expansion via config.** Each of the 9 providers is a
  first-class driver. No reflection-based extension — new providers ship as new
  driver classes + JSON schemas + payload transformers.
- **Cross-provider deduplication.** Each provider gets its own `event_id`. Meta
  uses `event_id`; Google uses `order_id`; GA4 uses `client_id + session_id`.
  `MarketingPayloadTransformer` per provider owns the mapping.
- **ML-based fraud detection.** That's the referrals module's job.
- **Client-side attribution capture.** The `growth::attribution` module owns
  UTM + click-ID capture at request boundary.

## 14. Cross-references

- `hierarchy.md` §7 — tier matrix (feature gating).
- `hierarchy.md` §11 — the growth + observability lane split.
- `tenancy-columns.md` §3 — every marketing table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every marketing row.
- `.kiro/steering/growth-and-observability.md` — the marketing lane's semantics,
  MultipleInstanceManager pattern, event/delivery ledger, consent gate,
  attribution snapshot.
- `.kiro/steering/package-conventions.md` — MultipleInstanceManager shape.
- `modules/growth/blueprints/attribution/` — feeds
  `marketing_events.attribution`.
- `modules/compliance/blueprints/consent/` — `ConsentGate` snapshot + gate.
- `modules/platform/blueprints/facility/` — canonical 4-entity module reference.
- `modules/workflow/blueprints/approvals/` — canonical multi-provider fan-out
  reference.
