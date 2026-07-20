# `modules/compliance/` — compliance-service blueprints

The **cross-service compliance orchestrator** — the one place DSAR, retention,
legal hold, consent, subprocessors, and safeguarding are coordinated across
every other service.

Deploys to `academorix-backend/apps/compliance-service/` (see
[`apps/compliance-service/README.md`](../../../academorix/academorix-backend/apps/compliance-service/README.md)).

## Modules — on disk

| Module                                  | Wave | Priority | Schemas | Purpose                                               |
| --------------------------------------- | ---- | -------- | ------- | ----------------------------------------------------- |
| [`compliance/`](./compliance/readme.md) | 5    | 30       | 8       | The full compliance surface — 8 entities, one module. |

**Total on disk: 1 module, 8 schemas.** Currently a single-module tier — this is
deliberate; every entity is tightly coupled to the DSAR runner and there's no
reason to split them into peer modules.

## The 8 entities

| Entity                 | ULID   | Role                                                                                                                                                                 |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ConsentCategory`      | `ccg_` | Config-backed catalogue of consent categories (essential / functional / marketing / analytics / ai-training / minor-parental). Platform defaults + tenant overrides. |
| `ConsentRecord`        | `cns_` | Immutable subject × category × decision snapshot. Withdrawal writes a new row rather than mutating.                                                                  |
| `Dsar`                 | `dsr_` | Data-subject-access-request state machine: `received → triaging → collecting → assembling → delivered                                                                | rejected`. |
| `DsarArtefact`         | `dsa_` | Per-module contribution to a DSAR bundle — points at a `storage::File`.                                                                                              |
| `LegalHold`            | `lhd_` | Freezes retention on a subject / tenant / case / class scope. Two-person approval required to apply.                                                                 |
| `RetentionRun`         | `rtr_` | Audit trail of every retention sweep (per tenant, per invocation).                                                                                                   |
| `Subprocessor`         | `spr_` | Versioned VPC / DPA registry — every third party that processes subject data. Renders the public Trust Center feed.                                                  |
| `SafeguardingIncident` | `sfi_` | Minor-safeguarding report inbox with severity-driven escalation SLAs.                                                                                                |

## Why compliance is a service (not a package)

Compliance is inherently **cross-cutting**. Three concrete failure modes when
compliance work is spread across services:

1. **Retention runs uncoordinated.** Every service ships its own
   `retention.json`, but no single owner reads them together, respects a
   cross-service legal hold, or reconciles tenant-tier overrides. Each service
   runs its own sweep; a subject with a litigation freeze on their User row
   still gets their storage::File rows purged because storage didn't check.
   That's a compliance violation.
2. **DSAR is a coordinator or nothing.** GDPR Art. 15 (access) requires one
   bundle across every column that stores subject data. Filing 12 separate
   export tickets per service is not "complying"; it's "half-complying and
   hoping the auditor doesn't notice".
3. **Consent is a shared vocabulary.** Marketing wants marketing consent.
   Newsletter wants the same. Analytics wants the same. AI wants ai-training
   consent. Splitting consent per service produces drift.

Compliance sits above every other service and stitches them together via
attribute-discovered contributors + one canonical retention runner + one
canonical consent gate.

## Cross-service integration model

Compliance never reads other services' databases. It reaches them via their SDKs
(`identity-sdk`, `platform-sdk`, `billing-sdk`, …) and via attribute markers on
THEIR classes:

- **`#[DsarExportable(subject: 'owner_id', ...)]`** on a class → DSAR
  orchestrator scans + collects.
- **`#[DsarErasable(strategy: 'anonymize', ...)]`** on a class → DSAR
  orchestrator erases.
- **`#[ConsentRequired(category: 'marketing')]`** on a job → dispatch is gated
  on the recipient's consent.
- **`#[RetentionPolicy(hot_days: null, cold_days: 2555, ...)]`** on a class →
  retention runner reads this instead of the module's `retention.json`.
- **`#[LegalHoldable(subject: 'owner_id')]`** on a class → legal-hold-eligible.

Every service compiles these registries at boot from its own class scan; the
compliance-service reads its OWN registries when running DSARs (each service
runs the erase / export locally under its own tenant scope; compliance
orchestrates only).

## Cross-cutting invariants

- **Only canonical retention runner** — every module declares `retention.json`;
  the compliance-service runs them all, respecting legal holds. Modules never
  run their own sweeps.
- **Breach notification is human-approved** — never auto-sent to subjects.
  Compliance surfaces the incident on the platform-admin dashboard;
  `SendBreachNotificationJob` dispatches only after human confirmation.
- **`ConsentRecord` is IMMUTABLE** — the observer refuses UPDATE on every column
  except `metadata` (append-only). Withdrawal writes a new row with
  `decision=withdrawn`.
- **External referrals for safeguarding are NEVER automated.** The tenant's
  designated safeguarding lead completes the referral out-of-band; compliance
  records the reference.

## For agents

- **Never introduce a second "compliance" module here.** The tier is
  intentionally single-module; if you'd extract something, it should live next
  to the domain it belongs to (safeguarding case-management under a
  `safeguarding/` product module, not here).
- **Every entity depends on every other.** `Dsar` → `DsarArtefact` → `File` (via
  `storage/`); `RetentionRun` → `LegalHold`; `ConsentRecord` →
  `ConsentCategory`. Read the module's full `readme.md` before touching any one
  entity.
- **The 8 ULID prefixes are registered.** Verify via
  `grep -E '"(ccg_|cns_|dsa_|dsr_|lhd_|rtr_|sfi_|spr_)"' shared/foundation/data/ulid-prefixes.json`.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` §4 — module→service map.
- `./compliance/readme.md` — the module's full contract (12 sections).
- `.kiro/steering/hierarchy.md` §11 — observability signals (audit vs activity
  vs compliance).
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns + retention gaps.
