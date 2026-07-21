# audit — changelog

Every change to this module lands here in reverse-chronological order. Follow
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) semantics + tag every
change with its wave / spec / ADR reference.

## Unreleased

Nothing yet.

## v0.1.0 — inaugural release (Wave 6)

### Added

- **Module scaffold** — `modules/observability/blueprints/audit/` created
  following the sibling `growth::analytics` + `growth::marketing` blueprint
  shape (both are provider-fan-out modules; audit is a vendor-adapter with
  read-only surface, so it has fewer moving parts but keeps the same manifest
  taxonomy). Priority 14 (Wave 6, downstream of `foundation`, `tenancy`,
  `application`, `user`, `entitlements`, `compliance`).
- **Two owned entities**:
  - `Audit` — vendor-adapted `owen-it/laravel-auditing` row. Primary key stays
    bigint (vendor default; no ULID conversion in Wave 6). Extended with
    `tenant_id UUID NOT NULL` + `application_id UUID NULLABLE` + five composite
    indexes. Wrapped by our `Stackra\Observability\Audit\Models\Audit` which
    composes `BelongsToTenant` (global scope + auto-fill).
  - `AuditRetentionPolicy` (`arp_`) — per-tenant retention override.
    Enterprise-only (via `audit_retention_extended` entitlement).
    `retention_years` in [1..10]. `override_reason` free-text with a shape
    validator. `override_ends_at` nullable (NULL = indefinite).
- **Vendor adaptation**:
  - Add-column migration for `audits.tenant_id UUID NOT NULL` +
    `audits.application_id UUID NULLABLE`.
  - Composite indexes: `(tenant_id, created_at DESC)`,
    `(application_id, tenant_id, created_at DESC)`,
    `(auditable_type, auditable_id, created_at DESC)`,
    `(user_type, user_id, created_at DESC)`,
    `(event, tenant_id, created_at DESC)`,
    `(tenant_id, auditable_type, created_at DESC)`.
  - `TenantIdBackfiller` service that reads `new_values.tenant_id` (fallback to
    `old_values.tenant_id` for deletion rows) and writes the new column in
    10k-row batches. Delivered via `audit:backfill-tenant-id` one-shot console
    command.
  - `audit.enforce_read_only` middleware — refuses non-GET methods on every
    `/audits` route as defense-in-depth against a rogue route registration.
- **Read-only HTTP surface**:
  - Tenant plane: `GET /api/v1/audits` (list with filters:
    `user_id / auditable_type / auditable_id / event / since / until`),
    `GET /api/v1/audits/{audit}`,
    `GET /api/v1/audits/by-entity/{auditable_type}/{auditable_id}`,
    `GET /api/v1/audits/by-user/{user}`, `POST /api/v1/audits/export` (async →
    notification when ready), `GET /api/v1/audits/exports`,
    `GET /api/v1/audits/exports/{export}`.
  - Retention policy: `GET/POST /api/v1/audit-retention-policies`,
    `PATCH/DELETE /api/v1/audit-retention-policies/{policy}`.
  - Platform plane: `GET /api/v1/platform/audits`,
    `POST /api/v1/platform/audits/export` (regulator-issued cross-tenant read +
    export).
- **Event catalogue** — 6 published events:
  - `AuditRecorded` — fires on every vendor audit insert (afterCommit).
    Subscribed for downstream compliance signals only; NEVER used to mutate
    audit data.
  - `AuditRetentionPolicyCreated` / `AuditRetentionPolicyUpdated`.
  - `AuditRetentionExtensionExpired` — nightly job triggers when
    `override_ends_at` reaches.
  - `AuditPurgeExecuted` — per-tenant purge run; writes a summary meta-audit so
    the trail records itself being purged.
  - `AuditExportRequested` — DSAR / regulator export request initiated.
- **Async surface** — 5 queued jobs:
  - `BackfillAuditTenantIdFromJsonbJob` — one-shot on module install.
  - `PurgeExpiredAuditsJob` — nightly per-tenant, honors active policy.
  - `ExpireRetentionOverridesJob` — nightly, resets to 7y default when
    `override_ends_at` elapses.
  - `ExportAuditsToArchiveJob` — weekly, writes rows past 90d hot window to S3
    archive (Enterprise `audit_capture_advanced` implicit).
  - `GenerateComplianceReportJob` — monthly, regulator-shaped export.
- **Notifications** — 4 tenant + compliance-officer alerts:
  - `AuditRetentionPolicyExtendedNotification` — compliance officer notified
    when override applied.
  - `AuditRetentionExtensionExpiringSoonNotification` — 30 days before
    `override_ends_at` — advance warning.
  - `AuditPurgeCompletedNotification` — weekly digest of purge counts.
  - `AuditExportReadyNotification` — regulator export completed, signed S3 URL
    attached (24h expiry).
- **Policies**:
  - `AuditPolicy` — read-only for admin/compliance role + owner. Write NEVER
    (vendor observer is the only capture path). Delete NEVER (except via
    `PurgeExpiredAuditsJob` service actor).
  - `AuditRetentionPolicyPolicy` — CRUD by tenant admin with
    `audit_retention_extended` entitlement.
- **Observers**:
  - `AuditObserver::creating` — refuses null `tenant_id` (defense-in-depth
    against vendor drift); populates `application_id` from request context when
    caller has one; fires `AuditRecorded` afterCommit.
  - `AuditObserver::updating` — REFUSES ALL. Audit rows are immutable.
  - `AuditObserver::deleting` — refuses unless caller is the
    `PurgeExpiredAuditsJob` service account.
  - `AuditRetentionPolicyObserver::creating` — refuses without
    `audit_retention_extended` entitlement; validates `retention_years <= 10`;
    validates `override_ends_at > override_starts_at` (or NULL).
- **Commands** — 7 ops + support console commands:
  - `audit:list` (with filters:
    `--tenant / --user / --auditable / --event / --since / --until`).
  - `audit:show`.
  - `audit:count-by-tenant`.
  - `audit:backfill-tenant-id` (one-shot migration helper).
  - `audit:purge` (respects policy; `--dry-run` flag).
  - `audit:extend-retention` (creates `AuditRetentionPolicy` override).
  - `audit:export` (DSAR / regulator export).
- **Rules** — 5 validation rules:
  - `valid_retention_years` — integer in [1..10].
  - `valid_override_dates` — `starts_at < ends_at OR ends_at IS NULL`.
  - `valid_event_type` — must be one of vendor-recognized types + our
    custom_events list.
  - `valid_auditable_type_exists` — the class name must resolve at boot.
  - `valid_override_reason_shape` — non-empty string, 10-500 chars.
- **Entitlement consumption** — 4 declared entitlements: `audit_capture` (all
  tiers baseline), `audit_export` (Medium+), `audit_retention_extended`
  (Enterprise), `audit_regulator_export` (Enterprise).
- **Self-declared compliance regimes** in `compliance.json`:
  - GDPR (Art. 5(1)(f), Art. 30, Art. 17 redaction cascade).
  - SOX §404 (financial-mutation retention).
  - HIPAA Security Rule §164.312(b) (audit controls for PHI).
  - PCI-DSS Requirement 10 (audit trails for cardholder-data access).
  - ISO 27001 A.12.4 (event logging).
  - SOC 2 CC7.1 (logs for anomaly detection).
  - CCPA §1798.185 (consumer-request records-retention).
- **Field classification** in `data-classes.json` — every column across
  `audits` + `audit_retention_policies` tagged per foundation's five-tier
  taxonomy. `old_values` + `new_values` land in `restricted` (may contain raw
  PII per regulator requirement; encrypted at rest).
- **SDUI surfaces** — audit list + show + by-entity + by-user + export
  request/list + retention policy management screens.

### Notes

- **Vendor adaptation, not replacement.** The `owen-it/laravel-auditing` package
  continues to own the capture pipeline (its `Auditable` trait +
  `AuditableObserver`). This module wraps the STORAGE side of the vendor's
  contract with our tenant + application column extensions + retention surface.
  Modules add the vendor trait to their models; no other change needed.
- **Primary key stays bigint.** Vendor's bigint auto-increment ID is preserved.
  ULID conversion (via the `aud_` prefix) is deferred to a Wave 7+ redesign
  because forking the vendor package to switch key types is a large surface
  change with unclear customer-value delta today.
- **Audit is NOT consent-gated.** Compliance evidence is retained regardless of
  subject consent state. Erasure (GDPR Art. 17) REDACTS the diff blobs via the
  `compliance::UserErased` cascade, preserving the fact-of-mutation record.
  Full-row deletion happens only at retention-window expiry.
- **Immutability is enforced in three places** — vendor observer refuses update
  on its side (the vendor's `Audit` model has no `update()` seam); our
  `AuditObserver::updating` throws `NOTIFICATIONS_AUDIT_ROW_IMMUTABLE (422)`;
  the `audit.enforce_read_only` middleware refuses non-GET methods on every
  `/audits*` route.
- **Deletion is enforced in two places** — DB triggers refuse
  `DELETE FROM audits` outside a session tagged with the purge service actor;
  `AuditObserver::deleting` throws unless the caller is the purge job's service
  account.
- **`application_id` on `audits` is deliberate.** Per `tenancy-columns.md` §2,
  audits is one of the 8 named row types that carry `application_id` directly
  (NULLABLE — platform-plane audits have no application context).
- **Extension backfill is `TenantIdBackfiller`.** For customers with existing
  vendor rows written before this module lands, the one-shot
  `audit:backfill-tenant-id` command reads `new_values.tenant_id` (falls back to
  `old_values.tenant_id` for delete events) and populates the new column in
  10k-row batches. Rate-limited to avoid saturating hot-read traffic. Idempotent
  — re-running is safe.

### ULID prefixes registered (in `modules/foundation/data/ulid-prefixes.json`)

- `aud_` → `Audit` (RESERVED — Wave 7+ redesign; PK stays bigint in Wave 6)
- `arp_` → `AuditRetentionPolicy` (owned + used from day 1)

### Migration path

Green-field module for the extension + retention surface. Existing customers
whose vendor `audits` table already carries rows run
`php artisan audit:backfill-tenant-id --tenant=<slug>` (or `--all`) once after
the schema migration. The command is idempotent (skips rows where
`tenant_id IS NOT NULL`); safe to re-run.

Modules add the vendor `Auditable` trait on their own timeline. The vendor
observer degrades gracefully — a model without the trait simply never emits
audit rows.

The migration to Wave 7+ ULID conversion is BACK-COMPAT-BREAKING and will land
under a separate spec with a fork of `owen-it/laravel-auditing`; not scheduled.
