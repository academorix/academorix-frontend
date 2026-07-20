# analytics — changelog

Every change to this module lands here in reverse-chronological order. Follow
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) semantics + tag every
change with its wave / spec / ADR reference.

## Unreleased

Nothing yet.

## v0.1.0 — inaugural release (Wave 5)

### Added

- **Module scaffold** — `modules/growth/analytics/` created following the
  marketing / attribution sibling blueprint shape. Priority 66 (Wave 5, after
  `attribution` at 63 and upstream of `marketing` at 68).
- **Four owned entities** with dedicated schemas:
  - `AnalyticsEvent` (`ane_`) — canonical behavioral event ledger. Immutable
    after status transitions to a terminal state. 2-year retention (5 with
    `analytics_extended_retention`).
  - `AnalyticsDelivery` (`and_`) — per-provider-per-attempt delivery log. 90-day
    retention.
  - `AnalyticsProviderConfig` (`apc_`) — per-tenant provider credentials +
    `enabled_event_types` + `sampling_rate` + `batch_config` + circuit-breaker
    state + retry policy. Encrypted config column.
  - `AnalyticsIdentity` (`aid_`) — identity resolution table. Maps
    `anonymous_id` → `identified_user_id`. 1-year retention per GDPR
    minimisation.
- **Seven provider drivers** — PostHog, Amplitude, Mixpanel, Segment, June,
  Google Analytics 4, Custom Webhook. Each ships a `payload transformer`, a
  `batching policy`, a `retry policy`, and an optional
  `provider-webhook signature strategy`.
- **`AnalyticsProviderManager`** — a `MultipleInstanceManager` per Laravel
  contract. `instance('provider_name')` returns the configured driver; new
  drivers register at boot via `#[AsAnalyticsProviderDriver]`.
- **Attribute-driven capture** — `#[AsAnalyticsEventCapturer]` on listener
  classes registers them in the `AnalyticsEventCapturerRegistry` at boot. A
  single domain event can map to multiple analytics events with different
  property shapes.
- **Consent gate** — every dispatch runs through
  `ConsentGate::allows(subjectId, 'analytics')` BEFORE the HTTP call. Suppressed
  events land in `analytics_deliveries` with `status='suppressed_by_consent'`.
- **Attribution snapshot** — every event snapshots the current
  `AttributionContext` at CREATE time. Immutable thereafter.
- **Sampling** — per-event × per-provider sampling roll via `SamplingGate` with
  a stable hash of `(event.deduplication_key, provider.name)`.
- **Batching** — Redis-backed per (tenant, provider) buffer flushed by
  `FlushBatchedProviderJob` on `batch_config.size` OR
  `batch_config.flush_interval_ms`.
- **Circuit breaker** — per-provider state written to
  `analytics_provider_configs.circuit_breaker_state`. 5 consecutive failures OR
  20% failure rate over 60s window opens. Half-open probe every 60s; 3
  consecutive successes close.
- **Identity resolution** — `IdentityResolver` service maps `anonymous_id` →
  `identified_user_id`. `MergeAliasedEventsJob` rewrites `subject_id` on prior
  events when a `alias()` or `identify()` merges two identities.
- **Event catalogue** — 22 published events covering the capture lifecycle,
  delivery lifecycle, batching lifecycle, circuit-breaker transitions, identity
  resolution lifecycle, and semantic events (funnel step reached, experiment
  variant assigned).
- **Async surface** — 8 queued jobs covering capture, dispatch, per-provider
  fan-out, batched flush, retry, identity reconcile, retention purge, and
  sampling-rate reconcile.
- **HTTP surface** — two hosts (tenant + platform-admin) covering event
  read-only inspection, delivery inspection, provider CRUD + test +
  circuit-breaker reset, identity list + merge + identify, funnel report,
  experiment report.
- **Bindings** — 16 registered container bindings for repositories, the manager,
  the capturer + dispatcher + samplers + snapshotters + report builders.
- **Notifications** — 4 platform-admin notifications: circuit-breaker opened,
  batch backpressure, high drop rate, identity merge completed.
- **Policies** — 4 authorization policies (event, delivery, provider config,
  identity) with fine-grained abilities per entity + guard.
- **Permissions** — tenant + platform_admin guard permission strings seeded via
  `AnalyticsPermissionSeeder`.
- **Entitlement consumption** — 8 declared entitlements sourced from the
  `entitlements` module.
- **Feature keys** — 9 feature keys published against
  `feature-flag::FeatureFlag` for the plan-tier-differentiated behaviours
  (provider availability, advanced providers, batching, identity merge, sampling
  config, extended retention, session recording).
- **Self-declared compliance regimes** in `compliance.json` — GDPR (Art. 6, 7,
  17, 21, 30, 32), CCPA (§1798.140 profiling), SOC 2 Type 2 (CC7.3, CC8.1).
- **Field classification** in `data-classes.json` — every column across the four
  entities tagged per foundation's five-tier taxonomy.
- **Subprocessor list** — inaugural entries for PostHog, Amplitude, Mixpanel,
  Segment, June, Google Analytics 4 with DPA URLs + certifications.

### Notes

- **PostHog session recordings** are opt-in via
  `provider_config.enable_session_recording=true` AND require the `functional`
  consent category on the subject (distinct from `analytics`). A subject who
  consents to analytics but not functional never gets recorded.
- **GA4 dual-listing rationale** — same wire protocol as `marketing::ga4` but
  different event catalog. Analytics uses snake_case behavioral names
  (`screen_view`, `select_content`); marketing uses business names (`sign_up`,
  `purchase`). Tenants may configure the same measurement_id in both modules;
  filtering happens client-side in GA4 by `event_name`.
- **No PII in properties/context** — enforced at capture-time by
  `PropertyValidator`. Property names + values are scanned against a PII regex
  (email addresses, phone numbers, credit cards, national IDs). Violation
  refuses the event with `NOTIFICATIONS_ANALYTICS_PII_DETECTED`.
- **Sampling is stable per event × provider** — the roll uses a stable hash of
  `(event.deduplication_key, provider.name)` so a retried event either
  dispatches or suppresses consistently across every attempt.
- **Identity merges are Enterprise-only** — cross-device identity resolution is
  a powerful but privacy-sensitive feature. Gated by `analytics_identity_merge`
  entitlement.

### ULID prefixes registered (in `modules/foundation/data/ulid-prefixes.json`)

- `ane_` → `AnalyticsEvent`
- `and_` → `AnalyticsDelivery`
- `apc_` → `AnalyticsProviderConfig`
- `aid_` → `AnalyticsIdentity`

### Migration path

Green-field module. No migration from prior state. Frontend `@stackra/analytics`
continues to operate independently for client-side capture; server-side capture
via this module is complementary (not a replacement).

Modules add `#[AsAnalyticsEventCapturer]` listeners on their own timeline; the
capturer registry degrades gracefully when a domain event has no registered
capturer (no analytics event fires, no error).
