# marketing — changelog

## [Unreleased] — inception (Wave 5)

- Marketing module authored. Four owned entities:
  - `MarketingEvent` — canonical event ledger. One row per captured business
    milestone. 7-year retention (financial audit; 10 for Enterprise).
  - `MarketingDelivery` — per-provider-per-attempt delivery log. 2-year
    retention.
  - `MarketingProviderConfig` — per-tenant encrypted provider credentials +
    enabled_event_types filter + circuit-breaker state + test-mode flag. 90-day
    grace after soft-delete.
  - `MarketingDeadLetter` — max-attempts-exceeded events for manual replay.
    INDEFINITE retention (financial audit).
- Nine entitlement gates:
  - `marketing_capture` (boolean, all tiers) — master feature gate.
  - `marketing_provider_slot` (integer per tier — Small=1, Medium=3,
    Enterprise=∞) — how many provider configs.
  - `marketing_event_slot_per_month` (integer per tier — Small=10k, Medium=100k,
    Enterprise=∞) — event volume cap.
  - `marketing_advanced_providers` (Medium+) — LinkedIn/Snapchat/Pinterest/GTM
    Server.
  - `marketing_test_mode` (all tiers) — sandbox dispatch flow.
  - `marketing_roas_report` (Medium+) — ROAS dashboard.
  - `marketing_dead_letter_replay` (Enterprise) — manual dead-letter replay.
  - `marketing_custom_webhook` (Medium+) — generic HMAC-signed webhook driver.
  - `marketing_extended_retention` (Enterprise) — 7y → 10y for financial audit.
- MultipleInstanceManager pattern via `MarketingProviderManager` with 9 driver
  families day-1: meta_capi, google_ads, google_analytics_4, gtm_server,
  tiktok_events, linkedin_insight, snapchat_capi, pinterest_capi,
  custom_webhook.
- Two-phase consent gate: snapshotted at capture; re-checked at dispatch via
  `marketing` + `advertising` consent categories.
- Attribution snapshot pulled from `growth::attribution` at event-CREATE time
  (frozen thereafter).
- Retry with exponential backoff (1m/5m/30m/2h/12h/24h; max 6 attempts) +
  per-tenant-per-provider circuit-breaker (opens after 5 consecutive failures;
  1h open duration; half-open probe).
- Dead-letter queue with 7-year retention + replay endpoint (Enterprise-only) +
  resolve endpoint.
- Deduplication via composite unique partial index on (tenant_id,
  deduplication_key) WHERE deleted_at IS NULL.
- PII hashing per provider (SHA256 email lowercased+trimmed, phone E.164
  digits-only, name lowercased+ASCII-folded).
- HMAC-signed dispatch for Custom Webhook + GTM Server providers.
- Domain-event → marketing-event mapping via `#[AsDomainEventMapper]` attribute
  — domain code stays marketing-agnostic.
- Cascade paths: TenantErased → FK CASCADE across all four tables +
  provider-side deletion requests (best-effort Meta Data Deletion API, Google
  Ads user-data deletion, ...); UserErased → subject_id nulled on affected
  events + provider-side deletion requests; ConsentRevoked → pending events
  suppressed; TenantSuspended → providers deactivated.
- Test-mode per-provider sandbox dispatch for tenant onboarding validation.
- ROAS reporting via GET /roas endpoint (Medium+) + monthly report job +
  marketing:roas-report CLI.
- 24 events published; 7 notification categories; 9 background jobs; 14 Artisan
  commands.
- 3 broadcast channels: `tenant.{id}.marketing`,
  `tenant.{id}.marketing.providers`, `tenant.{id}.marketing.dead-letters`.
- SDUI: 8 screens (marketing-event list + view, marketing-provider list +
  create + edit + test, marketing-dead-letter list + replay, marketing-roas
  dashboard) + 4 widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `entitlements`,
  `compliance`, `attribution`.
- Extended by NONE. Wave 4 Finance + Wave 5 referrals + Wave 5 notifications are
  peers (they consume marketing via the domain-event → mapper pattern, not via
  extension).
- Wave 5 inception release.

### Design notes

- Marketing does NOT carry `application_id` / `region_id` / `organization_id` /
  `scope_node_id`. Every row is tenant-scoped per tenancy-columns.md §3, with
  the forbidden columns of §5 explicitly absent.
- Every write to marketing_events / marketing_deliveries /
  marketing_provider_configs / marketing_dead_letters emits an audit row
  (Auditable trait) with 7-year retention.
- The two-phase consent gate is by-design — capture-time snapshot preserves the
  historical record; dispatch-time re-check protects the user's revocation.
- The attribution snapshot on marketing_events is IMMUTABLE after create —
  that's what makes historical ROAS reporting stable over 3+ month windows.
- The MultipleInstanceManager pattern enables provider fan-out without a bespoke
  registry — each config is a first-class instance name.
- The circuit-breaker is PER (tenant, provider). A Meta CAPI outage for tenant A
  does NOT affect tenant B or Google Ads dispatch for tenant A.
- The dead-letter queue retains INDEFINITELY — every unresolved paid conversion
  loss is preserved for the tenant's lifetime + beyond.
- Marketing events are captured ONLY via the domain-event listener path
  (`#[AsDomainEventMapper]`). Direct API create is forbidden (prevents replay
  attacks + preserves the audit trail).
- Provider drivers are first-class classes (`#[AsMarketingProvider]`) — new
  providers ship as new driver classes + JSON schemas + payload transformers. No
  reflection-based extension.
- Per-provider PII hashing rules are enforced by the driver's transform()
  method. The PiiHasher normalizes before SHA256 (email lowercased+trimmed;
  phone E.164 digits-only; name lowercased+ASCII-folded).
- The request_payload jsonb on marketing_deliveries is encrypted at rest
  (contains hashed PII + attribution + consent snapshot). The provider config
  `config` jsonb is encrypted at rest (contains credentials). Both use the
  compliance/encryption service.

### Compliance

- **GDPR Art. 6(1)(a)** — every event carries a non-null consent_snapshot;
  capture refuses without consent; dispatch re-checks.
- **GDPR Art. 17** — TenantErased FK CASCADE + UserErased subject_id-nulling +
  provider-side deletion requests.
- **GDPR Art. 15** — subject-of-data export via the compliance module includes
  marketing event history + dispatched identifiers.
- **GDPR Art. 28** — DPAs referenced for all 9 providers; tenant admin
  acknowledges before saving.
- **CCPA §1798.135** — "Do Not Sell My Personal Information" honoured via the
  `advertising` consent category.
- **iOS ATT Framework** — server-side capture is the mitigation for
  AppTrackingTransparency limitations.
- **SOC 2 CC6.1** — credentials encrypted at rest; access to view unredacted
  config restricted to owner + admin.
- **SOC 2 CC7.2** — MarketingProviderCircuitBreakerOpened +
  MarketingDeadLetterCreated are P1 signals; every fire pages on-call.
- **PCI-DSS 3.4** — no PAN / CVV / expiry / cardholder name on any marketing
  row. `value_amount_cents` is a currency amount only.
- **CAN-SPAM Section 5** — every marketing communication carries the tenant's
  unsubscribe URL.
