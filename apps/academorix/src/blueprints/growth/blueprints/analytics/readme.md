# analytics

Server-side behavioral event fan-out to product analytics platforms. The
canonical answer to **"how are users behaving in the product?"** — fine-grained
event capture across every backend-driven state transition, delivered
consent-gated, attribution-enriched, and identity-resolved to 7 provider
platforms out of the box.

Priority: 66 (Wave 5, downstream of `attribution` at 63 and upstream of
`marketing`, `finance`, `referrals`, `notifications` at 68+). Depends on
`foundation`, `tenancy`, `application`, `user`, `entitlements`, `compliance`,
`attribution`.

## 1. Why this module exists

The frontend already ships `@stackra/analytics` for client-side capture (page
views, clicks, form-field interactions). That layer is fast, granular, and
tenant-controlled — but it disappears the moment an ad-blocker fires or iOS ITP
purges the storage. **Backend-driven state transitions and monetary events must
never depend on the browser being cooperative.**

Concrete failure modes when analytics is only client-side:

- **Purchase confirmed on the server** — client fires `Order Completed`. Ad
  blocker drops it. Marketing attribution loses the conversion; the funnel looks
  like the user abandoned checkout.
- **Async mutation from a queue** — a background job completes a subscription
  upgrade. There's no browser tab open. Client can't fire anything.
- **Third-party callbacks** — webhook lands, state changes, no user-agent to
  emit from.
- **Mobile app in the background** — deferred deep link resolves,
  server-authoritative event needs to land.

`growth::analytics` is the AUTHORITATIVE analytics lane for events the platform
generates itself. The frontend layer is a secondary source for pure UX signal
(hover, scroll depth) the backend can't observe.

## 2. Scope — the four entities

| Entity                    | ULID   | Role                                                                                                                                                                                      |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AnalyticsEvent`          | `ane_` | Canonical event ledger. One row per business event captured. Immutable after status transitions to a terminal state. Snapshots attribution + consent + context at capture time.           |
| `AnalyticsDelivery`       | `and_` | Per-provider-per-attempt delivery log. One row per (event × provider × attempt). Contains request payload, response, HTTP status, latency, error details. 90-day retention.               |
| `AnalyticsProviderConfig` | `apc_` | Per-tenant provider credentials + `enabled_event_types` + `sampling_rate` + `batch_config` + circuit-breaker state + retry policy. Encrypted config column via `EncryptedCastForConfigs`. |
| `AnalyticsIdentity`       | `aid_` | Identity resolution table. Maps `anonymous_id` → `identified_user_id` across sessions. First-seen / identified-at / last-seen timestamps + device_fingerprint_hash.                       |

Compare to `marketing`: analytics carries FINE-GRAINED behavioral events
(feature_viewed, funnel_step_reached, error_encountered). Marketing carries
BUSINESS MILESTONES (signup, trial, purchase). Both are conversion signals but
live in different lanes because they answer different questions, have different
retention, and gate on different consent categories.

## 3. Provider matrix (7 drivers day-1)

Each driver implements `AnalyticsProviderInterface` and is registered by
`AnalyticsProviderManager` (a `MultipleInstanceManager`). One tenant can have
multiple providers active simultaneously; the same event fans out to every
active provider that has the event's type in `enabled_event_types`.

| Provider               | Wire protocol                       | Batching                  | Verbs                                                         |
| ---------------------- | ----------------------------------- | ------------------------- | ------------------------------------------------------------- |
| **PostHog**            | HTTPS + api_key                     | Yes, 1000/batch           | track, identify, page, screen, alias, group                   |
| **Amplitude**          | HTTPS + api_key                     | Yes, 1000/batch, 10MB max | track, identify (page/screen/alias/group synthesized)         |
| **Mixpanel**           | HTTPS + service_account basic auth  | Yes, 2000/batch           | track (identify/alias/group/page/screen synthesized)          |
| **Segment**            | HTTPS + write_key basic auth        | Yes, 100/batch, 500KB     | track, identify, page, screen, alias, group                   |
| **June**               | HTTPS + Bearer api_key              | No (single events)        | track, identify, group                                        |
| **Google Analytics 4** | HTTPS + measurement_id + api_secret | Yes, 25/batch             | track only (analytics event catalog, distinct from marketing) |
| **Custom Webhook**     | HTTPS + HMAC-SHA256                 | Yes, 100/batch            | all six                                                       |

GA4 appears in both `analytics` and `marketing` modules because the wire
protocol is identical but the event catalogs are different — analytics uses
snake_case behavioral names (`screen_view`, `select_content`); marketing uses
business names (`sign_up`, `purchase`). Tenants typically configure the same GA4
property in both modules and filter client-side in GA4 by `event_name`.

## 4. Consent gate

Every event dispatch runs through `ConsentGate::allows(subjectId, 'analytics')`
BEFORE the HTTP call. Suppressed events mark
`delivery.status='suppressed_by_consent'` and never touch the wire.

- **Analytics** is a DISTINCT consent category from marketing. GDPR Art. 6(1)(a)
  requires granular opt-in per lane.
- Consent state is captured at event-CREATE time (snapshotted into
  `analytics_events.consent_snapshot` jsonb).
- Consent state is re-checked at event-DISPATCH time — a user who revokes
  consent between capture and dispatch has their pending events suppressed.
- **PostHog session recordings** additionally gate on the `functional` consent
  category (recordings are more invasive than behavioral events; a user may
  consent to analytics but not to session replay).

## 5. Attribution snapshot

Every analytics event snapshots the current `AttributionContext` from
`growth::attribution` at CREATE time into `analytics_events.attribution` jsonb.
Once snapshotted, the attribution is IMMUTABLE — a subsequent attribution reset
(new UTM, new session, click on new campaign) does not change historical events.
That makes "how much revenue came from Campaign X three months ago" a stable
query.

## 6. Identity resolution

`AnalyticsIdentity` maps `anonymous_id` (uuid, generated by the frontend on
first visit) to `identified_user_id` (usr_...) as soon as the user signs in. The
`identify()` verb writes an identity row; the `alias()` verb merges two
identities that turned out to be the same person.

Downstream: `MergeAliasedEventsJob` rewrites `subject_id` on prior events from
the anonymous_id to the identified user_id, so a user's pre-signup behavior
funnels into their post-signup profile.

`device_fingerprint_hash` is a SHA-256 hash of a browser/device fingerprint —
NEVER the raw fingerprint. Used only for anti-abuse (detect coordinated signup
patterns), never for cross-device tracking without explicit consent.

## 7. Sampling — per-event × per-provider

Each `AnalyticsProviderConfig` carries a `sampling_rate` (0..1, default 1.0) and
an `enabled_event_types` array (patterns like `['track:*', 'identify']`).
Combined:

- PostHog gets `sampling_rate=1.0` (want everything for funnel analysis).
- Amplitude gets `sampling_rate=0.1` for volume-heavy `error_encountered` events
  but `sampling_rate=1.0` for high-signal events like `subscription_upgraded`.

`SamplingGate` rolls the dice per (event, provider) pair using a stable hash of
`(event.deduplication_key, provider.name)` so the same event is either
dispatched or suppressed for a given provider across every retry — never a
partially-delivered fan-out that thinks half its providers are broken.

## 8. Batching + circuit breaker

- **Batching providers** (PostHog, Amplitude, Mixpanel, Segment, GA4,
  CustomWebhook) accumulate events in Redis per (tenant, provider) until
  `batch_config.size` OR `batch_config.flush_interval_ms` triggers a flush via
  `FlushBatchedProviderJob`.
- **Non-batching providers** (June) fire one HTTP request per event.
- **Circuit breaker** — 5 consecutive failures OR 20% failure rate over 60s
  window opens the breaker (state written to
  `analytics_provider_configs. circuit_breaker_state`). Half-open probe every
  60s; 3 consecutive successes close it. Manual reset via
  `POST /providers/{p}/reset-circuit-breaker`.

## 9. Entitlements consumed

Seven entitlements sourced from the `entitlements` module.

| Key                              | Kind    | Default caps                                                   |
| -------------------------------- | ------- | -------------------------------------------------------------- |
| `analytics_capture`              | boolean | free: false, team: true, business: true, enterprise: true      |
| `analytics_provider_slot`        | slot    | small: 1, medium: 3, enterprise: unlimited                     |
| `analytics_event_slot_per_month` | pool    | small: 100000, medium: 1000000, enterprise: unlimited          |
| `analytics_advanced_providers`   | boolean | small: false, medium: true, enterprise: true                   |
| `analytics_batch_configuration`  | boolean | small: false, medium: true, enterprise: true                   |
| `analytics_identity_merge`       | boolean | small: false, medium: false, enterprise: true                  |
| `analytics_sampling_config`      | boolean | small: false, medium: false, enterprise: true                  |
| `analytics_extended_retention`   | boolean | small: false, medium: false, enterprise: true (2y → 5y events) |

## 10. Retention

- `analytics_events`: 2 years hot (5 years with `analytics_extended_retention`).
- `analytics_deliveries`: 90 days hot. Support-debugging window; past that,
  provider-side dashboards are authoritative.
- `analytics_provider_configs`: while active + 90 days grace after deactivation.
- `analytics_identities`: 1 year post-`identified_at` per GDPR minimisation.
  Reconciled nightly by `ReconcileAnalyticsIdentityJob` — dangling anonymous_ids
  with no activity for 90 days are hard-deleted.
- `TenantErased`: cascade delete every table via foundation's cascade contract.

## 11. What this module does NOT do

- **No PII in `properties` or `context`.** Enforced at capture-time by
  `PropertyValidator` — property names + values scanned against a PII regex
  (email addresses, phone numbers, credit cards). Violation → event refused with
  `NOTIFICATIONS_ANALYTICS_PII_DETECTED`. Provider drivers additionally refuse
  to serialize PII-shaped values.
- **No cross-tenant analytics.** Every table is `tenant_id`-scoped via
  `BelongsToTenant`. Cross-tenant analytics is a data-warehouse pattern
  (Snowflake / BigQuery); not this module's responsibility.
- **No `application_id` shortcut.** Analytics cascades through
  `tenant_id → tenants.application_id`. Per `tenancy-columns.md` §2, only 8 row
  types carry `application_id` directly; analytics is not one of them.
- **No `region_id` / `organization_id` / `scope_node_id`.** Analytics is not a
  configuration consumer — it doesn't participate in the scope substrate.
- **No client-side capture.** That's `@stackra/analytics` frontend. This module
  is server-only.
- **No ML-based user segmentation.** Providers do their own segmentation
  server-side (PostHog cohorts, Amplitude behavioral cohorts). Deferred.
- **No revenue attribution.** Analytics events with a `value` property forward
  the value, but ROAS + LTV computation lives in `marketing`. Analytics is
  behavior; marketing is money.
- **No cross-provider deduplication.** Same event fans out to N providers by
  design. Each provider has its own `deduplication_key` semantics; we honor
  theirs (Mixpanel `$insert_id`, PostHog implicit via
  `distinct_id + event + timestamp`).
- **No manual event insertion via API.** Only the listener path (domain event →
  `AnalyticsEventCapturer` → `AnalyticsEvent`). Tenant admins cannot POST to
  `/api/v1/analytics/events` — that's a read-only surface.

## 12. Wire projection

Every analytics event delivered to at least one provider emits a versioned wire
event (`analytics.event.delivered` / v1) that downstream services can consume
via the `webhook` module. Sample:

```json
{
  "event": "analytics.event.delivered",
  "version": "v1",
  "occurred_at": "2026-07-14T03:15:07Z",
  "data": {
    "analytics_event_id": "ane_01H...",
    "tenant_id": "ten_01H...",
    "event_name": "feature_viewed",
    "event_kind": "track",
    "category": "feature_use",
    "subject": { "type": "user", "id": "usr_01H..." },
    "delivered_provider_count": 3,
    "eligible_provider_count": 4,
    "suppressed_providers": ["amplitude:sampling"]
  }
}
```

## Related steering

- `.kiro/steering/growth-and-observability.md` — the five-lane model (monitoring
  / audit / activity / analytics / marketing).
- `.kiro/steering/tenancy-columns.md` §3 + §5 — column contracts.
- `.kiro/steering/hierarchy.md` — Wave 5 position + priority 66 rationale.
- `.kiro/steering/package-conventions.md` — `MultipleInstanceManager`
  driver-per-config pattern.
- `.kiro/steering/priority-ordering.md` — why analytics sits at 66.
- `modules/growth/blueprints/attribution/` — the feeder module (63).
- `modules/growth/blueprints/marketing/` — sibling module (68) with the same
  ledger + manager + provider pattern, different consent + retention + event
  catalog.

## ULID prefixes registered

- `ane_` → `AnalyticsEvent`
- `and_` → `AnalyticsDelivery`
- `apc_` → `AnalyticsProviderConfig`
- `aid_` → `AnalyticsIdentity`
