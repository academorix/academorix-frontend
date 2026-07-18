# academorix/audit

Compliance-grade audit trail for Academorix. Thin wrapper around
`owen-it/laravel-auditing ^13.0` that layers our conventions on top:

- **Tenant scoping via `BelongsToTenantOptional`** — system-plane audits
  legitimately carry `tenant_id = NULL`; tenant-plane audits auto-fill from the
  resolved tenant context.
- **KMS envelope encryption at rest** — fields flagged by
  `#[Auditable(encryptFields: [...])]` are transparently ciphered by the
  `EncryptedAuditValueCast` on write and deciphered on read.
- **Optional tamper-evident hash chain** — each audit row's `chain_hash` is a
  SHA-512 of the row's canonical serialisation + the previous row's
  `chain_hash`. The `VerifyAuditChainJob` walks the chain and emits
  `AuditChainBroken` on the first mismatch.
- **365d hot + 2555d cold retention** — the hot phase lives in Postgres; older
  audits rotate to S3 Glacier (or the platform's configured cold driver) with
  Object Lock. Anonymise-not-delete on the 7y boundary.

Distinct from `academorix/activity` (tenant-facing product feed, tier-based
short retention). Audits are compliance evidence; Activity is UX telemetry.

## Aggregate

| Aggregate | ULID prefix | Table    | Purpose                                                                                                                                            |
| --------- | ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Audit`   | `aud_`      | `audits` | Extends owen-it's `OwenIt\Auditing\Models\Audit`. Adds `tenant_id`, `chain_hash`, `chain_verified_at`, `metadata` columns to the vendor row shape. |

## Install

```bash
composer require academorix/audit
```

## Making a model auditable

Compose `HasAudit` on the model and mark the class with `#[Auditable]`:

```php
use Academorix\Audit\Attributes\Auditable;
use Academorix\Audit\Concerns\HasAudit;

#[Auditable(encryptFields: ['ssn', 'medical_notes'])]
final class Athlete extends Model
{
    use HasAudit;
}
```

- `HasAudit` composes owen-it's `Auditable` trait + registers the
  `EncryptedAuditValueCast` for the fields in `encryptFields`.
- The `AuditableDiscoveryBootstrapper` scans `#[Auditable]` classes at boot and
  registers their encrypt-field lists with the shared `AuditRegistryInterface`.

## Contributes

- **Contracts (framework-swappable)**: `AuditRegistryInterface`,
  `AuditChainVerifierInterface`, `KmsCipherInterface`. Default `Null*` and
  `Default*` implementations ship — consumer apps bind a real KMS-backed cipher.
- **Permissions**: `AuditPermission` — tenant DPO read surface + platform admin
  chain verification + DSAR export.
- **Commands**: `audit:describe`, `audit:verify-chain`, `audit:export-dsar`,
  `audit:cold-rotate`.
- **Events (3)**: `AuditRecorded`, `AuditChainVerified`, `AuditChainBroken`.
- **Cast**: `EncryptedAuditValueCast` — transparent KMS envelope encryption for
  fields flagged by `#[Auditable(encryptFields: [...])]`.
- **Jobs (4)**: `RotateAuditColdStorageJob`, `VerifyAuditChainJob`,
  `KmsEncryptAuditFieldsJob`, `ExportAuditForDsarJob`.

## Chain verification

```bash
# Verify every tenant's chain.
php artisan audit:verify-chain

# Verify a single tenant.
php artisan audit:verify-chain --tenant=ten_01H...

# Under the hood — dispatches VerifyAuditChainJob to the queue.
```

Broken chains raise `AuditChainBrokenException` and emit `AuditChainBroken` —
platform staff triage via `platform.audit.verify-chain`.

## DSAR export

```bash
# Export every audit row referencing a subject across a date window.
php artisan audit:export-dsar usr_01H... --from=2024-01-01 --to=2024-12-31 --format=json
```

Dispatches `ExportAuditForDsarJob` on the `compliance` queue. The bundle lands
via the storage module's signed URL surface (out of this module's scope).

## Tests

```bash
composer install
vendor/bin/pest
```
