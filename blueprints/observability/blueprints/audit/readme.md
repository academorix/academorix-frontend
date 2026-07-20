# audit

The compliance-grade audit lane. The canonical answer to **"who did what,
when?"** — field-level diff records of every mutating operation across every
module, immutable after write, retained 7 years by default (10 with the
Enterprise `audit_retention_extended` entitlement), consumed by regulators,
DPOs, and compliance officers.

Priority: 14 (Wave 6 observability foundation, downstream of `foundation` +
`tenancy` + `application` + `user` + `entitlements` + `compliance`, upstream of
every domain module that composes the vendor `Auditable` trait). Zero direct
consumers — the module is passively integrated by adding the vendor trait to a
domain model.

## 1. Why this module exists

Audit is one of the two **observability signals** codified in
`hierarchy.md` §11 and `growth-and-observability.md` (Lane 2). The other is
**Activity** — the human-readable UX feed. They are never merged, never share a
row, never share a retention policy. Audit answers a regulator's question;
Activity answers an end-user's question.

Concrete failure modes when audit is missing or leaky:

- **A tenant fires a coach and disputes the termination reason.** Without an
  audit trail with immutable-after-write field-level diffs, there's no
  defensible record of what the tenant's roster looked like before + after the
  decision.
- **A minor's parental-consent record changes and the parent asks for proof of
  what was consented to on a specific date.** Audit is the primary evidence
  under GDPR Art. 7(1).
- **A payment record is edited and the tenant claims a refund was already
  issued.** SOX §404 requires 7-year retention of financial mutation records.
- **A HIPAA-covered entity reads a PHI-adjacent record and the DPO needs the
  access log.** HIPAA Security Rule 45 CFR §164.312(b) requires audit controls
  for PHI.

`observability::audit` is the AUTHORITATIVE compliance signal. Every mutating
operation across every module — created / updated / deleted / restored /
custom event — writes an audit row. The row survives a rolled-back transaction
by design; the audit trail records the ATTEMPT, not just success.

## 2. Scope — the two entities

| Entity                  | ULID (reserved) | Role                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Audit`                 | `aud_` (Wave 7+) | Vendor-adapted `audits` table. Immutable after write. Primary key stays bigint (vendor default; no ULID conversion in Wave 6). Wraps `owen-it/laravel-auditing`'s row shape and adds `tenant_id NOT NULL` + `application_id NULLABLE` + composite indexes. Consumed by compliance dashboards + DSAR orchestrator + regulator exports.       |
| `AuditRetentionPolicy`  | `arp_`          | Per-tenant retention override. One active policy per tenant (partial unique on `deleted_at IS NULL`). Requires `audit_retention_extended` entitlement to create. Stores `retention_years` (1-10), `override_reason` (regulator request / lawsuit hold / HIPAA compliance), `override_starts_at`, `override_ends_at` (NULL = indefinite). |

Compare to `activity`: audit carries FIELD-LEVEL DIFFS suitable for a
regulator (immutable, indexable, exportable). Activity carries
HUMAN-READABLE FEED LINES suitable for an end-user product surface. Same
mutation → two distinct rows in two distinct stores (see hierarchy.md §11).

## 3. Vendor adaptation

The module wraps `owen-it/laravel-auditing` (^13.0). The vendor package ships:

- `Auditable` trait — composed onto Eloquent models
- `AuditableObserver` — writes an `audits` row on save/delete/restore/custom
- `Audit` model — reads the vendor `audits` table
- Migration for the `audits` table with bigint PK + polymorphic auditable +
  polymorphic user + JSON `old_values`/`new_values`

Our extensions (this module's job):

1. **Add `tenant_id UUID NOT NULL`** — with a composite index
   `(tenant_id, created_at DESC)` for the primary tenant-dashboard read path.
2. **Add `application_id UUID NULLABLE`** — NULL = platform-plane audit; index
   `(application_id, tenant_id, created_at DESC)` for cross-tenant platform
   queries.
3. **Add four more composite indexes** —
   `(auditable_type, auditable_id, created_at DESC)`,
   `(user_type, user_id, created_at DESC)`,
   `(event, tenant_id, created_at DESC)`,
   `(tenant_id, auditable_type, created_at DESC)`.
4. **Wrap the vendor `Audit` model** — our `Academorix\Observability\Audit\Models\Audit`
   composes the `BelongsToTenant` trait (global scope + auto-fill), casts
   `event` to `AuditEventType`, and forbids updates via `AuditObserver`.
5. **`TenantIdBackfiller`** — one-shot migration helper that scans existing
   vendor rows, extracts `new_values.tenant_id` (or `old_values.tenant_id` for
   deletion rows), and populates the new column in batches.
6. **`audit.enforce_read_only` middleware** — refuses non-GET methods on every
   `/audits` route (defense-in-depth against a rogue caller reaching a
   soft-delete route).
7. **`AuditRetentionPolicy` aggregate** — a new table + model + observer +
   policy, entirely owned by this module (no vendor equivalent).
8. **`PurgeExpiredAuditsJob`** — nightly per-tenant purge honoring the active
   retention policy.

The primary key stays bigint. Converting the entire vendor schema to ULIDs
would require forking the vendor package + re-keying every existing customer's
audit history. The `aud_` prefix is reserved in
`modules/foundation/data/ulid-prefixes.json` for a Wave 7+ redesign.

## 4. Consent gate — deliberately absent

Audit does NOT run through `ConsentGate`. Audit is COMPLIANCE evidence, not
behavioral tracking. A regulator's Art. 30 record of processing requirement
does not evaporate because the subject withdrew consent to marketing — the
mutation happened; the record of the mutation is retained for the statutory
window.

This is the load-bearing difference from `analytics` + `marketing`:

- **Analytics + marketing** — consent-gated at capture + dispatch. Subject
  withdraws → future events suppressed. Retention 2y / 7y respectively.
- **Audit** — never gated. Every mutation is logged, every subject. Retention
  7y baseline (10y extended). Erasure (GDPR Art. 17) does NOT delete the audit
  row; it redacts the `new_values`/`old_values` diff to a hash while preserving
  the fact-of-mutation record for regulators.

The redaction path is owned by the `compliance` module's `UserErased` cascade,
which invokes `AuditRedactionListener` (subscribed here) to write a `redacted`
metadata flag on the affected audit rows without deleting them.

## 5. Retention — 7 years baseline, 10 years max

- **Default retention** — 7 years from `created_at`. Aligned with SOX §404 +
  IRS records-retention windows + HIPAA §164.316(b)(2)(i).
- **Extended retention (Enterprise)** — `audit_retention_extended` entitlement
  raises the ceiling to 10 years. Tenants create an `AuditRetentionPolicy` with
  `retention_years=10` + `override_reason` (regulator request / lawsuit hold /
  HIPAA compliance) + `override_starts_at` + optional `override_ends_at`.
- **Hot-tier storage** — first 90 days retained in the primary Postgres
  `audits` table. Beyond 90 days, `ExportAuditsToArchiveJob` writes each
  tenant's audit rows to a jsonl file in an S3 archive bucket
  (`AUDIT_ARCHIVE_S3_BUCKET`) and prunes them from the hot table (Enterprise
  only — Small + Medium keep everything hot until purge).
- **Purge** — `PurgeExpiredAuditsJob` runs nightly, per tenant, honoring the
  active retention policy. Purged rows write a summary meta-audit
  (`audit.purged { tenant_id, cutoff_at, row_count }`) so the audit trail
  records itself being purged.
- **TenantErased** — audit rows for that tenant migrate to a compliance
  archive (NOT cascade-deleted — regulators may need proof of erasure years
  later). Handled by `PurgeAuditDataForErasedTenantHook`.

## 6. The consumer contract

Modules opt in by adding the vendor `Auditable` trait to their Eloquent
models:

```php
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

final class Membership extends Model implements AuditableContract
{
    use Auditable;

    // ... normal model definition
}
```

That's the whole contract. The vendor observer captures create/update/delete
via Eloquent's model events. The `AuditObserver` in this module (attached to
`Academorix\Observability\Audit\Models\Audit`) refuses:

- **Create with null `tenant_id`** — defense-in-depth against vendor drift.
- **Every update** — the observer's `updating` handler throws
  `NOTIFICATIONS_AUDIT_ROW_IMMUTABLE` (422).
- **Delete outside the purge job actor** — the `deleting` handler refuses
  unless the caller is the `PurgeExpiredAuditsJob` service account.

## 7. Entitlements consumed

Four entitlements sourced from the `entitlements` module.

| Key                            | Kind    | Default caps                                                                                             |
| ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| `audit_capture`                | boolean | free: true, small: true, medium: true, enterprise: true — module master gate, ON for every tenant.       |
| `audit_export`                 | boolean | free: false, small: false, medium: true, enterprise: true — self-service DSAR / regulator export.        |
| `audit_retention_extended`     | boolean | free: false, small: false, medium: false, enterprise: true — create `AuditRetentionPolicy` up to 10y.    |
| `audit_regulator_export`       | boolean | free: false, small: false, medium: false, enterprise: true — regulator-shaped cross-application export.  |

Note: `audit_capture` is ON for every tier because audit is a compliance
requirement, not a product feature. The entitlement exists as an emergency kill
switch (paired with the `audit.capture` feature flag).

## 8. Compliance evidence

Primary control points:

- **GDPR Art. 5(1)(f)** integrity + confidentiality — audit is the primary
  evidence of integrity.
- **GDPR Art. 30** records of processing — audit satisfies the record
  requirement for every mutation.
- **SOX §404** financial-mutation records retained 7 years.
- **HIPAA §164.312(b)** audit controls required for PHI mutations.
- **PCI-DSS Requirement 10** — audit trails for all cardholder-data access.
- **ISO 27001 A.12.4** — event logging control.
- **SOC 2 CC7.1** — logs required for detecting anomalies.
- **CCPA §1798.185** — records-retention rules for consumer requests.

Full mapping in `compliance.json`.

## 9. What this module does NOT do

- **No writes over HTTP** — capture is exclusively via the vendor `Auditable`
  trait. There is NO `POST /api/v1/audits`. The consumer contract is: add the
  trait, save your model, the audit row appears.
- **No custom event definition surface** — vendor
  `Auditable::registerAuditableTransition` is the extension point. Modules
  register custom events at that seam, not on our resources.
- **No PII redaction in `old_values`/`new_values` by default** — regulators
  need full context to reconstruct what actually changed. Tenants can opt in
  via `config.audit.redact_pii_in_old_new_values=true`, which invokes a
  registered `PiiRedactor` on the diff blobs at save time.
- **No cross-tenant reads without platform-admin role** — even
  `AuditPolicy::view` refuses when `audit.tenant_id !== auth.tenant_id`, with
  a `Gate::before` bypass only for the `platform_admin` guard.
- **No ML-based anomaly detection** — this is storage + query + retention only.
  Anomaly detection lives in `security-monitoring` (planned Wave 7).
- **No log aggregation from external systems** — audits capture OUR
  mutations, not third-party events. Third-party integrations (e.g., Stripe
  webhooks) create OUR mutations; the mutation record is what gets audited.
- **No consent gate** — see §4. Audit is compliance evidence, never
  consent-gated.
- **No `application_id` shortcut on domain rows** — the audit row itself
  carries `application_id` per `tenancy-columns.md` §2 (audits is one of the 8
  named row types). Every OTHER row cascades through `tenant_id`.
- **No ULID conversion on `audits.id` in Wave 6** — see §3 above.

## 10. Wire projection

Every audit read is a normal REST envelope
(`GET /api/v1/audits/{audit}` → `{ data: Audit }`). Export requests are
async — `POST /api/v1/audits/export` returns 202 with an `audit_export_id`;
the consumer polls `GET /api/v1/audits/exports/{export}` or waits for the
`AuditExportReadyNotification` in-app notification. The export payload is
a signed S3 URL (24h expiry) to a jsonl file.

## Related steering

- `.kiro/steering/growth-and-observability.md` — the five-lane model
  (monitoring / audit / activity / analytics / marketing). Audit is Lane 2.
- `.kiro/steering/tenancy-columns.md` §3 — `tenant_id` mandate + the audit
  gap register. §9 — living gap register (this module CLOSES the audit gap).
- `.kiro/steering/hierarchy.md` §11 — the audit-vs-activity two-signal split.
- `.kiro/steering/package-conventions.md` — the config trio + trait
  composition patterns.
- `modules/observability/blueprints/activity/` — sibling lane 3 module
  (human-readable feed, `spatie/laravel-activitylog` vendor).
- `modules/observability/blueprints/monitoring/` — sibling lane 1 module
  (system health signals).

## ULID prefixes registered

- `aud_` → `Audit` (RESERVED — Wave 7+ redesign; primary key stays bigint in
  Wave 6 per the vendor default)
- `arp_` → `AuditRetentionPolicy` (owned + used from day 1)
