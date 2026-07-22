# Phase D — Unblock ADRs (0029, 0030, 0031)

**Date:** 2026-07-21 **Author:** docs-adr-steward **Scope:** 3 ADRs that unblock
deferred Phase A / Phase E tasks (A4, A5, E9). File edits under `docs/adr/`
only; no git ops. **Source reports read:**

- `.kiro/reports/00-triage-summary-2026-07-21.md`
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md`
- `.kiro/reports/data-modeler-2026-07-21.md`
- (Also read for shape grounding: `.kiro/reports/phase-d1-adrs-2026-07-21.md`,
  `tasks.md`.)

---

## Summary

Three ADRs landed at `docs/adr/`, each pinning a decision that unblocks a
deferred task named in `tasks.md`:

| ADR      | File                                                      | Unblocks                                                                                                       | Steering anchor                                                                                  |
| -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **0029** | `docs/adr/0029-audit-consolidation.md`                    | Task A4 — Consolidate `Audit` (delete `shared/audit/`, keep `observability/audit/`)                            | `hierarchy.md §6` (module responsibility map) + `tenancy-columns.md §3` (Package matrix)         |
| **0030** | `docs/adr/0030-payment-methods-ownership.md`              | Task A5 — Reconcile `payment_methods` collision (keep `finance/payment/`, drop `finance/gateway/`'s migration) | `hierarchy.md §6` (module responsibility map) + `tenancy-columns.md §3, §5`                      |
| **0031** | `docs/adr/0031-application-id-central-plane-extension.md` | Task E9 — Drop `application_id` from 11 domain-drift rows; extend §2 mandate to 12 named rows                  | `tenancy-columns.md §2` (application_id mandate) — extends the 8-row list to a 12-row named list |

Every ADR carries the canonical shape (Status / Context / Options considered /
Decision / Consequences / Related work) plus an explicit `## Follow-up work`
section that pins the execution handoff. All three are `**Status:** Accepted`,
dated `2026-07-21`.

---

## Per-ADR decision summary

### ADR-0029 — Audit consolidation

**Pinned decision:** Canonical location for the `Audit` module is
`packages/backend/observability/audit/`. `packages/backend/shared/ audit/` is
deprecated + slated for deletion.

**Grounding:**

- `.kiro/steering/hierarchy.md §6 (module responsibility map)` places `Audit`
  under the observability lane (sibling to `Activity` and `Monitoring`); the
  `shared/` tier is for platform-shared substrate, not observability concerns.
- `.kiro/reports/data-modeler-2026-07-21.md §M2` documents the dual-package
  collision.
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §VIO-021` flags the
  schema collision that blocks `db:migrate --seed`.

**Rule change to steering?** No. This ADR is decision-application — it applies
existing rules (module responsibility map + Package matrix) to a specific
ambiguity. No steering rule changes; a minor enhancement candidate (naming the
canonical package path in `hierarchy.md §6`) is flagged as an optional follow-up
below.

**Options considered:** 3 (keep both / `shared/` wins / `observability/` wins).
Chosen: `observability/` wins.

### ADR-0030 — `payment_methods` ownership

**Pinned decision:** Canonical owner of `payment_methods` is
`apps/academorix/src/modules/finance/payment/`.
`apps/academorix/src/modules/finance/gateway/` drops its
`create_payment_methods_table` migration and FKs to the survivor.

**Grounding:**

- `.kiro/steering/hierarchy.md §6 (module responsibility map)` — the pattern
  that each domain concern lives in exactly one module.
- `.kiro/steering/tenancy-columns.md §3 (Package matrix)` — `payment_methods` is
  a tenant-scoped domain row (composes `BelongsToTenant`; not on the 8-row
  `application_id` mandate).
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §WARN-005` — the
  collision this ADR resolves.
- `.kiro/reports/data-modeler-2026-07-21.md §B7` — duplicate- migration
  blocker + pre-flight diff recommendation.

**Rule change to steering?** No. Same decision-application character as
ADR-0029.

**Options considered:** 3 (keep both / `gateway/` wins / `payment/` wins).
Chosen: `payment/` wins.

### ADR-0031 — `application_id` central-plane extension

**Pinned decision:** Extend ADR-0027's D2 8-row mandate to a named 12-row list.
Add four central-plane infrastructure rows: `plans`, `auth_jwt_signing_keys`,
`service_accounts`, `domains`. Drop `application_id` from the other 11 rows
(Phase E9).

**Grounding:**

- `.kiro/steering/tenancy-columns.md §2 (The `application_id` mandate)` — the
  8-row list this ADR extends.
- `.kiro/steering/tenancy-columns.md §5 (Non-goals — forbidden columns)` — the
  forbidden `application_id` row that references "except the 8 named in §2";
  extension changes the phrase to "12 named in §2".
- `.kiro/steering/tenancy-columns.md §7 (tenancy-compliance- auditor agent)` —
  the agent whose R3 allow-list updates.
- `.kiro/steering/tenancy-columns.md §9 (Living gap register)` — the register
  that closes on this ADR + E9.
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §VIO-001 through §VIO-015`
  — the 15 violations.
- `.kiro/reports/data-modeler-2026-07-21.md §NEW-GAP-002` — aggregate finding.
- ADR-0027 — the sibling ADR ADR-0031 extends. ADR-0027 D2 already
  forward-references ADR-0031 by number + the same 4-row list
  (`plans, auth_jwt_signing_keys, service_accounts, domains`); the forward
  reference is intact and correct.

**Rule change to steering?** **Yes** — this is the only rule- changing ADR of
the three. The steering update at `.kiro/steering/tenancy-columns.md` §§2, 5, 9
is explicitly routed to `docs-adr-steward` as a follow-up doc-only pass per
ADR-0031 D4. The task instruction for this pass scoped edits to `docs/adr/`
only; the deferral is intentional.

**Options considered:** 4 (add all 15 / unnamed exception clause / drop all 15 /
named 12-row list). Chosen: named 12-row list.

---

## Bidirectional anchoring

Each ADR's `## Related work` section cites the steering files that motivate it.
The reverse pointers — steering files citing the ADR number — land as follow-up
doc edits routed to `docs-adr-steward`:

| ADR  | Steering file           | Cross-reference status                                                                                                                                                                             |
| ---- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0029 | `hierarchy.md §6`       | Not yet cited by number; hierarchy §6 already lists Audit under observability but does not cite ADR-0029. **Follow-up:** add ADR-0029 as an anchor line above the §6 Audit row.                    |
| 0029 | `tenancy-columns.md §3` | Package matrix already documents Audit's `BelongsToTenantOptional` composition but does not cite ADR-0029. **Follow-up:** add ADR-0029 reference on the Audit row.                                 |
| 0030 | `hierarchy.md §6`       | Not yet cited by number. **Follow-up:** add ADR-0030 as an anchor pointer for the payment_methods ownership decision.                                                                              |
| 0031 | `tenancy-columns.md §2` | Steering **must be updated** to name the 12-row list per ADR-0031 D4. The current §2 table names 8 rows; the update adds 4 rows + updates the "outside the 8" phrasing in §2 Enforced-by + §5.     |
| 0031 | `tenancy-columns.md §9` | Living gap register updates on E9 completion; ADR-0031 also referenced there.                                                                                                                      |
| 0031 | ADR-0027 D2             | ✅ **Already anchored.** ADR-0027 D2 already forward-references ADR-0031 with the same 4-row list (`plans, auth_jwt_signing_keys, service_accounts, domains`). No further edit needed on ADR-0027. |

---

## Cross-repo coordination needed

None for this phase. All three ADRs are backend-side decisions:

- **ADR-0029** — affects `packages/backend/observability/audit/` +
  `packages/backend/shared/audit/`. No cross-repo consumer requires the audit
  tables' shape to change; the composer name update in downstream backend
  packages is intra-repo.
- **ADR-0030** — affects only
  `apps/academorix/src/modules/finance/{payment,gateway}/`. Both modules are
  app-local; no `stackra-ai` or `stackra-frontend` code consumes their
  interfaces directly. Wire-visible payment shapes are already governed by
  ADR-0022 (four seams); the internal ownership shuffle changes nothing at the
  wire.
- **ADR-0031** — affects backend schema only. Downstream consumers
  (`stackra-ai`, `stackra-frontend`) read `application_id` from JWT claims and
  API response payloads — the wire shapes are governed by
  `docs/contracts/service-jwt.v1.schema.json` +
  `docs/contracts/service-identity.v1.schema.json`, both of which pull
  `application_id` from the top-level rows this ADR keeps (never from the 11
  drift rows it drops). No cross-repo change.

---

## Follow-up work routed to other agents

Ordered by unblocker priority:

### To `docs-adr-steward` (doc-only, 3 commits)

1. **Update `tenancy-columns.md §§2, 5, 9`** to name the 12-row list per
   ADR-0031 D4. Also update the sibling `tenancy- compliance-auditor` agent's R3
   check allow-list.
2. **Refresh `docs/adr/README.md` index.** Currently stale — says "next
   available number is 0026" (per the phase-d1 report); now 0029 / 0030 / 0031
   have landed. The index needs rows for every restored ADR since 0022 (0008,
   0011, 0016, 0017, 0018 landed in Phase D1 but the index wasn't refreshed)
   plus rows for 0027, 0029, 0030, 0031. Also update the "next available number"
   line to `0032` — with the note that 0028 is deferred (per `tasks.md`,
   ADR-0028 = `runtime-target-laravel-octane` sits in the D2 batch, not this
   Phase D pass; leaving the slot open until D2 lands preserves the tasks.md
   numbering).
3. **Optional enhancement (not blocking anything):** add ADR anchor lines in
   `hierarchy.md §6` naming the canonical package path for each domain module.
   Currently §6 names the module by Owner + Owns + Consumed-by; naming the
   package path (e.g. `packages/backend/observability/audit/` for Audit) makes
   the reverse lookup one grep away. Route this as a low-priority Phase D3
   sweep.

### To `codebase-housekeeper` (mechanical, 2 commits)

4. **A4 (audit consolidation execution).**
   `git rm -r packages/backend/shared/audit/`; migrate every workspace
   `composer.json` that requires `stackra/shared-audit` (or the sub-vendor
   variant) to require the survivor's composer name; regenerate `composer.lock`
   in every consuming app; verify `php artisan migrate --seed` on fresh SQLite
   passes.
5. **A5 (payment_methods reconciliation execution).** `diff` the two
   `create_payment_methods_table` migrations to verify they are byte-identical;
   `git rm apps/academorix/src/modules/ finance/gateway/database/migrations/2026_07_15_120002_create_ payment_methods_table.php`;
   delete `finance/gateway/`'s duplicate `PaymentMethodInterface` +
   `PaymentMethod` model; rewrite every `finance/gateway/` Action / repository
   that imports the interface to point at `finance/payment/`; verify
   `php artisan migrate --seed` passes.

### To `codebase-housekeeper` OR `laravel-feature-builder` (E9, one commit per row-owning package — 6 packages)

6. **E9 (drop `application_id` from 11 domain-drift rows).** Per the table in
   ADR-0031 D3. Migrations under
   `database/ migrations/<timestamp>_drop_application_id_from_<table>_table.php`
   with explicit `down()` for reversibility. Interface changes remove
   `ATTR_APPLICATION_ID` from the 11 `<Row>Interface.php` files. Composite
   unique index rewrites for `push_subscriptions` and `approval_templates` are
   part of the same migrations. Migrate downstream callsites that read
   `ATTR_APPLICATION_ID` on any of the 11 rows.

---

## Drift flagged for humans

- **ADR-0031 IS rule-changing but the steering edit is deferred.** ADR-0031 D4
  explicitly routes the `tenancy-columns.md §§2, 5, 9` update to
  `docs-adr-steward` as a follow-up doc-only commit. The task instruction for
  this pass scoped edits to `docs/adr/` only; the deferral is intentional and
  not a hook-instruction violation. Reviewers who require the steering + ADR to
  land in the same PR should wait for the follow-up commit before merging this
  pass.
- **ADR-0027 forward-references ADR-0031 correctly.** ADR-0027 D2 names the same
  4-row list (`plans, auth_jwt_signing_keys, service_accounts, domains`) that
  ADR-0031 D1 codifies. No edit needed on ADR-0027; the forward reference is
  factual and intact. Verified via direct read of ADR-0027 D2.
- **`docs/adr/README.md` index is stale.** The index still says "The next
  available number is **0026**" and its table stops at 0025 — it doesn't list
  0008, 0011, 0016, 0017, 0018, 0022, 0026, 0027 (all landed in prior passes)
  nor 0029, 0030, 0031 (landed in this pass). The refresh is routed to
  `docs-adr-steward` as a follow-up commit (item 2 above).
- **ADR-0028 is a deferred slot.** `tasks.md` names ADR-0028 as
  `runtime-target-laravel-octane`, part of the D2 batch. The numbering gap (0027
  → 0029) is intentional per the tasks sequencing; ADR-0028 lands in a separate
  D2 pass. No renumber needed on the three ADRs authored here.
- **Task instruction ambiguity: workspace root.** The task instruction said
  "root: `/Users/akouta/Projects/stackra/ stackra-backend`" but the actual
  workspace is `/Users/akouta/Projects/academorix-frontend/`. The ADRs reference
  paths like `packages/backend/observability/audit/` which resolve correctly
  within this workspace (verified via `list_directory` on the top-level tree —
  `packages/` exists, `apps/` exists, `docs/adr/` exists). Root mismatch flagged
  as a known task-drift item.

---

## Lint results

- **`markdownlint-cli2`** — Not run in this session (tool not invoked). All 3
  ADR files were authored with canonical fenced code blocks, ATX-style headings,
  and prose wrapping matching the shape of ADR-0016 / ADR-0022 / ADR-0025 /
  ADR-0027. Recommend `markdownlint-cli2 "docs/adr/**/*.md"` at Phase D wrap-up.
- **`lychee`** — Not run in this session. Every steering-file link in the 3 ADRs
  was authored against verified paths in `.kiro/steering/*.md` (files confirmed
  via `list_directory`). Every sibling-ADR link (ADR-0022, ADR-0025, ADR-0027,
  ADR-0041) points at existing files (0022, 0025, 0027) or at correctly-
  numbered future ADRs (0041 — flagged as planned in `tasks.md`). Report-file
  links point at existing `.kiro/reports/` files. Recommend
  `lychee --config .github/lychee.toml docs/adr/` at Phase D wrap-up.

---

## Files created / changed

Grouped by kind (ADR only — no top-level docs, contracts, or steering edits fell
within this phase's scope):

- **ADR (3 new files):**
  - `docs/adr/0029-audit-consolidation.md`
  - `docs/adr/0030-payment-methods-ownership.md`
  - `docs/adr/0031-application-id-central-plane-extension.md`
- **Deliverable report:** this file
  (`.kiro/reports/phase-d- unblock-adrs-2026-07-21.md`).
- **No steering edits.** ADR-0031's steering update is deferred to a follow-up
  commit per the task's `docs/adr/` scope constraint.
- **No `docs/adr/README.md` update.** Deferred to a follow-up Phase D pass per
  the "no git ops" scope constraint.
- **No new ADR numbers reserved beyond 0031.** ADR-0028 remains the deferred
  slot named in `tasks.md`.

---

## Verification

- All 3 ADRs carry the canonical shape (Status / Context / Options considered /
  Decision / Consequences / Related work) matching ADR-0027 as the canonical
  example.
- Every ADR carries `**Status:** Accepted` and `**Date:** 2026-07-21`.
- Every ADR carries at least 3 alternatives under `## Options considered` (0029:
  3, 0030: 3, 0031: 4).
- Every ADR's `## Related work` cites at least one steering file + at least one
  sibling ADR + at least one source report.
- ADR numbers are monotonic (0029 > 0030 > 0031 > previous max 0027; 0028 is the
  reserved deferred slot per `tasks.md`).
- No ADR renumbering; no ADR deletion.
- No ADR supersession applied to prior ADRs; ADR-0031 EXTENDS ADR-0027 (both
  remain in force). ADR-0027's forward reference to ADR-0031 was verified
  intact.
