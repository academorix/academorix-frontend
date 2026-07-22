# ADR 0029 — Audit consolidation: one `audits` table, one owning package

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Data lead + Backend
architecture + Docs lead

## Context

Two packages in the workspace ship a `create_audits_table` migration against the
same target table:

- **`packages/backend/shared/audit/`** — the earlier package. Wraps
  `owen-it/laravel-auditing`'s vendor `Audit` model with the
  `BelongsToTenantOptional` trait and lets `owen-it` write its own columns.
  Predates the ADR-0027 three-axes column contract and the hierarchy.md §6
  module responsibility map.
- **`packages/backend/observability/audit/`** — the later, generator-scaffolded
  package. Emits an interface with `ATTR_TENANT_ID` + `ATTR_APPLICATION_ID` and
  creates a migration with proper composite indexes
  (`audits_app_tenant_created_idx` per `tenancy-columns.md §8`). The migration
  is fully compliant with ADR-0027's row-level attribution contract.

Both migrations call `Schema::create(AuditInterface::TABLE, ...)` and both
resolve to the same physical `audits` table. Running
`php artisan migrate --seed` against a fresh database fires the first migration,
then dies on the second with "relation `audits` already exists". This is the B6
blocker in `.kiro/reports/00-triage-summary-2026-07-21.md` and the VIO-021
schema collision in `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md`. It
is a deployment blocker — nothing in the workspace boots against a green DB
until this collision resolves.

Beyond the collision itself, the deeper concern is **module boundary
integrity**. `hierarchy.md §6 (module responsibility map)` lists `Audit` as
owning the compliance/audit signal under the observability lane — sibling to
`Activity` (spatie/laravel- activitylog) and `Monitoring` (health + alerts). The
`shared/` tier is for platform-shared substrate (Foundation, geography,
localization, versioning, search, transfer, attributes) — not for domain
concerns that already have a home in another lane. The `shared/audit/` package
is a residue from before the observability lane was carved out.

Two questions surface for the resolution:

1. **Which package survives?** The choice pins module-boundary integrity for
   years — every downstream consumer that requires the audit package will
   require the survivor.
2. **What survives inside the survivor?** The `owen-it/laravel- auditing` vendor
   package IS the audit engine. The Stackra-owned wrapper package's job is to
   (a) compose `BelongsToTenantOptional` onto the vendor `Audit` model so tenant
   filtering applies to audit reads, (b) declare `ATTR_TENANT_ID` +
   `ATTR_APPLICATION_ID` in a Contracts/Data interface for typed queries, and
   (c) ship the migration that adds `tenant_id` + `application_id` + composite
   indexes on top of the vendor's default `audits` shape.

## Options considered

1. **Keep both packages; delete one migration at deployment time (rejected).**
   Two Stackra `Audit` model classes shipping the same underlying table is the
   definition of drift. Every consumer would have to decide "which Audit do I
   import?" and any answer is fragile.
2. **Canonical location = `packages/backend/shared/audit/`; delete
   `observability/audit/` (rejected).** Contradicts `hierarchy.md §6` module
   responsibility map, which places `Audit` under the observability lane. Also
   loses the generator-scaffolded compliance work already invested in
   `observability/audit/`.
3. **Canonical location = `packages/backend/observability/audit/`; delete
   `shared/audit/` (chosen).** Matches `hierarchy.md §6`, preserves the
   compliant migration + interface + composite indexes already in place, and
   aligns with the two-signal observability split (Audit + Activity as siblings
   under one lane) documented in `.kiro/specs/observability/design.md`.

## Decision

### D1 — Canonical location is `packages/backend/observability/audit/`

The `Audit` module lives in `packages/backend/observability/audit/`. This is the
survivor. Its migration (`2026_07_15_120001_create_audits_table.php`) is the
canonical shape that carries `tenant_id`, `application_id`,
`audits_app_tenant_created_idx`, and every column contract on `AuditInterface`.
The composer name is `stackra/audit` per `.kiro/steering/package-naming.md`
(flat `stackra/*` vendor scope — the observability triad's
`stackra- observability/*` sub-vendor namespace is a grandfathered exception
listed in the package-naming steering, retained until the vendor migration
commits described there).

### D2 — `packages/backend/shared/audit/` is deprecated and slated for deletion

`packages/backend/shared/audit/` receives no further changes. Its
`composer.json` `name` is grandfathered as `stackra/shared-audit` today;
consumers that historically depended on it migrate their `require` line to the
surviving package's name. The physical folder

- its `composer.json` + its migration + its `Audit.php` model + its
  `AuditInterface.php` contract are removed as follow-up work item **A4** (see
  Consequences below).

### D3 — The survivor keeps the `BelongsToTenantOptional` composition

The observability/audit package's `Audit` model composes
`Stackra\Tenancy\Concerns\BelongsToTenantOptional`. `Audit` is one of the two
rows for which optional tenant scoping is architecturally correct —
platform-audience audit rows legitimately carry `tenant_id = NULL` (a
super-admin action against no tenant scope). This matches the pattern already
documented in `.kiro/steering/tenancy-columns.md §3` (Package matrix — Audit
row) and used by `SmsOptOut` (see WARN-001 in the tenancy compliance report).

Same treatment applies to the `application_id` column — nullable for
platform-audience audits, required for tenant-audience audits (codified in
ADR-0027 D2 as row 7 of the 8-row mandate).

### D4 — The vendor wrapping contract stays with the survivor

The `owen-it/laravel-auditing` package is the audit engine; the Stackra-owned
wrapper's job is to (a) subclass the vendor `Audit` model to add tenant scoping,
(b) declare column constants + composite indexes, (c) provide the tenant-aware
`Audit` read surface for the `Activity` sibling to reference. The survivor
package keeps that job. Any future upgrade of `owen-it/laravel-auditing` lands
in this package's `composer.json` alone — one package to bump, one composer name
to remember.

### D5 — No feature drift during deletion

Deleting `packages/backend/shared/audit/` is byte-neutral. Its migration is a
duplicate of the survivor's; its `Audit` model is a functional subset (composes
fewer traits). No feature is lost, no downstream consumer discovers an unknown
method. The follow-up codebase-housekeeper commit (A4) is a `git rm -r` plus a
`require` line update in any consuming composer.json.

## Consequences

**Positive:**

- **`php artisan migrate --seed` runs green.** The B6 / VIO-021 blocker is
  closed the moment `shared/audit/` is deleted.
- **Module-boundary integrity restored.** The observability lane owns its
  signal. `shared/` returns to its "platform-shared substrate" charter.
- **One place to look for audit changes.** Reviewers stop asking which `Audit`
  package is authoritative.
- **Compliance work is preserved.** The generator-scaffolded migration +
  interface + composite indexes in `observability/audit/` are already
  ADR-0027-compliant; no rewrite needed.

**Negative:**

- **Every consumer of `stackra/shared-audit` must update its `require` line.**
  The Phase E migration touches every package whose `composer.json` currently
  references the deprecated name. Verified via grep; count is small (fewer than
  10 downstream packages).
- **The `shared/` package's git history is lost on deletion.** Mitigated by the
  survivor's migration being byte-identical for the shared schema slice — the
  deletion is a "duplicate removal", not a rewrite.

**Neutral:**

- **The `audits` table shape doesn't change.** Same columns, same indexes, same
  `tenant_id` + `application_id` semantics that ADR-0027 already codified.
- **The `owen-it/laravel-auditing` vendor dependency stays where it is** —
  declared in the survivor package's `composer.json`.

## Follow-up work

The ADR itself is a design decision. Execution is a `codebase- housekeeper`
commit against A4 in `tasks.md`:

1. `git rm -r packages/backend/shared/audit/`
2. For every workspace `composer.json` that requires `stackra/shared-audit` (or
   the sub-vendor variant), rewrite the line to require the survivor's composer
   name.
3. Regenerate `composer.lock` in every app that depends on the audit surface.
4. Verify `php artisan migrate --seed` on a fresh SQLite passes.
5. Verify existing audit-consuming tests still pass.

That work lands under Phase A of `tasks.md` and unblocks Phase B (runtime
correctness). It requires no schema migration — the survivor's migration is the
same shape the deleted package would have run.

## Related work

- `.kiro/steering/hierarchy.md §6 (module responsibility map)` — places `Audit`
  under the observability lane; this ADR anchors that placement in the
  source-of-truth ADR record.
- `.kiro/steering/tenancy-columns.md §2` — pins `audits` as one of the 8 rows
  carrying `application_id` directly (the survivor package's migration ships
  this contract).
- `.kiro/steering/tenancy-columns.md §3` — the Package matrix note that `audits`
  uses `BelongsToTenantOptional` (platform vs tenant audience).
- `.kiro/steering/tenancy-columns.md §9` — living gap register entry that first
  flagged the two-package split.
- `.kiro/steering/package-naming.md §Grandfather list` — the
  `stackra-observability/*` sub-vendor exemption the survivor package inhabits
  until the vendor-migration commits land.
- `.kiro/reports/data-modeler-2026-07-21.md §M2` — the dual-package collision
  finding.
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §VIO-021` — the
  schema-collision violation this ADR resolves.
- `.kiro/reports/00-triage-summary-2026-07-21.md §Deployment blockers (BLOCKER B6)`
  — the deployment blocker this ADR unblocks.
- ADR-0027 — Row-level attribution: three-axes column contract (the survivor's
  `application_id` column is row 7 of D2's 8-row mandate).
