# Docs & ADR Steward — Integrity Audit Report

**Date:** 2026-07-21 **Scope (read + audit):** `.kiro/steering/**`, `docs/**`,
`docs/adr/**`, `docs/contracts/**`, `README.md`, `AGENT_QUICKSTART.md`,
`AGENT_ROSTER.md` **Scope (cross-reference read-only):** `packages/backend/**`,
`apps/academorix/**`, `tools/cli/**` **Workspace root:**
`/Users/akouta/Projects/academorix-frontend` **Mode:** READ-ONLY. This report is
the only file written this pass. **Sibling audit reports consulted:**
`.kiro/reports/{standards-steward,backend-architecture-reviewer,backend-platform-reviewer,tenancy-compliance-auditor,workspace-standardization}-2026-07-21.md`.

---

## Executive summary

The documentation surface is **critically incomplete**. Steering and agent
charters are shaped as if a full docs+ADR tree exists; on disk the tree is
missing eleven of its authoritative ADRs, three of its top-level docs, and the
entire `docs/contracts/` folder. Two ADR numbers collide (0024 and 0025 mean
different things in steering vs on disk). Multiple steering files still point at
the pre-rename repo (`stackra-backend/…`), at apps that never landed
(`apps/api`, `apps/ai-service`, `apps/template`, `apps/dashboard`), and at
reference material under `old/backend/` that is not in this tree.

Overall verdict: **AT RISK**. Every reviewer that resolved an ADR link
(`docs/adr/0016-actions-only-no-services-no-controllers.md`) or a doc link
(`docs/doppler.md`) in the last audit round was reading a broken pointer. The
"where do the accepted rules actually live for this repo" question raised by
`backend-architecture-reviewer §Open questions #5` has a hard answer: **nowhere
in the working tree**. This is not a code problem; it is a documentation-
integrity problem that blocks every other reviewer lane from citing
authoritative ADR text.

| Bucket                                                               | Count |
| -------------------------------------------------------------------- | ----- |
| Steering files scanned                                               | 48    |
| Steering files with material drift (paths, ADR refs, or reject-word) | 15    |
| ADRs present in `docs/adr/`                                          | 3     |
| ADRs referenced by steering but missing on disk                      | 11    |
| ADR number collisions (steering says X; on-disk 0024/0025 mean Y)    | 2     |
| Top-level docs referenced but MISSING                                | 5     |
| Top-level docs present                                               | 3     |
| `docs/contracts/**` schemas expected                                 | ≥ 2   |
| `docs/contracts/**` schemas + README present                         | 0     |
| New ADRs needed (surfaced by sibling audits + this pass)             | 12    |

---

## Per-file drift findings — `.kiro/steering/**`

Only files with material drift are enumerated here. Clean files are omitted.

### `.kiro/steering/architecture.md`

- **Referenced path drift.**
  - Line 3 — top sentence declares the doc describes "`stackra-backend`" — the
    actual repo root is `academorix-frontend/`.
  - Layout diagram (lines 6-14) lists `apps/template/`, `apps/api/`,
    `apps/ai-service/` — none exist. Actual apps are `apps/academorix/`,
    `apps/laravel-template/`, `apps/react-native-template/`,
    `apps/vite-template/` (surfaced by standards-steward + backend-platform-
    reviewer).
  - Layout diagram lists `docker/` — no `docker/` directory exists (surfaced by
    backend-platform-reviewer container-01).
  - Layout diagram lists `docs/` with entries `architecture`, `migration`,
    `doppler`, `package-authoring` — none of those top-level docs exist.
- **Suggested fix:** Rewrite §Layout to reflect the actual tree; either restore
  `docker/` + the missing apps or admit their absence and drop them from the
  diagram. Decide with `solution-architect` first — this touches ADR- worthy
  structure.

### `.kiro/steering/models.md`

- **Referenced path drift.** Every "reference implementation" link points at
  `old/backend/modules/reviewing/**` (lines 9, 99-102, 285-286). That folder
  does NOT exist in the tree.
- **Consequence.** The steering says "match that style when writing
  models/interfaces/migrations" but the reference model is unreadable. New
  authors have to guess.
- **Suggested fix:** Replace the `old/backend/**` paths with the canonical live
  equivalents this repo actually ships. Candidates:
  `packages/backend/framework/feature-flags/src/{Models,Contracts/Data}/**`
  (called out by standards-steward as canonical); or
  `packages/backend/access/rbac/src/{Models,Contracts/Data}/**` for the
  spatie-composed pattern.
- **Cross-agent handoff:** the fix requires reading the live code, which is
  outside the docs steward's write lane. Route the "which live package is
  canonical" decision through `laravel-feature-builder`.

### `.kiro/steering/docblocks.md`

- **Referenced path drift.**
  - Line 10 — `stackra-backend/apps/api/config/auth.php` — file does not exist.
    Path prefix + app both wrong.
  - Line 13 —
    `old/backend/modules/reviewing/Access/database/factories/PermissionFactory.php`
    — folder does not exist.
  - Line 17 —
    `old/backend/modules/reviewing/User/src/Repositories/EloquentPlatformUserRepository.php`
    — folder does not exist.
  - Line 21 — `stackra-backend/packages/framework/enum/src/Enum.php` — wrong
    path prefix. Actual path is `packages/backend/framework/enum/src/Enum.php`.
  - Line 76 — `apps/api/*`, `apps/ai-service/*` — neither app exists.
- **Suggested fix:** Sweep every reference-implementation path in one PR.
  Canonical replacements exist in `packages/backend/framework/enum/src/Enum.php`
  (still valid, just needs the path fix), and
  `packages/backend/framework/feature-flags/**` for models + factories +
  repositories (standards-steward marked feature-flags as canonical).

### `.kiro/steering/doppler.md`

- **Referenced doc drift.** Line 6 — "See `docs/doppler.md` for the full design"
  — **`docs/doppler.md` does not exist**. Surfaced by backend-platform-reviewer
  doppler-01.
- **Referenced path drift.** Line 20 — copy `apps/template/.doppler.yaml` —
  **`apps/template/` does not exist**. Actual templates:
  `apps/vite-template/.doppler.yaml`, `apps/laravel-template/.doppler.yaml`,
  `apps/react-native-template/.doppler.yaml`.
- **Referenced path drift.** Line 21-22 — `./scripts/doppler-init.sh` — script
  existence not verified in this pass; flag for follow-up if truly missing.
- **Suggested fix:** Land `docs/doppler.md` (see New-ADRs §6). Update the
  copy-from path to point at whichever of the four templates is canonical
  (recommend `apps/laravel-template/.doppler.yaml` for backend apps).

### `.kiro/steering/hierarchy.md`

- **Referenced path drift.**
  - Line 22 — cites `docs/domain-hierarchy.md` as consolidated INTO this file.
    That reads OK — the sibling doc is dropped intentionally.
  - Lines 437, 542, 565-568 — `apps/api/src/modules/**` — **does not exist**;
    apps are `apps/academorix/src/modules/**` (surfaced by standards-steward).
  - Line 573 — `apps/ai-service/src/modules/ai/src/Tools/<Module>/` — **does not
    exist**.
- **Rule vs code mismatch.** Line 437 says "today only `access/` + `tenancy/`
  are scaffolded" — actual `apps/academorix/src/modules/` ships four families
  (`sports/`, `finance/`, `growth/`, `products/`) plus every package under
  `packages/backend/**`; the sentence is a stale snapshot.
- **Dead ADR references.**
  - Lines 105, 631 — `docs/adr/0017-delete-workspace-terminology.md` — **file
    does not exist** (ADR-0017 is missing from `docs/adr/`).
  - Line 546 — ADR-0006, line 547 — ADR-0016, line 548 — ADR-0013 (which
    ADR-0016 supersedes), line 549 — ADR-0017 — all referenced but none of the
    referenced ADR files exist on disk.
- **Suggested fix:** Update the app-path references in the same PR that lands
  the missing ADRs (§New-ADRs #4-9).

### `.kiro/steering/package-architecture.md`

- **Referenced path drift.**
  - Line 29 — layout diagram opens with `stackra-backend/` — wrong root name
    (surfaced by grep).
  - Line 31 — `apps/template/`, similar drift.
  - Line 349 — "apps/api and apps/ai-service share database tables" — neither
    app exists (surfaced by backend-platform-reviewer boot-01).
  - Line 386 — `cd apps/api && composer require stackra/<name>:'*'` — same.
- **Dead ADR references.** Lines 413-415 cite ADR-0008 — **file does not
  exist**. Lines 120, 142 cite ADR-0016 — **file does not exist**.
- **Suggested fix:** Rewrite §Migrations ownership across apps to state the
  actual boundary; rewrite the shell examples to reflect actual apps.

### `.kiro/steering/settings.md`

- **Referenced path drift.** Line 25 —
  `apps/api/src/modules/tenancy/src/Settings/TenancySettings.php` — path doesn't
  exist.
- **Suggested fix:** Repoint to `apps/academorix/src/modules/**/Settings/*.php`
  or `packages/backend/**/Settings/*.php`.

### `.kiro/steering/console-commands.md`

- **Referenced path drift.** Line 9 — "surface is uniform across `apps/api`,
  `apps/ai-service`, `apps/template`" — three apps that don't exist.
- **Suggested fix:** Rewrite as `apps/academorix`, `apps/laravel-template` (and
  future backend apps as they land) — or drop the app enumeration and keep the
  sentence generic ("across every deployable app").

### `.kiro/steering/contract-implementer-split.md`

- **Referenced path drift.**
  - Lines 57, 114 — `apps/ai-service` referenced as the slim consumer of
    `authorization` (not `access`). App does not exist.
- **Dead ADR reference.** Line 19 —
  `docs/adr/0008-keep-authorization-and-access-split.md` — **file does not
  exist**. Line 183 same.
- **Suggested fix:** Update the slim-consumer example to name a REAL slim
  consumer, or park it as a hypothetical while `apps/ai-service` is deferred.

### `.kiro/steering/events-authoring.md`

- **Referenced path drift.** Multiple `apps/dashboard/src/**` references (lines
  55, 57, 74, 76, 202) — **`apps/dashboard/` does not exist** (surfaced by
  backend-platform-reviewer ci-01 as the same problem across CI + labeler +
  CODEOWNERS).
- **Suggested fix:** Rewrite the example listener paths to point at real
  packages (`packages/frontend/network/**`, `packages/frontend/query/**`,
  `packages/frontend/realtime/**`) or a hypothetical `apps/<app>/…` with an
  explicit "example" tag.

### `.kiro/steering/frontend-packages.md`

- **Dead ADR reference.** Line 9 —
  `docs/adr/0023-frontend-package-architecture.md` — **file does not exist**.
- **Referenced path drift.** Multiple lines reference "sibling repo"
  `stackra-frontend/packages/<name>/` (lines 15, 25, 31). This repo IS the
  frontend repo — `packages/frontend/**` is present, not a sibling repo.
- **Suggested fix:** Update the split-repo assumption. Either the frontend +
  backend live in ONE workspace (current reality) or they live in two — the doc
  must pick one and match.

### `.kiro/steering/octane-first-di.md`

- **Dead ADR reference.** Line 9 —
  `docs/adr/0025-runtime-target-laravel-octane.md` — **file does not exist**.
  `docs/adr/0025-*.md` DOES exist but is a DIFFERENT ADR
  (`integrations-two-lane-model`, added by ADR 0025 in this repo). Collision.
- **Suggested fix:** Two options: (a) renumber this repo's `0025` to `0027` and
  land the runtime-target ADR at `0025`; (b) land the runtime-target ADR at the
  next available number (`0027` today) and update this steering pointer. Option
  (b) is safer — never renumber accepted ADRs.

### `.kiro/steering/service-boundary.md`

- **Dead references.** Line 11 — `docs/service-boundary.md` — **file does not
  exist**. Line 12 — `docs/adr/0022-language-agnostic-service-boundary.md` —
  **file does not exist**. Line 13 — `docs/contracts/` — **directory does not
  exist**.
- **Consequence.** Every "pull in via `#service-boundary`" invocation resolves
  to a doc that says "see docs/service-boundary.md" which resolves to nothing.
  The steering is a dangling pointer chain.
- **Suggested fix:** Land the full boundary package as one PR:
  `docs/service-boundary.md` + `docs/adr/0022-…md` +
  `docs/contracts/README.md` + `docs/contracts/service-identity.schema.json` +
  `docs/contracts/service-jwt.schema.json`. See §New ADRs #1.

### `.kiro/steering/tenancy-columns.md`

- **Dead ADR reference.** Line 8 —
  `docs/adr/0024-row-level-attribution-three-axes.md` — **file does not exist**.
  `docs/adr/0024-*.md` DOES exist but is a DIFFERENT ADR
  (`enrollment-funnel-not-a-crm`). Collision — same shape as ADR-0025.
- **Content status.** The steering ITSELF is authoritative for §1-9 (per its own
  header). But the ADR anchor it names is dangling.
- **Suggested fix:** Same options as octane-first-di.md — either renumber this
  repo's 0024 or land the row-level-attribution ADR at the next available number
  (`0027` or later depending on the six new ADRs). Update the steering pointer.

### `.kiro/steering/blueprints.md`

- **Dead ADR references.** Lines 13, 82, 242, 255 —
  `docs/adr/0007-blueprint-invoke-vs-register.md` — **file does not exist**.
- **Suggested fix:** Land ADR-0007 (see §New ADRs) OR reword steering to be
  self-contained (drop the ADR anchor language).

### `.kiro/steering/cache-tag-resolvers.md`

- **Dead ADR references.** Lines 14, 281 —
  `docs/adr/0004-cache-tag-resolver-via-attribute.md` — **file does not exist**.
- **Suggested fix:** Land ADR-0004 (see §New ADRs).

### `.kiro/steering/enum-db-seed-dual-source.md`

- **Dead ADR references.** Lines 18, 152, 300, 317, 356, 358 —
  `docs/adr/0018-business-types-enum-primary-db-seed.md` AND
  `docs/adr/0011-seeder-discovery-via-attribute.md` — **neither file exists**.
- **Suggested fix:** Land ADR-0011 + ADR-0018 (see §New ADRs).

### `.kiro/steering/actions-only-full.md`

- **Dead ADR reference.** Line 17 —
  `docs/adr/0016-actions-only-no-services-no-controllers.md` — **file does not
  exist**.
- **Suggested fix:** Land ADR-0016 (see §New ADRs). This is the load- bearing
  ADR — every backend package cites it. Missing it is the biggest gap on the
  docs surface.

### `.kiro/steering/package-naming.md`

- **Forward reference.** Line 211 mentions "ADR-0027 (planned) — the vendor
  split ADR that formalises the Stackra + Stackra boundary" — no ADR-0027 exists
  yet. This is a legitimate future-work reference, not drift; noted here for
  tracking so it's not forgotten when ADRs 0027+ are allocated.

### Steering files that are clean

The following steering files were scanned and found free of dead-path / dead-ADR
/ reject-word drift as far as this pass could verify (some contain generic
phrases like "packages" that are correct):

`actions-only-full.md` (only the ADR-0016 anchor is dead — no path drift),
`browser-safe-imports.md`, `bootstrappers.md`, `code-standards.md`,
`communication-patterns.md`, `contract-reexports.md`, `conventions.md`,
`data-first.md`, `discovery-vs-loader.md`, `discovery.md`, `documentation.md`,
`domain-patterns.md`, `folder-conventions.md`,
`frontend-module-architecture.md`, `growth-and-observability.md`,
`localization-content-strategy.md`, `module-graph.md`, `module-lifecycle.md`,
`module-partitioning.md`, `package-conventions.md`, `php-attributes.md`,
`priority-ordering.md`, `scope.md`, `sdk-authoring.md`, `shell-commands.md`,
`storage-usage.md`, `support-utilities.md`, `tenancy-hooks.md`, `testing.md`,
`ui-components.md`, `ulid-prefix-registry.md`.

---

## Per-file drift findings — `docs/adr/**`

### `docs/adr/README.md` — the index

- **Numbering claim.** "The next available number is **0026**." — WRONG.
  ADR-0026 has already landed (`0026-agent-canonical-directory.md`). Next
  available is **0027**.
- **Index table.** Rows for ADRs 0001–0023 are collapsed into a single "See
  `stackra-backend/docs/adr/README.md`" pointer — that referenced location DOES
  NOT EXIST as a sibling directory in this workspace. Without the sibling repo
  present, the pointer is dead.
- **Missing row.** ADR-0026 exists on disk but has NO row in the index table.
- **Suggested fix:**
  1. Update "next available number is **0027**".
  2. Land 11 new rows in the index for ADR-0016, 0022, 0024 (row-level
     attribution), 0025 (Octane runtime), 0023, 0011, 0018, 0008, 0007, 0004,
     0017 — see §New ADRs for the full list.
  3. Add the missing ADR-0026 row.
  4. Explicitly note that this repo is authoritative — either drop the "See
     `stackra-backend/docs/adr/README.md`" fallback or replace with a one-line
     pointer to the parent workspace (per ADR-0026's Tier 1 model).

### `docs/adr/0024-enrollment-funnel-not-a-crm.md`

- **Status:** Accepted (correct).
- **Referenced code paths.** Blueprint paths
  (`modules/sports/blueprints/registrations/*`,
  `modules/platform/blueprints/forms/*`,
  `modules/platform/blueprints/integrations/*`) — not verified in this pass;
  flag for follow-up if the blueprint files are absent.
- **Referenced sibling ADR.** ADR-0016 (line 143) — **file does not exist**.
- **Enforcement line.** Not explicitly named — no PHPStan rule, no test
  reference. Enforcement is by convention.
- **ADR index row:** MISSING from `docs/adr/README.md` — wait, actually the
  README lists it (row exists). ✓
- **Number-collision problem.** This ADR occupies ADR-0024. Steering says
  ADR-0024 is "Row-level attribution: three-axes column contract". Two different
  documents claim the same number. See §New ADRs #4.
- **Suggested fix:** No change to THIS ADR. The collision resolves by
  renumbering the row-level attribution ADR that steering references (make it
  0027 or later).

### `docs/adr/0025-integrations-two-lane-model.md`

- **Status:** Accepted (correct).
- **Referenced ADRs.** Line 224 — ADR-0024 (this repo's enrollment funnel ADR) —
  ✓ exists on disk. Line 227 — `.kiro/steering/tenancy-columns.md` — ✓ exists.
- **Referenced code.** `modules/platform/blueprints/integrations/*` + `schemas/`
  — not verified.
- **Number-collision problem.** Occupies ADR-0025. Steering says ADR-0025 is
  "Runtime target: Laravel Octane". Same shape as 0024 collision.
- **Suggested fix:** No change to THIS ADR. The collision resolves by
  renumbering the Octane runtime-target ADR (make it 0027+ once other new ADRs
  are allocated).

### `docs/adr/0026-agent-canonical-directory.md`

- **Status:** Accepted (correct).
- **Referenced ADRs.** Line 34, 21 — self-references. Line 88 — the ADR's own
  Tier-1 parent workspace `stackra/` — Tier-1 workspace does not exist on disk
  (this is a proposed structure; the ADR IS the proposal).
- **Referenced files.** `AGENT_ROSTER.md` + `.kiro/agents/README.md` — both
  present. ✓
- **ADR index row:** MISSING from `docs/adr/README.md`. Add.
- **Suggested fix:** Add the index row.

---

## Top-level docs — `docs/**`

| Doc                             | Status  | Notes                                                                                                            |
| ------------------------------- | :-----: | ---------------------------------------------------------------------------------------------------------------- |
| `docs/architecture.md`          | MISSING | Referenced by `.kiro/steering/architecture.md`, `service-boundary.md`, agent charters. Every reviewer cited it.  |
| `docs/service-boundary.md`      | MISSING | Referenced by `.kiro/steering/service-boundary.md`, `docs-adr-steward.md`, `security-compliance-reviewer.md`.    |
| `docs/doppler.md`               | MISSING | Referenced by `.kiro/steering/doppler.md`, every reviewer charter.                                               |
| `docs/turbo-remote-cache.md`    | MISSING | Referenced by 4 reviewer charters + 2 steering docs (surfaced by backend-platform-reviewer turbo-04).            |
| `docs/migration.md`             | MISSING | Referenced by `.kiro/agents/docs-adr-steward.md` §Orient. Three-phase migration state undocumented.              |
| `docs/domain-hierarchy.md`      | MISSING | Referenced by `.kiro/steering/hierarchy.md` as "consolidated INTO the steering doc on 2026-07-14" — intentional. |
| `docs/package-authoring.md`     | MISSING | Referenced by `.kiro/agents/docs-adr-steward.md` + several agent charters.                                       |
| `docs/hierarchy.md`             | MISSING | Referenced by `.kiro/steering/hierarchy.md` as "see also" (line 15). Consolidation ambiguity.                    |
| `docs/backend-package-tiers.md` | PRESENT | Freshly reviewed — describes the four-tier taxonomy, matches actual `packages/backend/**` layout. ✓              |
| `README.md` (workspace root)    |  STALE  | Contents are the stock Vite + HeroUI template README. Never customised for this workspace. **P1 doc drift.**     |
| `AGENT_QUICKSTART.md`           | PRESENT | Content matches the agent-directory ADR-0026 model. ✓                                                            |
| `AGENT_ROSTER.md`               | PRESENT | Content matches ADR-0026. ✓                                                                                      |
| `SECURITY.md`                   | MISSING | Referenced by `.kiro/agents/security-compliance-reviewer.md` §Orient. **P1 doc gap.**                            |

### Top-level docs suggested fix order

1. Land `docs/architecture.md` — the load-bearing doc that every steering +
   agent charter cites. Contents should describe the ACTUAL tree (apps present,
   backend package layout, frontend package layout, `tools/cli/`,
   `blueprints/`). Also state the mono-vs-multi-repo posture.
2. Land `docs/doppler.md`, `docs/turbo-remote-cache.md`, and
   `docs/service-boundary.md` as one PR bundle — these are the three most- cited
   "See `docs/…`" targets.
3. Rewrite `README.md` — the workspace root README is the front door. Currently
   it is a stock Vite template. **This is the highest-visibility doc gap.**
4. Land `SECURITY.md` — every reviewer with a security lane grounds against it.
5. Land `docs/package-authoring.md` — cite the canonical layout from
   `.kiro/steering/package-architecture.md` and reference the tier taxonomy in
   `docs/backend-package-tiers.md`.
6. Land `docs/migration.md` — a short doc that describes what state the
   workspace is in today (post-rename, pre-boot, etc.) and what's outstanding.

---

## `docs/contracts/**` cross-service schemas

**Directory does not exist.** Every schema referenced across the agent +
steering surface is MISSING.

| Schema                                        | Present? | Version | ADR  | Runtime code match                      |
| --------------------------------------------- | :------: | ------- | ---- | --------------------------------------- |
| `docs/contracts/README.md`                    |   ❌ N   | n/a     | 0022 | n/a                                     |
| `docs/contracts/service-identity.schema.json` |   ❌ N   | n/a     | 0022 | Referenced by tenancy-columns §9 row 12 |
| `docs/contracts/service-jwt.schema.json`      |   ❌ N   | n/a     | 0022 | Referenced by tenancy-columns §9 row 13 |

**Downstream impact.**

- Every builder agent (`laravel-feature-builder`, `python-service-builder`) that
  reads the contract schemas can't ground its generated code.
- Every reviewer (`security-compliance-reviewer`, `test-mutation-engineer`) that
  verifies conformance against these schemas can't run its audit.
- The `ServiceAccount` model has already landed in
  `packages/backend/identity/service-accounts/src/Models/ServiceAccount.php`
  (surfaced by tenancy-compliance-auditor §Living gap register row 12) WITHOUT
  the schema present to ground it. This is a case of code drifting ahead of docs
  — the code was written to a contract that only lived in developers' heads.

**Suggested fix (schemas + companion ADR):**

- Land ADR-0022 first (see §New ADRs #1).
- Land `docs/contracts/README.md` describing the five contract rules (schemas
  are source-of-truth, HS256 fixed, default-deny abilities, every token
  tenant-scoped, backward-compat discipline).
- Land `docs/contracts/service-identity.schema.json` grounded against the live
  `ServiceAccount` model + `service_accounts` table + `abilities` field format.
- Land `docs/contracts/service-jwt.schema.json` grounded against the planned
  `ServiceJwt` signer + verifier (still pending per backend-platform-reviewer +
  tenancy-compliance-auditor §Living gap #13).

---

## New ADRs needed

Twelve ADRs need to be authored. Each row lists the title, the finding that
surfaced it, and the sibling agent that owns the fact base (docs-adr-steward
authors the ADR text; the fact-base owner supplies the rationale, options, and
consequences).

| #   | Title                                                                                                    | Rationale (source finding)                                                                                                                         | Owning agent (fact base)                     |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Restore ADR-0004 — Cache-tag resolver via attribute discovery                                            | `.kiro/steering/cache-tag-resolvers.md` "ADR anchor" is dead                                                                                       | backend-architecture-reviewer                |
| 2   | Restore ADR-0007 — Blueprint `__invoke()` vs static `register()`                                         | `.kiro/steering/blueprints.md` "ADR anchor" is dead                                                                                                | backend-architecture-reviewer                |
| 3   | Restore ADR-0008 — Keep `authorization` + `access` split                                                 | `.kiro/steering/contract-implementer-split.md` "ADR anchor" is dead                                                                                | backend-architecture-reviewer                |
| 4   | Restore ADR-0011 — Seeder discovery via `#[AsSeeder]`                                                    | `.kiro/steering/enum-db-seed-dual-source.md` "ADR anchor" is dead                                                                                  | backend-architecture-reviewer                |
| 5   | Restore ADR-0016 — Actions-only; no services, no controllers                                             | `.kiro/steering/actions-only-full.md` "ADR anchor" is dead; every backend package cites it                                                         | backend-architecture-reviewer                |
| 6   | Restore ADR-0017 — Delete `Workspace` terminology (Workspace → Tenant rename)                            | `.kiro/steering/hierarchy.md` lines 105, 631 dead. Standards-steward flagged ~49 residual `Workspace` strings                                      | backend-architecture-reviewer                |
| 7   | Restore ADR-0018 — Business types enum primary + DB seed dual-source                                     | `.kiro/steering/enum-db-seed-dual-source.md` "ADR anchor" is dead                                                                                  | backend-architecture-reviewer                |
| 8   | Restore ADR-0022 — Language-agnostic service boundary + four seams                                       | `.kiro/steering/service-boundary.md` links dead. Blocks every `docs/contracts/**` schema                                                           | solution-architect + security-lead           |
| 9   | Restore ADR-0023 — Frontend package architecture (DI-first mirror of backend, no refine.dev)             | `.kiro/steering/frontend-packages.md` "ADR anchor" is dead                                                                                         | frontend architecture reviewer               |
| 10  | ADR-002X — Row-level attribution: three-axes column contract                                             | Currently steering-only; needs an ADR anchor. Steering says ADR-0024 but that number is taken                                                      | data-modeler + backend-architecture-reviewer |
| 11  | ADR-002X — Runtime target: Laravel Octane                                                                | Currently steering-only. Steering says ADR-0025 but that number is taken                                                                           | backend-platform-reviewer                    |
| 12  | ADR-002X — Agent + docs canonical directory tier (workspace root name reconciliation)                    | Repo directory is `academorix-frontend/` but every agent charter targets `stackra-frontend/` or `stackra-backend/`. Naming ADR needed to reconcile | chief-orchestrator + docs-adr-steward        |
| 13  | ADR-002X — Audit + Activity module consolidation (`shared/audit` + `observability/audit`)                | tenancy-compliance-auditor VIO-021 blocks migrations; needs an ownership decision                                                                  | data-lead + backend-architecture-reviewer    |
| 14  | ADR-002X — §2 8-row list extension for central-plane infrastructure rows                                 | tenancy-compliance-auditor VIO-008/009/010/014 — 4 rows carry `application_id` legitimately outside the 8-row lock                                 | data-modeler                                 |
| 15  | ADR-002X — Payment_methods ownership (gateway vs payment module)                                         | tenancy-compliance-auditor WARN-005 — two migrations collide                                                                                       | data-modeler                                 |
| 16  | ADR-002X — Activities vs `activity_log` naming reconciliation                                            | tenancy-compliance-auditor WARN-008 — code table name diverges from steering                                                                       | data-modeler                                 |
| 17  | ADR-002X — Tenancy-hook wiring event surface (Stancl vs middleware-driven)                               | backend-architecture-reviewer §Bootstrapper vs TenancyHook + backend-platform-reviewer boot-01                                                     | backend-architecture-reviewer                |
| 18  | ADR-002X — Octane driver choice (Swoole vs Roadrunner)                                                   | backend-platform-reviewer §Open questions #3                                                                                                       | backend-platform-reviewer                    |
| 19  | ADR-002X — Composer publish destination (Packagist / private Satis / path-repo forever)                  | backend-platform-reviewer §Open questions #4                                                                                                       | backend-platform-reviewer + release-manager  |
| 20  | ADR-002X — Workspace reorg (removal of `apps/dashboard`, `apps/api`, `apps/ai-service`, `apps/template`) | Every reviewer surfaces stale references; ADR fixes the record                                                                                     | solution-architect + docs-adr-steward        |
| 21  | ADR-002X — `stackra-platform/application-sdk` sub-vendor justification                                   | `.kiro/steering/package-naming.md` requires an ADR for a new sub-vendor. See backend-architecture-reviewer §Top-P0 #12                             | solution-architect                           |

Numbering — with 3 ADRs already at 0024/0025/0026, the next continuous range is
`0027` through `0047`. Twelve new ADRs (rows 8–21) + eleven restored ADRs (rows
1–7 + 10–11) = 23 total; if we allocate strictly forward from 0027 the range
consumes 0027–0049.

**Renumber-vs-restore decision** (needs `chief-orchestrator` sign-off):

- Option A — keep this repo's 0024 + 0025 as-is and place every referenced ADR
  (row-level-attribution, Octane) at the next available number. Update every
  steering `docs/adr/00XX-*` link. Pros: never touch existing accepted ADRs.
  Cons: steering pointers to "ADR-0024" now mean the row-level- attribution ADR,
  which lives at 0027+, which is confusing.
- Option B — renumber this repo's 0024 + 0025 out of the way (rare, but the
  existing numbers may have been chosen without knowing about the
  stackra-backend sibling repo's continuous numbering). Pros: aligns numbers
  with steering claims. Cons: breaks the ADR-README claim "Never delete an ADR;
  Never renumber" and touches supersession chains.

**Recommendation:** Option A. Never renumber. Fix the pointers.

---

## Suggested fix order

Ordered by (a) unblocker priority and (b) commit granularity. Each numbered item
fits one docs PR.

1. **HIGHEST — Land the service-boundary bundle.** Blocks every cross-service
   contract test, blocks the `ServiceAccount` code that already landed, blocks
   security-lane review. Files:
   `docs/adr/0027-language-agnostic-service-boundary.md` (was ADR-0022;
   renumbered per Option A), `docs/service-boundary.md`,
   `docs/contracts/README.md`, `docs/contracts/service-identity.schema.json`,
   `docs/contracts/service-jwt.schema.json`. Coordinate with
   `security-compliance-reviewer` for the JWT verifier spec.
2. **HIGHEST — Land the six load-bearing "restored" ADRs.** Priority order: 0016
   (actions-only), 0017 (workspace terminology), 0018 + 0011 (business types +
   seeder discovery), 0004 (cache-tag), 0007 (blueprint invoke), 0008
   (auth-access split), 0023 (frontend package architecture). Every ADR is small
   (~200 lines). Batch as 3 PRs of ~2-3 ADRs each. Update every steering
   `docs/adr/00XX-*` link in the same PR.
3. **HIGH — Land the row-level-attribution ADR at the next number.** Currently
   the steering says ADR-0024 but the number is taken. Number it 0028
   (post-service-boundary) and update `.kiro/steering/tenancy-columns.md`'s
   ADR-anchor pointer.
4. **HIGH — Land the Octane-runtime ADR at the next number.** Currently the
   steering says ADR-0025 but the number is taken. Number 0029. Update
   `.kiro/steering/octane-first-di.md`'s ADR-anchor pointer.
5. **HIGH — `docs/adr/README.md` index update.** Add rows for every ADR in
   `docs/adr/` after batches 1-4 land. Update "next available number" pointer.
   Update the "See `stackra-backend/docs/adr/README.md`" fallback to reflect the
   new ADR home (this repo).
6. **HIGH — Rewrite `README.md`.** Workspace root README currently ships as
   stock Vite/HeroUI template text. Every human landing on the repo reads this
   first. Rewrite as a short description of the monorepo + link to
   `AGENT_QUICKSTART.md` + `docs/architecture.md`.
7. **HIGH — Land the missing top-level docs bundle.** `docs/architecture.md`,
   `docs/doppler.md`, `docs/turbo-remote-cache.md`, `docs/migration.md`,
   `docs/package-authoring.md`, `SECURITY.md`. Each small; batch as 2 PRs of 3
   docs each. Every doc must match the ACTUAL tree.
8. **MEDIUM — Sweep steering path drift.** One PR per steering file OR one bulk
   PR. Files: `architecture.md`, `models.md`, `docblocks.md`, `doppler.md`,
   `hierarchy.md`, `package-architecture.md`, `settings.md`,
   `console-commands.md`, `contract-implementer-split.md`,
   `events-authoring.md`, `frontend-packages.md`. Replace `stackra-backend`,
   `apps/api`, `apps/ai-service`, `apps/template`, `apps/dashboard`,
   `old/backend` — with the canonical current paths.
9. **MEDIUM — Land the twelve remaining new ADRs** (workspace-reorg, sub-
   vendor, audit consolidation, §2 extension, payment_methods, activity naming,
   tenancy-hook wiring, Octane driver, composer publish destination). Sequence:
   fact-owning agent (data-modeler, backend- architecture-reviewer,
   backend-platform-reviewer) authors the rationale; docs-adr-steward lands the
   ADR text.
10. **LOW — Nudge the parent workspace bootstrap** (per ADR-0026). Once steering
    is clean + top-level docs land, evaluate whether Tier-1 assets should move
    to a real parent `stackra/` workspace. Decision belongs to
    `chief-orchestrator`.

---

## Cross-agent handoffs

Findings that require another agent's write lane or fact base before docs can
close.

### To `laravel-feature-builder`

- **models.md reference paths.** Every `old/backend/**` reference in
  `.kiro/steering/models.md` needs a live-code equivalent. Nominate which
  package under `packages/backend/**` is CANONICAL for models + interfaces +
  migrations + factories + repositories. Feature-flags was flagged by
  standards-steward as an exemplar; confirm.
- **docblocks.md canonical paths.** Same for config file docblocks, factory
  docblocks, repository docblocks, enum docblocks.

### To `backend-architecture-reviewer`

- **ADRs 0004, 0007, 0008, 0011, 0016, 0017, 0018, 0023.** These ADRs exist in
  the referenced-sibling-repo model but not on disk. Provide the rationale,
  options, and consequences narrative for each so docs-adr- steward can author
  the ADR text. Rows 1-9 in the New-ADRs table.

### To `backend-platform-reviewer`

- **Octane driver ADR (row 18).** Provide the profiling evidence + build- matrix
  trade-offs (Swoole vs Roadrunner). Referenced by
  `.kiro/steering/octane-first-di.md`.
- **Composer publish destination ADR (row 19).** Provide the platform-side
  requirements (Packagist rate limits, Satis maintenance cost, path-repo
  forever + auto-sync script implications).

### To `data-modeler` + `data-lead`

- **Row-level attribution ADR (row 10).** Move
  `.kiro/steering/tenancy-columns.md` §1-5 into an ADR body. §§6-9 stay in
  steering as the enforcement tail.
- **§2 8-row list extension ADR (row 14).** Which infrastructure rows earn a
  direct `application_id` cascade past the 8-row lock? Provide the design note.
- **Payment_methods ownership ADR (row 15).** Nominate gateway vs payment module
  as canonical owner.
- **Activities/activity_log naming ADR (row 16).** Rename table OR update
  steering + hierarchy.md.
- **Audit consolidation ADR (row 13).** Which of `shared/audit` +
  `observability/audit` owns the `audits` table? Blocks `php artisan migrate`.
- **§14 belongs-to matrix update** (WARN-004 from tenancy-compliance- auditor).
  Not an ADR — inline hierarchy.md update. Add rows for `age_groups`, `events`,
  `seasons`, `orders`, `expenses` with `organization_id`.

### To `security-compliance-reviewer` + `security-lead`

- **Service-boundary ADR + contracts.** Authoritative source for
  `docs/contracts/service-identity.schema.json` +
  `docs/contracts/service-jwt.schema.json`. Blocks every downstream reviewer
  that grounds against these schemas.

### To `chief-orchestrator`

- **Workspace-root name reconciliation.** Repo is `academorix-frontend/`; every
  agent charter targets `stackra-*`. Either rename the repo or update every
  charter. Needs a leadership call.
- **Renumber-vs-restore.** Ratify Option A (never renumber) for the 0024/0025
  collision described above.
- **Sibling-repo dependency.** `docs/adr/README.md` claims "Rows 0001-0023
  originate at `stackra-backend/docs/adr/`" — that sibling directory does not
  exist in this workspace. Ratify whether (a) the sibling repo needs to be
  present alongside this one (per ADR-0026 Tier-1 model), or (b) the ADRs are
  copied into this repo (per the "restored" ADRs in the new-ADRs table).

### To `solution-architect`

- **Workspace-reorg ADR (row 20).** Document the removal of `apps/dashboard`,
  `apps/api`, `apps/ai-service`, `apps/template` — why they were removed and
  what replaces them.
- **`stackra-platform/application-sdk` sub-vendor ADR (row 21).** Per
  `.kiro/steering/package-naming.md` Rule 3 the sub-vendor requires 3+ packages
  to justify itself. Decide whether the sub-vendor stays or collapses to
  `stackra/platform-application-sdk`.

---

## Lint + link hygiene (deferred to fix phase)

Per the task's hard constraints ("The ONE write allowed for this pass is your
report… no code edits") this pass does not run `markdownlint-cli2` or `lychee`.
Both should run before every fix PR merges.

- **`markdownlint-cli2 "docs/**/*.md" ".kiro/steering/**/*.md"`** — no fix-pass
  output yet.
- **`lychee --config .github/lychee.toml docs/ .kiro/steering/`** — no fix-pass
  output yet. Given the volume of dead ADR + doc references documented above,
  expect a red run on the current tree.

---

## Drift flagged for humans (code drifted ahead of docs)

Cases where the CODE moved without the DOC being updated. This report records
them for human triage — the docs steward's fix is to update the doc, but the
underlying cause is code-side drift that another agent should close.

1. **`ServiceAccount` model landed WITHOUT the
   `docs/contracts/service-identity.schema.json` schema present.** Model at
   `packages/backend/identity/service-accounts/src/Models/ServiceAccount.php`.
   Schema referenced by `.kiro/agents/security-compliance-reviewer.md:38`,
   `.kiro/agents/test-mutation-engineer.md:54`,
   `.kiro/agents/standards-steward.md:133`, `tenancy-columns.md §9 row 12`.
2. **`apps/dashboard/` referenced 12+ times across CI + agent charters +
   steering — path never existed.** Surfaced by backend-platform-reviewer ci-01.
   The docs referenced code that never landed.
3. **`stackra-backend/**` paths across steering — repo was renamed to
   `academorix-frontend/**` but steering + agent charters were not swept.**
   Surfaced by standards-steward + this pass.
4. **`apps/api/**` referenced across hierarchy.md, docblocks.md,
   package-architecture.md, settings.md, console-commands.md — the app was never
   scaffolded.** Every reviewer that resolved these paths hit a dead pointer.
5. **`old/backend/**` referenced across models.md + docblocks.md —
   reference-material directory was removed.** Every author reading the
   "canonical example" gets nothing.
6. **`docker/` referenced in `.kiro/steering/architecture.md` §Layout —
   directory never existed.** backend-platform-reviewer container-01.
7. **`config/phpstan-base.neon` + `config/pint.json` referenced by every backend
   `phpstan.neon` + Turbo shim — neither file exists.**
   backend-platform-reviewer turbo-02. Docs consequence: any doc that cites
   "PHPStan max" or "Pint format" is grounded against a non-existent baseline.
8. **`.changeset/` directory referenced by every changeset script in
   `package.json` — directory does not exist.** backend-platform-reviewer
   release-01. Docs consequence: `AGENT_QUICKSTART.md` "Recipe 5 — Ship +
   Operate" cites the changeset flow.

**All eight rows are code-drift-ahead-of-docs cases.** The docs steward cannot
fix them (out of write lane); the code owners must decide whether to land the
missing artefact or update the docs to admit its absence.

---

## What's solid (preserve)

- **ADR-0026 (agent canonical directory)** — well-structured, load-bearing,
  correctly cited by `.kiro/agents/README.md` and `AGENT_ROSTER.md`. Match its
  shape when authoring every new ADR.
- **`.kiro/steering/tenancy-columns.md`** — content is authoritative and
  self-sufficient (§1-9 read as a complete rule set). Only the ADR anchor
  pointer is dead. Fixing the pointer + landing the row-level-attribution ADR
  closes the last gap.
- **`.kiro/steering/hierarchy.md`** — thorough terminology lock-in; ADR-0017
  reference is dead but the doc itself is a complete substitute until ADR-0017
  lands.
- **`docs/backend-package-tiers.md`** — matches actual tree, uses correct paths
  (`packages/backend/**`, `apps/academorix/src/modules/**`), no stale
  references. Model for how top-level docs should be written.
- **`AGENT_ROSTER.md` + `AGENT_QUICKSTART.md`** — reflect the ADR-0026 model,
  cite the correct file paths, no drift.
- **`.kiro/agents/README.md`** — Tier-1/2/3 model documented, correctly cites
  ADR-0026, matches ADR-0026's rollout timeline.

---

## Report metadata

- Report path: `.kiro/reports/docs-adr-steward-2026-07-21.md`
- Generated by: `docs-adr-steward` agent
- Sibling reports read: 5
- Files written this pass: 1 (this report)
- Files edited this pass: 0
- Code changed: 0
- Git operations: none
