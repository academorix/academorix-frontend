# audit

Compliance-grade audit trail. Wave 2 infrastructure. Wraps
`owen-it/laravel-auditing` with our conventions.

## 1. What this module owns

| Concern                                  | Owned artefact                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `HasAudit` trait (opt-in)                | aliases owen-it's `Auditable` interface + `Auditable` trait bundle                                          |
| `Audit` model extending owen-it's        | adds `BelongsToTenantOptional`, `HasUlids` prefix `aud_`, KMS-encrypted values, optional hash-chain columns |
| `#[Auditable]` attribute                 | build-time discovery of opting-in models                                                                    |
| Platform-admin HTTP surface              | `GET /api/v1/platform/audits` — support incident review + DSAR                                              |
| Tenant DPO HTTP surface                  | `GET /api/v1/audits` — filtered to tenant + sensitive fields masked                                         |
| Tamper-evident chain (enterprise)        | Optional per-row `previous_hash` + `row_hash` columns for chain integrity                                   |
| KMS encryption of restricted-tier values | `EncryptedAuditValueCast` on old_values / new_values                                                        |

## 2. Audit vs Activity

Two adjacent but **distinct** modules — see the comparison table in
`modules/activity/readme.md`.

Quick differentiator:

- **Activity** = "what happened today?" (product feed, tenant admins + users,
  tier-based retention 30/90/365d, hard delete past window).
- **Audit** = "prove what happened + who caused it" (compliance evidence,
  platform admins + regulators, 365d hot + 7y cold, anonymise-not-delete).

A single model can be both `#[LoggableActivity]` AND `#[Auditable]`. Fine — they
serve different audiences and don't conflict.

## 3. Opting a model in

```php
use Academorix\Audit\Concerns\HasAudit;
use Academorix\Audit\Attributes\Auditable;

#[Auditable(events: ['created', 'updated', 'deleted', 'restored'])]
class Permission extends Model
{
    use HasAudit;

    /** @var array<int, string> Encrypted field values in old/new. Restricted-tier per data-classes.json. */
    protected array $auditEncrypted = ['api_key', 'signing_secret'];

    /** @var array<int, string> Fields exempt from auditing. */
    protected array $auditExclude = ['updated_at'];
}
```

`HasAudit` sets sane defaults: audits every `created` / `updated` / `deleted` /
`restored` event via owen-it, respects our `auditEncrypted` array for
KMS-encryption of specific fields, respects `auditExclude` array.

## 4. Retention

Enterprise-heavy. Fixed windows independent of plan:

| Phase | Days       | Storage                                                 | Encryption                                         |
| ----- | ---------- | ------------------------------------------------------- | -------------------------------------------------- |
| Hot   | 0 – 365    | Primary Postgres                                        | KMS for restricted fields                          |
| Cold  | 366 – 2555 | Object storage (S3) with Glacier lifecycle              | KMS envelope re-encryption + immutable object lock |
| Purge | > 2555     | Anonymise-not-delete: retain row shape, hash PII fields | KMS                                                |

Cold rotation runs monthly via `RotateAuditColdStorageJob`. Cold rows still
queryable via a light view but with 24h latency (S3 restore).

## 5. Tamper-evident chain (enterprise)

Optional per-row hash chain. When enabled (`audit.tamper_evident_chain`
entitlement):

- Each new row computes
  `row_hash = SHA-256(id + auditable_type + auditable_id + event + old_values + new_values + created_at + previous_hash)`.
- Chain verification job runs weekly + on demand via `audit:verify-chain`.
- `AuditChainBroken` event fires + notifies compliance team on any break.

Not tamper-**proof** (root DB access can rewrite everything), but
tamper-**evident** (any modification changes downstream hashes).

## 6. Files

Standard blueprint. No custom entity schema beyond extending owen-it's `audits`
table.

## 7. What this module does NOT do

- **Not a Postgres CDC / WAL surface.** Read our audit rows, not the DB
  write-ahead log.
- **Not a real-time stream.** Audits are batched afterCommit; ~seconds of
  latency to visibility.
- **Not exposed to end users.** Tenant DPO surface exists but is masked +
  rate-limited.
