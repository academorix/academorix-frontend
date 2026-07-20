# shared/audit — Phase 3 implementation status

## Status: SUBSTANTIALLY DONE — tenant_id + chain columns landed, model + Actions + chain-verifier + DSAR export in place; retention prune pending

## What landed

### Tenancy-columns §9 P0 gap CLOSED

Migration `2026_07_15_000100_add_tenant_id_chain_to_audits_table.php` adds FOUR
columns to owen-it's default `audits` table:

- `tenant_id` (nullable — platform-plane rows carry NULL, indexed with
  `created_at` for compliance-scan hot path).
- `chain_hash` (SHA-512 hex, 128 chars — populated by observer).
- `chain_verified_at` (nullable timestamp — set by verifier).
- `metadata` (JSONB — operator notes).

### Model

- **`Audit`** — extends `OwenIt\Auditing\Models\Audit` (vendor non-final base),
  composes `BelongsToTenantOptional` (auto-fills on save; leaves NULL for
  platform-plane), `HasPrefixedUlid` (primary key `aud_<ulid>` — overrides
  vendor's bigint), `HasMetadata`.
- Documented ABSENT: `SoftDeletes` (audits are append-only), `Auditable` (would
  recurse), `Userstamps` (owen-it captures authorship via its own `user_id` /
  `user_type`).
- Retains vendor `$guarded = []` — needed for owen-it's write path.
- `keyType='string'` + `$incrementing=false`.

### Repository

- **`EloquentAuditRepository`** — CRUD via `#[AsRepository]`.

### Actions

- **`Tenant/ListAudits`** — GET `/audits`. Tenant DPO read of own-tenant audit
  rows. Sensitive-value masking happens at the `AuditData` projection.
- **`Tenant/ShowAudit`** — single row.
- **`Platform/ListAudits`** — cross-tenant.
- **`Platform/ShowAudit`** — single row on the platform surface.
- **`Platform/ExportDsar`** — GET `/platform/audits/dsar-export`.
  Data-subject-access-request export. Streams a signed ZIP with every audit row
  referencing the subject, plus a chain-hash manifest.
- **`Platform/VerifyChain`** — POST `/platform/audits/verify-chain`. Runs the
  `AuditChainVerifier` against a window; stamps `chain_verified_at` on every row
  that passes.

### Services

- **`AuditChainVerifierInterface`** — SHA-512 chain walk; `AuditChainState` enum
  for the result. Concrete implementation scaffolded.
- **`KmsCipherInterface`** — KMS wrapper for restricted-tier value encryption
  (`EncryptedAuditValueCast`).

### Registry

- **`AuditRegistry`** — attribute-driven registry of `#[Auditable]` markers.
  Consumed by the chain-verifier hook.

### Jobs

- **`VerifyAuditChainJob`** — runs the chain-verifier over a batch. Emits
  `AuditChainBrokenException` on failure.
- **`ExportAuditForDsarJob`** — the DSAR export machinery.

## What's pending

### Actions to complete

- **`Tenant/ExportAuditAction`** — GET `/audits/export`. CSV/JSON export scoped
  to the tenant DPO. Currently the DSAR export lives ONLY on the platform
  surface; add a tenant-scoped variant.
- **`PruneExpiredAuditsAction`** — POST `/platform/audits/prune`.
  Admin-triggered pruning.

### Services

- **`KmsCipher`** concrete — currently a stub. Wire up AWS KMS / Google Cloud
  KMS / Azure Key Vault via a `KmsProvider` interface + driver-manager pattern.

### Jobs

- **`PruneAuditLogsJob`** — cron: daily. Reads retention tier from the active
  `Subscription` per Application:
  - Small tier: 90 days.
  - Medium tier: 365 days.
  - Enterprise tier: 7 years / configurable. Anonymises before delete (leaves
    `chain_hash` intact for chain continuity).

### Cross-module dependencies

- **`billing/subscription`** — retention tier per tenant.
- **`identity/user`** — the audit row's `user_id` FK.
- **`observability/audit`** — the observability-plane audit aggregator. Separate
  concern (aggregates cross-tenant metrics).

## Backlog priorities

1. **P0 — `PruneAuditLogsJob`** — retention-compliance-critical.
2. **P1 — `KmsCipher` concrete** — restricted-tier data protection. Currently
   every value is plain-text.
3. **P1 — `Tenant/ExportAuditAction`** — DPO surface parity with the platform
   surface.
4. **P2 — `PruneExpiredAuditsAction`** — admin-triggered maintenance.

**Note:** the tenancy-columns.md §9 gap is CLOSED. This module went from a
P0-gap to substantially-done in the trust-boundary batch.
