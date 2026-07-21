# compliance

Cross-cutting compliance substrate. The **only** canonical orchestrator for GDPR
/ CCPA data-subject rights, consent evidence, retention execution, legal-hold
policy, subprocessor / VPC registry, minor safeguarding reporting, and
breach-notification workflow. Every other module is a **contributor** via
events + attributes; nothing else runs a retention sweep or assembles a DSAR
bundle.

Priority: 30 (Wave 5). Depends on `foundation`, `tenants`, `audit`, `activity`,
`storage`, `entitlements`, `notifications`, `notifications-mail`.

## 1. Why this module exists

Compliance is inherently **cross-module**. Every domain module (user, storage,
activity, subscription, sports, ...) stores rows about subjects; none of them
can answer "give me everything about subject X" on their own without a
coordinator. Three concrete failure modes when compliance work is spread across
modules:

- **Retention runs uncoordinated.** Every module ships its own `retention.json`,
  but nothing reads them together, respects a cross-module legal hold, or
  reconciles tenant-tier overrides. Each module runs its own sweep; a subject
  with a litigation freeze on their User row still gets their storage::File rows
  purged because storage didn't check. That's a compliance violation.
- **DSAR is a coordinator or nothing.** GDPR Art. 15 (access) requires one
  bundle across every column that stores subject data. Filing 12 separate export
  tickets per module is not "complying"; it's "half-complying and hoping the
  auditor doesn't notice".
- **Consent is a shared vocabulary.** Marketing wants to know if a subject
  consented to marketing. Newsletter wants the same. Analytics wants the same.
  AI wants ai-training consent. If each module owns its own consent bits, they
  drift.

Compliance sits above every domain module and stitches them together via
attribute-discovered contributors + one canonical retention runner + one
canonical consent gate.

## 2. Scope — the eight entities

| Entity                 | ULID   | Role                                                                                                                                |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ConsentCategory`      | `ccg_` | The catalogue: essential / functional / marketing / analytics / ai_training / minor_parental. Platform defaults + tenant overrides. |
| `ConsentRecord`        | `cns_` | Immutable subject × category × decision snapshot. Withdrawal writes a new row.                                                      |
| `Dsar`                 | `dsr_` | Data-subject-request state machine: received → triaging → collecting → assembling → delivered                                       | rejected. |
| `DsarArtefact`         | `dsa_` | Per-module contribution to a DSAR bundle. Points at a storage::File.                                                                |
| `LegalHold`            | `lhd_` | Freezes retention on a subject / tenant / case / class scope.                                                                       |
| `RetentionRun`         | `rtr_` | Audit trail of every retention sweep. What was purged, held, anonymised, per tenant.                                                |
| `Subprocessor`         | `spr_` | Versioned VPC / DPA registry. Renders the public Trust Center feed.                                                                 |
| `SafeguardingIncident` | `sfi_` | Minor-safeguarding report inbox. Domain-driven, not diff-driven.                                                                    |

Compliance does NOT own audit (that's `audit`), activity feed (that's
`activity`), or safeguarding case management (a future `safeguarding` module).
This module is the orchestration seam, not the domain surface for every
regulated concern.

## 3. Consent architecture

Consent is **per-subject × per-category × timestamp**. Every state change is a
NEW row. Never mutate. The current decision is the latest row per (subject,
category).

```
subject                 category         decision      created_at
─────────────────────   ──────────────   ───────────   ──────────
User#01H...             marketing        granted       2026-01-15
User#01H...             marketing        withdrawn     2026-05-20   ← current
User#01H...             ai_training      granted       2026-01-15   ← current
```

**Reading is a facade call**:

```php
if (! ConsentGate::has($user, 'marketing')) return;
```

Cached in Redis (5m TTL, invalidated on ConsentGiven / ConsentWithdrawn). Every
check is a hash-map lookup.

**Writing** goes through the ConsentRecord model — the observer refuses mutation
on every column except `metadata` (append-only). Withdrawal is a new row with
`decision=withdrawn`. The `#[ConsentRequired]` attribute lets you gate a method
or job at declaration time instead of scattering `ConsentGate::has()` calls
throughout the codebase:

```php
#[ConsentRequired(category: 'marketing', subject: 'recipient')]
final class SendMarketingEmailJob { /* ... */ }
```

**Minor consent**. When a ConsentCategory has `requires_guardian=true`, every
ConsentRecord for that category must carry a companion `guardian_user_id` +
evidence (verification method + timestamp). Enforced by
ConsentRecordObserver.creating.

## 4. DSAR orchestration

DSAR (Data Subject Access Request) is a state machine. One `Dsar` row per
request; multiple `DsarArtefact` rows (one per contributing module).

```
received ──▶ triaging ──▶ collecting ──▶ assembling ──▶ delivered
    │           │             │              │
    ▼           ▼             ▼              ▼
        (any state) ──▶ rejected
```

Actions (GDPR articles): `export` (Art. 15 + 20), `erase` (Art. 17), `rectify`
(Art. 16), `restrict` (Art. 18).

**Contributor discovery**. The `DsarOrchestrator` scans classes annotated with
`#[DsarExportable]` / `#[DsarErasable]` at boot. Each contributor implements
`Stackra\Compliance\Contracts\DsarContributor`:

```php
#[DsarExportable(subject: 'owner_id', exclude: ['password_hash', 'mfa_secret'])]
#[DsarErasable(subject: 'owner_id', strategy: 'anonymize', on_legal_hold: 'skip')]
final class User extends Model { /* ... */ }
```

**Flow** (via the `DsarRunnerJob`):

1. `Dsar.state=received`. Platform-admin triage sets `state=triaging` + verifies
   subject identity (out-of-band, tracked in `verified_at`).
2. Approval → `state=collecting`. `DsarRunnerJob` dispatches
   `DsarCollectFromModuleJob` per registered contributor. Each writes a
   `DsarArtefact` row with `file_id` = the storage::File for its chunk.
3. Every contributor done → `state=assembling`. `DsarAssembleArchiveJob` packs
   every artefact file into a single ZIP + writes a manifest.
4. Assembly complete → `state=delivered`. `DsarDeliverJob` sends a signed-URL
   email to the subject via `DsarDeliveredNotification`. The signed URL
   redemption route lives on the central host.

**SLA**. GDPR baseline is 30 days. Extension up to 60 additional days for
complex requests, communicated within the first month. Enterprise contracts
negotiate; overrides in `tenancy::TenantSetting.compliance.dsar_sla_days`.

## 5. Retention runner

`RetentionRunner` is the **only** canonical purge orchestrator. Every module
declares its per-entity retention windows in `modules/<name>/retention.json`.
The runner reads them all + respects `LegalHold` + applies tenant-tier
overrides + writes a `RetentionRun` row per sweep.

**Schedule**. Nightly at 03:00 tenant-local time. Long tenancies partitioned
into hourly slots to avoid a thundering herd on the compliance-mail +
notifications-mail queue.

**Legal hold precedence**. `LegalHoldGate::isHeld($subject, $context)`
short-circuits every purge candidate. Held rows count in the
`RetentionRun.held_count` column but are never touched.

**Outcomes** written per row: `purged`, `anonymized`, `archived`, `held`,
`skipped_policy`, `failed`.

## 6. Legal hold policy

`LegalHold` overrides normal retention. Applied at four scopes:

- `subject` — single subject id. Blocks their DSAR erasure + retention purges.
- `tenant` — entire tenant. Blocks retention runner + tenant- erasure cascade.
- `case` — records tagged with `case_ref`. Flexible, driven by litigation case
  number.
- `class` — an entire model class. Rare, for regulatory inquiries requiring
  full-table freeze.

**Two-person approval**. Applying a hold requires `applied_by_user_id` +
`approved_by_user_id`. Enforced by `LegalHoldObserver.creating`.

**Duration**. Explicit `expires_at` required unless authorised by super_admin.
Auto-release via `ExpireLegalHoldsJob` when expired.

## 7. Subprocessor / VPC registry

`Subprocessor` is the versioned catalogue of every third party that receives
subject data. Every material change (new region, new data class, new purpose)
writes a new version row + fires `SubprocessorUpdated`. Historical versions
immutable.

**Public feed**. Rendered at `GET /compliance/subprocessors.json` and
`GET /compliance/subprocessors.pdf` by the `SubprocessorFeedRenderer`.
Cache-Control 1h. Every change dispatches `SubprocessorChangedNotification` to
every tenant's DPO `TenantContact`.

## 8. Safeguarding incidents

Minor-safeguarding reports (concerns about a minor's welfare). Distinct from
`audit` (diff-driven) and `activity` (user-visible feed). Reports land in a
triaged inbox with severity-based escalation SLAs.

| Severity | SLA             | Notes                                                                         |
| -------- | --------------- | ----------------------------------------------------------------------------- |
| info     | none            | Observation, no action needed.                                                |
| concern  | 5 business days | Single flag; review + close_no_action OR escalate.                            |
| urgent   | 24h             | Multiple flags OR keyword match; investigate.                                 |
| critical | 1h              | Immediate risk; escalate to tenant safeguarding officer + external authority. |

**External referrals**. Compliance NEVER contacts external authorities
automatically. Critical incidents surface a `pending_external_referral` flag;
the tenant's designated safeguarding lead completes the referral out-of-band +
records the referral reference in the incident row.

## 9. Breach detection pipeline

Compliance is a **signal aggregator**, not a primary detector. Subscribes to:

- `storage::FileVirusFound` — malware in a tenant's storage.
- `audit::UnusualMassExport` (future) — anomalous export pattern in the audit
  log.
- `tenancy::ImpossibleTravel` (future, from Auth once Identity lands) —
  geographically-impossible login sequence.
- `notifications::HighBounceRate` (future) — abused email address.

Signals aggregate into `BreachDetected` events feeding the platform-admin breach
dashboard. GDPR Art. 33 supervisory-authority notification within 72h + Art. 34
subject notification without undue delay are workflow steps, NOT automated
actions — the platform-admin dashboard requires human approval before
`SendBreachNotificationJob` dispatches.

## 10. Entitlements consumed

Three entitlements sourced from the `entitlements` module.

| Key                               | Kind           | Default caps                                            |
| --------------------------------- | -------------- | ------------------------------------------------------- |
| `compliance.dsars.month`          | pool (monthly) | free: 1, team: 10, business: 100, enterprise: unlimited |
| `compliance.legal-holds.max`      | slot           | free: 0, team: 3, business: 25, enterprise: unlimited   |
| `compliance.retention-runs.month` | pool (monthly) | free: 0, team: 1, business: 12, enterprise: unlimited   |

DSAR quota consumed at submission. Legal-hold slot consumed at apply.
Retention-run quota consumed at manual dispatch (nightly automatic sweeps do NOT
count against the quota — they're a platform obligation).

## 11. Wire projection

Every DSAR completion emits a versioned wire event (`compliance.dsar.completed`
/ v1) that downstream services can consume via the `webhook` module. Sample:

```json
{
  "event": "compliance.dsar.completed",
  "version": "v1",
  "occurred_at": "2026-07-14T03:15:07Z",
  "data": {
    "dsar_id": "dsr_01H...",
    "tenant_id": "ten_01H...",
    "subject": { "type": "user", "id": "usr_01H..." },
    "action": "export",
    "sla_days": 30,
    "delivered_at": "2026-07-14T03:15:07Z",
    "artefact_count": 8,
    "artefact_download_url": "https://api.stackra.app/compliance/dsars/<signature>",
    "artefact_expires_at": "2026-08-13T03:15:07Z"
  }
}
```

Actual byte inclusion in the artefact is per contributor — the DSAR manifest
inside the ZIP enumerates every module's contribution (module name, entity, row
count, redacted columns, artefact format).

## 12. What this module does NOT do

- **Does not detect breaches directly.** Signals come from other modules.
- **Does not implement encryption at rest.** That's platform infra.
- **Does not manage safeguarding cases.** Incidents are triaged + closed; full
  case management (interviews, evidence bundles, external referral
  correspondence) is a future `safeguarding` module's job.
- **Does not send subject-facing breach notifications automatically.** Requires
  human approval in the platform-admin dashboard first.
- **Does not run per-module retention.** Every module still declares its
  `retention.json`; the runner reads them ALL from one place. Modules don't run
  their own sweeps.
- **Does not own audit or activity.** Reads from them for DSAR export; never
  writes.
- **Does not seed subprocessor rows for third parties this deployment isn't
  using.** Only vendors actually configured for the deployment land in the
  registry.
- **Does not gate every request through consent.** The `#[ConsentRequired]`
  attribute or explicit `ConsentGate::has()` calls opt in — the middleware is
  not a global before-hook.

## Related steering

- `.kiro/steering/tenancy-columns.md` — every entity is tenant-scoped.
- `.kiro/steering/hierarchy.md` — where compliance sits in the platform tree
  (Wave 5).
- `.kiro/steering/priority-ordering.md` — why priority=30.
- `.kiro/steering/module-graph.md` — cross-module dependency invariants.
- `.kiro/steering/ulid-prefix-registry.md` — the eight prefixes registered here
  (`ccg_`, `cns_`, `dsr_`, `dsa_`, `lhd_`, `rtr_`, `spr_`, `sfi_`).
