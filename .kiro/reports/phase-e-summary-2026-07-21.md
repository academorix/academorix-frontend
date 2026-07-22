# Phase E — Compliance Sweep Summary

**Date:** 2026-07-21 **Scope:** Compliance sweep across `packages/backend/**`
and `apps/academorix/**` **Constraint:** Zero git operations. File edits only.

## Per-batch outcomes

| Batch | Description                                                           | Status          | Files touched                                               |
| ----- | --------------------------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| E1    | Add `declare(strict_types=1);` to files missing it                    | ✅ done         | 35 (routing/Attributes + foundation/Middleware)             |
| E2    | Add `#[Bind]` to scope contract interfaces                            | ✅ already done | 0 (all scope Contracts already had `#[Bind]`)               |
| E3    | Move `ToolDiscoveryBootstrapper.php` → `Bootstrappers/`               | ✅ done         | 1                                                           |
| E4    | Flatten 2-level Actions nesting in geography/localization             | ✅ done         | 18 (geography) + verified localization already flat         |
| E5    | Migrate `env()` outside `config/` to `config()` + attribute injection | ✅ already done | 0 (Horizon + Health already migrated via `mergeConfigFrom`) |
| E6    | Add `BelongsToTenant` to `AccessRequestProjection` + `ServiceAccount` | ✅ done         | 2                                                           |
| E7    | Rename `leads.owner_id` → `leads.assigned_user_id`                    | ✅ already done | 0 (already `assigned_user_id` in `LeadInterface`)           |
| E8    | Add `application_id` to `entitlements` migration + interface          | ✅ done         | 1 (migration + interface)                                   |
| E9    | Drop `application_id` from 11 non-central-plane rows                  | ⏸️ deferred     | 0 (blocked on ADR-0031)                                     |
| E10   | Rename residual `Workspace` strings → `Tenant`                        | ✅ done         | 6 files, 10 docblock renames                                |

## Phase C follow-ups (also addressed)

| Item         | Description                                                            | Status      | Files touched                                              |
| ------------ | ---------------------------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| C-followup-1 | `crud/src/Registries/` (plural) → `Registry/` (singular)               | ✅ done     | 3 files + consumer sweep                                   |
| C-followup-2 | `routing/src/Support/ApiVersionRegistry.php` → `Registry/`             | ✅ done     | 1 file + 4 consumers                                       |
| C-followup-3 | 45 `Contracts/Services/*RegistryInterface.php` → `Contracts/Registry/` | ✅ done     | 45 files + 115 consumers                                   |
| C-followup-4 | Orphan `foundation/lang/*/errors.php` translations                     | ⏸️ deferred | 0 (user restored Blade views; translations still consumed) |

## Verification

All post-batch verifications passed:

- `grep -r 'Stackra\Crud\Registries\'` → 0 hits
- `grep -r 'Stackra\Routing\Support\ApiVersionRegistry'` → 0 hits
- `grep -r 'Contracts\Services\.*RegistryInterface'` in workspace → 0 hits
- `grep -rn 'Workspace' packages/backend/ apps/academorix/` (excl vendor/md/py)
  → 0 hits
- `find packages/backend -path "*/Contracts/Services/*RegistryInterface.php"` →
  0 files

## Deferred items with rationale

1. **E9 — Drop `application_id` from 11 non-central-plane rows.** Blocked on
   ADR-0031 (extension of the §2 8-row mandate) which is on the Phase D backlog.
   When ADR-0031 lands and names the central-plane exceptions, the remaining
   rows can be swept in one batch.

2. **Orphan `foundation/lang/*/errors.php` translations.** The user restored the
   Blade error views during this session, so the translation strings remain
   consumed by the templates. Leaving them in place is correct.

## Deliverable artefacts

- `.kiro/reports/phase-c-batch-4-contracts-registry-mover.py` — the 45-file
  mover script (idempotent, re-runnable).
- Two pre-authored scripts from the aborted housekeeper run
  (`phase-e-pr-e1-strict-types.py`, `phase-e-pr-e4-flatten-actions.py`) that
  successfully executed before the abort — kept as audit trail.

## Overall Phase A-E status

Session end-state across the compliance sweep:

- **Phase A — Deployment blockers:** 5/6 executable batches complete
  (PR-A1/A2/A3/A6). PR-A4 + PR-A5 deferred pending ADRs 0029 + 0030.
- **Phase B — Runtime correctness:** 3/3 complete (SentryService instance
  service, TenancyHookDispatcher wiring, CrudController deletion).
- **Phase C — Headless + folder cleanup:** 4/4 batches complete + all 4
  follow-ups (crud/Registries, ApiVersionRegistry, Contracts/Services/*
  RegistryInterface).
- **Phase D1 — Restored ADRs:** 6/6 (0008, 0011, 0016, 0017, 0018, 0022).
- **Phase E — Compliance sweep:** 9/10 complete. E9 deferred pending ADR-0031.

**No git ops performed.** All changes on disk; ready for user review.
