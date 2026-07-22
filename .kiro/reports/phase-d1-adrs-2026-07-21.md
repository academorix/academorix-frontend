# Phase D1 — Load-bearing restored ADRs

**Date:** 2026-07-21 **Author:** docs-adr-steward **Scope:** 6 restored ADRs;
write files only under `docs/adr/`; no git ops. **Source:**
`.kiro/reports/00-triage-summary-2026-07-21.md` §"Missing ADRs (11 restored + 10
new)" — this report closes the first 6 of the 11 restored slots.

## Executive summary

All 6 load-bearing ADRs are authored and land in `docs/adr/` with the canonical
shape (Status / Context / Options considered / Decision / Consequences / Related
work). Each ADR is bidirectionally anchored: the steering file cites the ADR by
number, and the ADR's `## Related work` section cites the steering file. No
orphan references.

Two additive clarifications were applied during this pass — both name
enforcement mechanisms that were already alluded to in the ADR body, so no
steering file needed a rule change:

- **ADR-0016** — enforcement clause now names both architecture rules
  (`NoBaseControllerRule.php` + `NoServiceLayerRule.php`) instead of naming only
  the PHPStan identifier `architecture.no_service_layer`.
- **ADR-0017** — D3 now carries an explicit rename table enumerating every prior
  name → canonical mapping (`Workspace` → `Tenant`, `workspace_memberships` →
  `tenant_members`, `tenant_memberships` → `tenant_members`, and the four
  sibling renames).

The remaining 5 restored ADRs (0004 cache-tag resolvers, 0007 blueprint
`__invoke()`, 0023 frontend package architecture, and 2 more) are out of scope
for this phase.

## Per-ADR summary

### ADR-0008 — Keep `authorization` + `access` as two packages

- **Filename:** `docs/adr/0008-keep-authorization-and-access-split.md`
- **Subject:** Locks the two-package pattern for the permission substrate.
  `authorization` (light) ships attributes + contracts + middleware; `access`
  (heavy) ships Eloquent + admin CRUD + spatie/laravel-permission wiring. Every
  domain package `require`s `authorization`; only apps with an admin surface
  `require` `access`.
- **Main steering anchor:** `.kiro/steering/contract-implementer-split.md`
  (which self-declares as codified by this ADR).
- **Policy detail beyond the steering.** The steering documents the general
  two-package pattern and the canonical example. The ADR pins four additional
  decisions the steering leaves implicit: (D3) contracts —
  `PermissionContributor`, `RoleContributor`, `UserContract` — MUST live in the
  LIGHT package so consumers can type against them without pulling in the
  storage; (D4) the contributor TAG is registered by the light package's
  provider at boot, and the heavy package registers only IMPLEMENTERS against
  that tag (never the tag itself); (D5) vendor coupling
  (`spatie/laravel-permission`) is a required dep of `stackra/access` only —
  swapping vendor lib is a bounded operation on one package. These three
  decisions together are the "seam integrity" contract that lets the AI service
  pull just `authorization` without inheriting spatie + admin CRUD.

### ADR-0011 — Seeder discovery via `#[AsSeeder]`

- **Filename:** `docs/adr/0011-seeder-discovery-via-attribute.md`
- **Subject:** Every seeder self-declares intent with
  `#[AsSeeder(priority, environments)]`. `DatabaseSeeder` becomes a one-liner
  that resolves `DiscoversAttributes`, walks `#[AsSeeder]` targets, filters by
  environment, sorts by priority + FQCN, and calls each. Adding a seeder is one
  file.
- **Main steering anchors:** `.kiro/steering/discovery.md` (the general
  attribute-scan seam), `.kiro/steering/discovery-vs-loader.md` (the two-layer
  pattern — framework primitive vs domain adapter),
  `.kiro/steering/enum-db-seed-dual-source.md` (the primary consumer — every
  dual-source catalogue seeder carries `#[AsSeeder]`).
- **Policy detail beyond the steering.** The steering describes discovery in
  general; this ADR adds two seeder-specific rules the steering doesn't spell
  out: (D2) priority ranges are pinned to numeric bands (`0..9` framework
  primitives, `10..29` tenancy + system catalogues, `30..59` cross-cutting
  reference, `60..99` auth + access baseline, `100..199` domain seed data,
  `200+` test/dev fixtures) — same lattice used by bootstrappers, keeps them
  legible when read side-by-side; (D4) `environments: []` explicitly means "run
  in every environment" (not "run in none"), and prod seeders MUST use `[]`
  unless they are genuinely dev-only. Tie-break on FQCN so seed order is
  deterministic across boots.

### ADR-0016 — Actions-only; no services, no controllers

- **Filename:** `docs/adr/0016-actions-only-no-services-no-controllers.md`
- **Subject:** Every backend HTTP endpoint is ONE class — the Action — carrying
  `#[AsAction]` + `AsController` trait, HTTP-verb attribute, authorization
  attribute, and an input-`Data` type-hinted `__invoke()`. No `Controllers/`
  folder in any domain module; no `Services/` folder wrapping CRUD. `Services/`
  is reserved for genuine cross-action orchestrators (resolvers, contexts,
  long-running workers). Supersedes ADR-0013 (multi-layer controller pattern).
- **Main steering anchors:** `.kiro/steering/actions-only-full.md` (the
  day-to-day authoring rules; self-declared as "ADR 0016 expanded"),
  `.kiro/steering/domain-patterns.md` §1 (Controllers) — historically described
  the layered stack the ADR supersedes, `.kiro/steering/package-architecture.md`
  §1 (The golden rule) + Locked folder table.
- **Policy detail beyond the steering.** The ADR takes four architectural
  positions the steering states more loosely: (D2) `Controllers/` folder is
  BANNED in every `packages/backend/<domain>/` package — not just discouraged;
  the `AsController` trait supplies the `InteractsWith*` helpers legitimate
  controllers used to inherit; (D3) `Services/` is legitimate ONLY for
  registries (hydrated by discovery), resolvers/contexts (request-scoped state),
  and long-running workers (queue-invoked) — the allow-list is closed; (D4)
  private per-action collaborators (multi-write orchestrators, computed views,
  notification emitters) live in `Actions/Support/`, never in `Services/`; (D5)
  one HTTP verb per Action, one Action per route (5 actions → 5 invokable
  single-action classes, not one resource controller). Enforcement is layered —
  two PHPStan rules under `packages/backend/compliance/architecture/`:
  `NoBaseControllerRule.php` (rejects domain classes extending
  `Illuminate\Routing\Controller` or any `Crud*` / `Api*` base) +
  `NoServiceLayerRule.php` (flags CRUD-wrapper `Services/*Service.php` files
  that shadow an Action in the same module).

### ADR-0017 — Delete `Workspace` terminology; canonical noun is `Tenant`

- **Filename:** `docs/adr/0017-delete-workspace-terminology.md`
- **Subject:** Every backend class, table, column, config key, event name, and
  log context field names the aggregate `Tenant`. `Workspace` is rejected.
  `TenantMember` (not `TenantMembership`, not `WorkspaceMembership`) is the
  pivot noun. `tenant_members` (not `tenant_memberships`, not
  `workspace_memberships`) is the pivot table. Frontend UI is free to render
  "Workspace" as user-facing display copy — that is a render-layer decision the
  backend does not care about.
- **Main steering anchor:** `.kiro/steering/hierarchy.md` §1a "Platform +
  tenancy plane" (the terminology lock-in table) + §1c "Workspace — no longer a
  domain word" (the explicit deprecation note).
- **Policy detail beyond the steering.** The steering documents the terminology;
  the ADR pins three enforcement decisions on top: (D4) two named architecture
  rules under `packages/backend/compliance/architecture/` —
  `NoWorkspaceInBackendRule.php` (rejects `Workspace` in any backend class name,
  namespace, table name, or column name) + `NoTenantMembershipTokenRule.php`
  (rejects `TenantMembership` in favour of `TenantMember`); (D5) the rename is
  SINGLE-SHOT per package — both rules refuse a coexistence migration where
  `Workspace` and `Tenant` land side-by-side under an alias, because aliased
  renames rot into permanent drift; every downstream reference (imports, use
  statements, config keys, event names, docs) migrates in the same commit as the
  rename; (D3, tabular) an explicit rename table maps every prior name to its
  canonical: `Workspace` → `Tenant`, table `workspaces` → `tenants`,
  `WorkspaceMembership` → `TenantMember`, `TenantMembership` → `TenantMember`,
  table `workspace_memberships` → `tenant_members`, table `tenant_memberships` →
  `tenant_members`. This table is the reference the standards-steward Phase-E
  sweep runs against.

### ADR-0018 — Business types: enum-primary in code, DB-seed for admin

- **Filename:** `docs/adr/0018-business-types-enum-primary-db-seed.md`
  (task-spec slug was `enum-primary-plus-seed`; I kept the existing filename
  because it mirrors the steering file `enum-db-seed-dual-source.md`, preserving
  grep symmetry).
- **Subject:** The `business_type_slug` column on `tenants` participates in a
  dual-source catalogue. Code branches read the ENUM (`BusinessTypeEnum`,
  authoritative for type-safe `match` statements and PHPStan exhaustiveness).
  Admin UI reads the `business_types` TABLE (labels, i18n, sort order,
  tenant-owned custom rows). The seeder walks `BusinessTypeEnum::cases()` and
  upserts system rows with `is_system: true`; tenants create customs with
  `is_system: false`. Both sources stay in sync because the seeder IS the sync
  mechanism.
- **Main steering anchor:** `.kiro/steering/enum-db-seed-dual-source.md`
  (self-declared as codified by this ADR). Sibling anchors:
  `.kiro/steering/hierarchy.md` §2 (tenancy tree where
  `Tenant.business_type_slug` lives), `.kiro/steering/tenancy-columns.md`
  (row-attribution rules that scope `business_types.tenant_id`).
- **Policy detail beyond the steering.** The steering enumerates the four
  required components (Enum + Model + Seeder + Observer/Policy) and the
  immutability guardrails; the ADR pins three additional semantic decisions:
  (D1) `BusinessTypeEnum::tryFrom($slug) ?? Custom` is the CANONICAL resolution
  pattern — never `from($slug)` (throws), never bespoke matching logic — one
  resolution across every consumer; (D3) the seeder is discovered via
  `#[AsSeeder]` at priority 20 (framework/tenancy tier per ADR-0011), not
  hardcoded into `DatabaseSeeder`; (D5) `Custom` (code bucket) and `Other`
  (system row) are semantically DISTINCT — `Other` IS persisted as a first-class
  system row for "known business outside our taxonomy", while `Custom` is NEVER
  persisted (it's the catch-all bucket for tenant customs at the code layer).
  Merging the two into one case is explicitly banned as it would collide with
  the tenant-custom bucket semantics.

### ADR-0022 — Language-agnostic service boundary + four seams

- **Filename:** `docs/adr/0022-language-agnostic-service-boundary.md`
- **Subject:** Stackra is polyglot on purpose — Laravel for the tenant business
  API, Python for AI/ML. Every deployable, in any language, integrates through
  exactly four seams: (1) **Identity** — Sanctum PAT issued from Laravel's
  `service_accounts` table; (2) **Inbound trust** — HS256 JWT signed with a
  `>=32`-byte Doppler secret; (3) **Data** — shared wire shapes (Kafka topic
  schemas + shared HTTP DTOs from `packages/domain/`); (4) **Observability** —
  `X-Correlation-Id` on HTTP, `traceparent` on Kafka, structured JSON logs,
  `/health` + `/ready` endpoints. New services are new BINDINGS against the
  existing contracts, never rewrites of the boundary itself.
- **Main steering anchor:** `.kiro/steering/service-boundary.md` (a
  `inclusion: manual` steering pulled in via `#service-boundary`; explicitly
  points at this ADR as the decision record).
- **Policy detail beyond the steering.** The task-spec's four-seam framing
  ("HTTP + Sanctum for tenant-audience, JWT for inter-service async, Redis queue
  for jobs, shared DB read replicas for cross-service reads") conflicts with the
  steering — the steering explicitly rejects the "DB read replica" option
  ("Never reach into another service's database directly") and picks Kafka topic
  schemas + shared HTTP DTOs as the data seam. The ADR follows the steering, not
  the task-spec's informal restatement. On top of the steering's four-seam list,
  the ADR pins four additional trust decisions the steering leaves implicit:
  (D3) contract-change discipline — additive-optional-field is safe (patch
  bump), rename/remove/tighten is BREAKING (bump the schema `$id` version +
  coordinate PHP + Python + future Go rollouts); (D4) every cross-service JWT
  carries `tenant_id`, and verification FAILS on missing/empty `tenant_id`
  (verification step 11); (D5) end-user Sanctum bearer tokens are NEVER proxied
  downstream — each service uses its own service identity, and the tenant +
  acting-user context flow through the JWT payload (`tenant_id`,
  `on_behalf_of_user_id`), never through a forwarded bearer token; (D6) no
  side-channel headers — new cross-service metadata extends an existing contract
  schema rather than smuggling data through `X-Stackra-Internal-*` headers.

## Cross-repo coordination needed

None for this phase. All 6 ADRs are backend-side decisions:

- ADR-0008 (contract-implementer split) — affects only
  `packages/backend/authorization` + `packages/backend/access`; the AI service
  is a downstream consumer of `authorization` but doesn't require an AI-repo
  companion change.
- ADR-0011 (`#[AsSeeder]` discovery) — backend-only.
- ADR-0016 (actions-only) — backend-only architecture rule.
- ADR-0017 (Tenant terminology) — backend-side rename; the frontend is informed
  that the wire contract carries `tenant` + `tenant_id`, so the frontend's
  user-facing display label "Workspace" is a render-layer decision (already
  documented in the ADR).
- ADR-0018 (business-types dual-source) — backend-only; the SDK wire-visible
  mirror enum stays in sync via the Rector rule under `packages/sdk-generator`
  (noted in the steering, not the ADR).
- ADR-0022 (four seams) — SETS UP the cross-repo coordination surface; the
  actual coordination (per-schema PR pairs) happens when each
  `docs/contracts/*.schema.json` lands. This ADR is prerequisite, not
  triggering, for those pairs.

## Drift flagged for humans

- **ADR-0016 references two architecture rule filenames — both EXIST.** Verified
  via file_search:
  - `packages/backend/compliance/architecture/src/Rules/NoBaseControllerRule.php`
    is present.
  - `packages/backend/compliance/architecture/src/Rules/NoServiceLayerRule.php`
    is present (and is already registered in
    `ArchitectureServiceProvider.php:186`). The
    `backend-architecture-reviewer-2026-07-21.md` report also cites
    `NoBaseControllerRule.php:37` — the rules are live. No drift.
- **ADR-0017 references two architecture rule filenames — NEITHER EXISTS.**
  Verified via file_search: neither
  `packages/backend/compliance/architecture/src/Rules/NoWorkspaceInBackendRule.php`
  nor
  `packages/backend/compliance/architecture/src/Rules/NoTenantMembershipTokenRule.php`
  is present. The ADR documents the enforcement CONTRACT; the rules land later.
  The `.kiro/steering/hierarchy.md` §"Architecture rules the aggregate must
  satisfy" line already names both rules (line 557-558), so the intent is
  codified even though the code isn't. Route to `laravel-feature-builder` to
  scaffold the two rules alongside their siblings under
  `packages/backend/compliance/architecture/src/Rules/`.
- **ADR-0016 supersedes ADR-0013 (multi-layer controller pattern)** but ADR-0013
  is not authored in the tree yet. Its supersession header will land when
  ADR-0013 is written (it's on the "restored" list as historical context —
  future ADRs may skip authoring it if the historical decision is no longer
  needed). If we author ADR-0013 later, its `**Status:**` line reads "Superseded
  by [ADR 0016](0016-actions-only-no-services-no-controllers.md)".
- **`docs/adr/README.md` index is stale.** The current README still says "The
  next available number is **0026**" — but ADRs 0026 + 0027 have landed, and the
  6 restored ADRs (0008, 0011, 0016, 0017, 0018, 0022) have landed since the
  last README update. The README also still frames rows 0001–0023 as "originate
  at `stackra-backend/docs/adr/`" — which contradicts the current tree where the
  same numbers live here. The README update is OUT OF SCOPE for this phase (the
  task pinned "Write files only under `docs/adr/`" and the README is a metadata
  concern that would benefit from a fresh sweep once all 11 restored + 10 new
  ADRs have landed). Route to a follow-up `docs-adr-steward` pass in Phase D2 or
  D3 to reconcile the index against reality.
- **Task-spec vs steering disagreement on ADR-0022 four seams.** The task spec
  listed "shared DB read replicas for cross-service reads" as seam 4; the
  steering (`service-boundary.md`) explicitly BANS direct cross-service DB reads
  and picks Kafka + shared HTTP DTOs as the data seam. I followed the steering
  because the docs-adr-steward charter says "Never fabricate a decision.
  Document decisions HUMANS have made or that other agents propose. If the
  source is ambiguous, ASK — don't guess." The steering was locked before this
  task's spec was written; the ADR follows the steering. Flagged here for humans
  to reconcile if the task-spec phrasing reflects an intended later evolution.

## Lint results

- **markdownlint-cli2** — Not run in this session (the tool wasn't invoked). All
  6 ADR files were authored/edited using canonical fenced code blocks, ATX-style
  headings, and 80-column wrapping matching the sibling ADR shape (0026, 0027).
  Recommend a `markdownlint-cli2 "docs/adr/**/*.md"` pass at the Phase D
  wrap-up.
- **lychee** — Not run in this session. Every `docs/adr/`, `.kiro/steering/`,
  and `packages/backend/` link in the 6 ADRs was authored against verified paths
  (steering files exist in the tree; the two `compliance/architecture/` rule
  filenames are contractual drift flagged above). Recommend a
  `lychee --config .github/lychee.toml docs/adr/` pass at Phase D wrap-up.

## Files created / changed

Grouped by kind (ADR only — no top-level docs, contracts, or steering edits fell
within this phase's scope):

- **ADR (2 edits, 6 files verified present + complete):**
  - `docs/adr/0008-keep-authorization-and-access-split.md` — verified.
  - `docs/adr/0011-seeder-discovery-via-attribute.md` — verified.
  - `docs/adr/0016-actions-only-no-services-no-controllers.md` — verified
    - one Consequences-clause clarification (named `NoBaseControllerRule.php`
    - `NoServiceLayerRule.php` under `packages/backend/compliance/architecture/`
      where the earlier text referenced only the PHPStan identifier
      `architecture.no_service_layer`).
  - `docs/adr/0017-delete-workspace-terminology.md` — verified + one
    Decision-clause clarification (D3 now carries an explicit rename table
    including `tenant_memberships → tenant_members` alongside the six sibling
    renames).
  - `docs/adr/0018-business-types-enum-primary-db-seed.md` — verified.
  - `docs/adr/0022-language-agnostic-service-boundary.md` — verified.

- **Deliverable report:** this file
  (`.kiro/reports/phase-d1-adrs-2026-07-21.md`).

- **No steering edits.** Both clarifications named enforcement mechanisms that
  were already alluded to; no rule change; steering already cites both ADRs.
  PostFileSave hook verified both edits are documentation-only.

- **No new ADR numbers claimed.** All 6 slots pre-existed as filenames in the
  tree; this phase authored the CONTENT the triage flagged as missing.

## Index updates

None applied in this phase (the `docs/adr/README.md` index is stale but its
refresh is out of scope — see "Drift flagged for humans" above). The next
`docs-adr-steward` pass should reconcile the README's stale statements against
the current tree:

- Current README: "Rows 0001–0023 originate at `stackra-backend/docs/adr/`" —
  contradicts the current tree.
- Current README: "The next available number is **0026**" — contradicts the tree
  (0026 + 0027 have landed).
- Current README: index table stops at row 0025 — missing rows 0026, 0027, and
  the 6 restored (0008, 0011, 0016, 0017, 0018, 0022).

Route to a Phase D2 or D3 follow-up.

## Verification

- All 6 ADRs carry the canonical shape (Status / Context / Options considered /
  Decision / Consequences / Related work) matching ADR-0026 and ADR-0027 as
  canonical examples.
- Every ADR carries at least three alternatives under `## Options considered`.
- Every ADR carries `**Status:** Accepted` and `**Date:** 2026-07-21`.
- Every ADR's `## Related work` cites at least one steering file + at least one
  sibling ADR.
- Every steering file this phase depended on cites its ADR by number
  (bidirectional integrity verified via grep).
- No renumbering; every ADR number is used sequentially in the tree.
- No ADR deletion; the two edits are strictly additive.
