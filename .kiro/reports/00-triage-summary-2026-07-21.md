# Backend Compliance Sweep — Round 3 Triage Summary

**Date:** 2026-07-21 **Workspace:**
`/Users/akouta/Projects/academorix-frontend/` **Scope:** `packages/backend/**`,
`apps/academorix/**`, `tools/cli/**` **Reports aggregated (7):**

- `.kiro/reports/standards-steward-2026-07-21.md` (570 lines, 28 KB)
- `.kiro/reports/backend-architecture-reviewer-2026-07-21.md` (350 lines)
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md` (357 lines, 40 KB)
- `.kiro/reports/backend-platform-reviewer-2026-07-21.md`
- `.kiro/reports/docs-adr-steward-2026-07-21.md` (685 lines)
- `.kiro/reports/api-contract-designer-2026-07-21.md` (large)
- `.kiro/reports/data-modeler-2026-07-21.md`

**Not delivered:** `security-compliance-reviewer` (aborted 3 times). Security
surface consolidated below from the 4 sibling reports that covered it.

---

## Executive verdict

**Overall workspace health: AT RISK — code is architecturally strong, but ship
path is missing and 3 deployment blockers prevent even `php artisan migrate`
from succeeding.**

The good news: every reviewer that measured code-level discipline (Actions-only
mandate, Console-command contract, Data-first, attribute-first DI, migration
docblock shape) reports 99–100% compliance. The framework itself is
well-authored. The bad news:

1. **11 duplicate migrations will crash the first `db:migrate` on a clean DB.**
2. **4 migrations create child tables before their parent tables exist.**
3. **`packages/backend/platform/staff` has a table-name / FK-target mismatch**
   (interface says `'staffs'`, FKs say `'staff'`) that fails silently after the
   duplicates are removed.
4. **498 PHP files in 25 SDK packages under `apps/academorix/src/sdks/` declare
   `namespace Stackra\...` but their `composer.json` PSR-4 maps `Academorix\...`
   — every SDK class fails autoload.**
5. **No ship path exists** — no `docker/`, no `config/octane.php`, no runnable
   app that boots the ~90 backend packages. The Laravel-Octane invariant the
   whole framework rests on has never been exercised.

Beyond those five, the compliance work is orderly and mechanical (56 Registry
classes to move, 37 strict-types to add, headless leaks to remove, tenancy
column drift to fix, 130+ composite indexes to add). It's a lot but it's
tractable — one steering rule × one package per commit.

The documentation surface is critically incomplete. 11 ADRs the steering
references are missing. 5 top-level docs are missing. `docs/contracts/` doesn't
exist. Every reviewer that grounded against `docs/adr/0016-*.md` in the last
round was reading a broken pointer.

---

## Top 5 systemic problems

### 1. Deployment blockers (5 files delete + 4 renames unblocks everything)

`php artisan migrate --seed` fails today. Fix order:

- Delete 11 duplicate migration files (mechanical `git rm`).
- Renumber 4 child-table migrations to run after their parents.
- Rename `StaffInterface::TABLE` from `'staffs'` to `'staff'`.
- Consolidate `Audit` (two packages create the same `audits` table).
- Reconcile `payment_methods` (two modules create the same table).

Cost: one commit per fix. Blocker priority. Nothing ships until this batch
lands. See Fix Order Batch 1 below.

### 2. Octane runtime correctness (2 concrete leaks + 1 dead-hook)

Even if `db:migrate` were fixed, the Octane runtime target has three correctness
bugs that manifest ONLY under a running worker pool (they don't appear under
`php artisan serve`):

- **SentryService static-singleton captures request state.** `#[Scoped]` on the
  class is neutralised by `private static ?self $instance` storing the
  constructed object into a static property. Request-1's authenticated user +
  request-1's request-context leak into request-2's `configureScope()` call.
  Fix: rewrite as an instance service.

- **TenancyHooks registered but never fire.** `TenancyHookDispatcher.php:56` has
  a TODO for the phase-10 listener. `CachePrefixTenantHook` +
  `LogContextTenantHook` are dead. Under Octane, cache reads run WITHOUT the
  per-tenant prefix — cross-tenant cache leaks are possible whenever two
  requests for different tenants hit the same worker.

- **No `config/octane.php` in any app.** The Local dev vs. Octane parity rule
  from `.kiro/steering/octane-first-di.md` says "every PR that touches a
  `#[Singleton]` binding gets a manual
  `octane:start --workers=1 --max-requests=100` smoke test". That gate is
  unenforceable — no app boots Octane. Every `#[Scoped]` / `#[Singleton]`
  decision in `packages/backend/**` sits on an unverified runtime.

### 3. SDK autoload break (498 files, 25 packages)

Every SDK package under `apps/academorix/src/sdks/*` has a namespace mismatch:
`composer.json` PSR-4 root is `Academorix\<SdkName>\`, but every `.php` file
declares `namespace Stackra\<SdkName>\...`. Composer autoload will fail on every
class. Consumer code compiles because `use` statements reference the
`Stackra\...` class name — but the autoloader never finds the file.

Fix: bulk rewrite 498 files' `namespace` declarations from `Stackra\<Sdk>\...`
to `Academorix\<Sdk>\...`. Mechanical, one PR.

### 4. Headless mandate leaks (foundation package)

`ADR-0021` locks the entire backend to headless (JSON-only). Three compounding
leaks in `packages/backend/foundation`:

- 18 Blade view files (`views/errors/*.blade.php`,
  `views/layouts/app.blade.php`).
- `VerifyCsrfToken` + `EncryptCookies` middleware on the `web` group.
- `Handler.php:181-182`, `HtmlErrorFormatter.php:71`,
  `InteractsWithResponse.php:200,205` — HTML fallback paths.

Fix: delete the Blade views + the two middleware + the HTML formatter fallback
paths. One PR touches ~30 files.

### 5. Documentation critical gap

The ADR / contract / docs layer is 60% not-yet-authored:

- 11 ADRs referenced by steering are missing.
- 2 ADR number collisions (this repo's 0024/0025 mean different things than
  steering claims).
- 5 top-level docs missing (architecture.md, service-boundary.md, doppler.md,
  turbo-remote-cache.md, migration.md).
- `docs/contracts/` directory doesn't exist.
- No `docs/data/` folder — zero ERDs across 105 packages.

This blocks every subsequent Phase-3 reviewer that grounds against ADR text or
contract schemas. Fix: land the missing ADRs + docs bundle. 21 new ADRs to
author.

---

## Deployment blockers (BLOCKER priority)

Every one crashes `php artisan migrate --seed`. Ordered by fix independence
(each row is a separate PR).

| #   | Concern                       | Files                                                                    | Fix                                                                         | Owner                                   |
| --- | ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------------------- |
| B1  | Duplicate migrations          | 11 files across 5 packages                                               | `git rm` the duplicates                                                     | codebase-housekeeper                    |
| B2  | Migration ordering bugs       | 4 packages (platform/teams, identity/mfa, platform/staff, finance/order) | Renumber child migration timestamps                                         | laravel-feature-builder                 |
| B3  | `Staff` table-name mismatch   | `StaffInterface`, `create_staffs_table.php`, 2 FK migrations             | Rename `TABLE = 'staffs'` → `'staff'`                                       | laravel-feature-builder                 |
| B4  | Audit dual-package            | `shared/audit` + `observability/audit` both create `audits`              | Pick canonical location; delete other. Needs ADR first.                     | docs-adr-steward + codebase-housekeeper |
| B5  | `payment_methods` dual-module | `finance/gateway` + `finance/payment`                                    | Pick owner; drop the other's migration. Needs ADR.                          | docs-adr-steward + codebase-housekeeper |
| B6  | SDK namespace break           | 498 PHP files across 25 SDK packages                                     | Bulk rewrite `namespace Stackra\` → `namespace Academorix\` (SDK-side only) | codebase-housekeeper                    |

**Total: 6 batches / 6 PRs. Estimated: 1 day of focused work.**

---

## Runtime correctness bugs (P0)

Every one fires under Octane but not under `php artisan serve`.

| #   | Concern                         | File                                                                                                                                               | Fix                                                                                   | Owner                   |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| R1  | SentryService static-singleton  | `packages/backend/telemetry/sentry/src/Services/SentryService.php`                                                                                 | Rewrite as instance service; migrate call sites                                       | laravel-feature-builder |
| R2  | TenancyHooks never fire         | `packages/backend/framework/service-provider/src/Dispatchers/TenancyHookDispatcher.php` + missing listener                                         | Wire the phase-10 listener; verify cache prefix + log context land                    | laravel-feature-builder |
| R3  | `CrudController` broken imports | `packages/backend/framework/crud/src/Controllers/CrudController.php` + `packages/backend/framework/routing/src/Concerns/InteractsWithServices.php` | Delete both (dead scaffolding); drop `use InteractsWithServices;` from `AsController` | codebase-housekeeper    |

---

## Compliance violations (P0/P1)

By severity + blast radius. Every row is a codebase-housekeeper commit.

### P0 (structural)

| #   | Concern                                     | Files                                                                                                                                                             | Fix                                                            | Owner                |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- |
| C1  | Headless mandate leaks                      | 18 Blade views + CSRF middleware + EncryptCookies middleware + 4 HTML fallback paths in `packages/backend/foundation` and `packages/backend/framework/exceptions` | Delete Blade + middleware; switch error handler to always-JSON | codebase-housekeeper |
| C2  | 56 Registry classes in `Services/`          | Across access, billing, platform, notifications, framework/scope, framework/routing                                                                               | Move to `Registry/` folder + namespace update                  | codebase-housekeeper |
| C3  | Foundation `Middlewares/` folder            | `packages/backend/foundation/src/Middlewares/{Request,Response,Security}/*` (18 files)                                                                            | Flatten to singular `Middleware/`; drop the 3-way nesting      | codebase-housekeeper |
| C4  | 37 files without `declare(strict_types=1);` | Concentrated in `packages/backend/framework/routing/src/Attributes/*` + `packages/backend/foundation/src/Middlewares/*`                                           | Add declaration line                                           | codebase-housekeeper |
| C5  | `ToolDiscoveryBootstrapper` in `Services/`  | `packages/backend/platform/ai/src/Services/ToolDiscoveryBootstrapper.php`                                                                                         | Move to `Bootstrappers/`                                       | codebase-housekeeper |

### P1 (correctness)

| #   | Concern                                            | Files                                                                                                                                                                   | Fix                                                                                | Owner                                   |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| C6  | 15 tables carry `application_id` beyond §2 mandate | Multiple domain migrations                                                                                                                                              | ADR revision to add 4 central-plane exceptions; drop `application_id` from 11 rows | docs-adr-steward + codebase-housekeeper |
| C7  | Missing `application_id` on `entitlements`         | `packages/backend/billing/entitlements/database/migrations/2026_07_15_000110_create_entitlements_table.php`                                                             | Add column + composite index                                                       | laravel-feature-builder                 |
| C8  | 2 models missing `BelongsToTenant` trait           | `AccessRequestProjection`, `ServiceAccount`                                                                                                                             | Add trait composition                                                              | codebase-housekeeper                    |
| C9  | `leads.owner_id` naming drift                      | `apps/academorix/src/modules/growth/leads/*`                                                                                                                            | Rename to `assigned_user_id` (`owner_id` reserved for scope substrate)             | laravel-feature-builder                 |
| C10 | Actions two-level nesting                          | `packages/backend/shared/geography/src/Actions/Platform/{Cities,Countries,...}/*` + `packages/backend/shared/localization/src/Actions/{Platform,Tenant}/*` (13 folders) | Flatten to `Actions/<Ctx>/`                                                        | codebase-housekeeper                    |
| C11 | ~49 residual `Workspace` strings                   | Docblocks + lang files across framework + SDK                                                                                                                           | Rename to `Tenant` per ADR-0017                                                    | codebase-housekeeper                    |
| C12 | `env()` outside `config/`                          | `HorizonServiceProvider.php:102-105`, `HealthNotificationConfig.php:35,39`                                                                                              | Migrate to `config('...')` + `#[Config('...')]` injection                          | codebase-housekeeper                    |
| C13 | Facades inside services                            | `SentryService.php:120-121` (`Auth::check`, `Auth::user`), `WebhookHandler.php:95` (`Log::info`)                                                                        | Migrate to `#[Auth]` + `#[CurrentUser]` + `#[Log]` injection                       | codebase-housekeeper                    |
| C14 | 3 legacy `AbstractModuleServiceProvider` extenders | `ExceptionsServiceProvider`, `FoundationServiceProvider`, `ArchitectureServiceProvider`                                                                                 | Migrate to new `@stackra/service-provider` base                                    | laravel-feature-builder                 |

### P2 (hygiene)

| #   | Concern                                                         | Files                                                         | Fix                                                              | Owner                   |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| C15 | 130+ missing composite `(tenant_id, created_at)` indexes        | Every domain time-series table across `apps/academorix/**`    | Add composite index migrations, one per module                   | laravel-feature-builder |
| C16 | Orphan FKs — no relationship methods on models                  | 320/320 models                                                | Codegen enhancement + regeneration                               | laravel-feature-builder |
| C17 | 9 legacy `protected $fillable/hidden/appends/guarded` on models | Storage, activity, transfer, geography, audit vendor-wrappers | Migrate to `#[Fillable]` / `#[Hidden]` / `#[Appends]` attributes | codebase-housekeeper    |
| C18 | ~450 framework files missing `@category` / `@since` tags        | Every framework class                                         | Pint/Rector rule to add tags                                     | codebase-housekeeper    |
| C19 | 1,608 Actions with redundant `Action` suffix                    | Every domain module Action                                    | Generator template fix + rename pass                             | laravel-feature-builder |
| C20 | Missing userstamps on slim tables                               | `development_pathways` and others                             | Add `created_by/updated_by/deleted_by` columns                   | laravel-feature-builder |
| C21 | Non-final concrete Service classes                              | `DebugbarService`, `SentryService`                            | Mark `final`; refactor if subclassed                             | codebase-housekeeper    |
| C22 | 43 imperative `$this->app->bind/singleton()` calls              | Providers                                                     | Migrate to `#[Bind]` / `#[Singleton]` on target classes          | codebase-housekeeper    |

---

## Missing infrastructure (to author)

Each row needs a `laravel-feature-builder` commit (new package or new
migration). Priority by downstream unblock.

| #   | Item                                            | Description                                                                                            | Owner                             |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| I1  | `ServiceJwt` signer + verifier                  | HS256 signer + 13-step verifier in identity/auth (referenced by service-jwt.schema.json when it lands) | laravel-feature-builder           |
| I2  | `packages/domain/` package                      | Shared HTTP-DTO package (from tenancy-columns §9)                                                      | laravel-feature-builder           |
| I3  | `apps/api` runnable app                         | Boots the ~90 backend packages under Octane. Blocks: every runtime verification.                       | solution-architect decision first |
| I4  | Docker packaging                                | `docker/Dockerfile.api` + `docker/nginx/` + `docker/entrypoint.sh` + `docker-compose.yml` for local    | deploy-engineer                   |
| I5  | Horizon supervisor config                       | `apps/api/config/horizon.php` with supervisor + queue segmentation                                     | laravel-feature-builder           |
| I6  | Octane config                                   | `apps/api/config/octane.php` (Swoole or Roadrunner — needs ADR)                                        | laravel-feature-builder           |
| I7  | `.changeset/` + release workflow                | Land `.changeset/config.json` + `.github/workflows/release.yml` running `changesets/action`            | release-manager                   |
| I8  | PHP CI workflow                                 | `.github/workflows/php.yml` with setup-php + composer install + pest + phpstan + pint                  | deploy-engineer                   |
| I9  | `config/phpstan-base.neon` + `config/pint.json` | Referenced by every backend package's `phpstan.neon`; missing                                          | backend-platform-reviewer         |

---

## Documentation gaps (to write)

### Missing ADRs (11 restored + 10 new)

Every one blocks some reviewer's grounding.

**Restored (steering already cites them; text is missing):**

- ADR-0004 — Cache-tag resolver via attribute
- ADR-0007 — Blueprint `__invoke()` vs static `register()`
- ADR-0008 — Keep authorization + access split
- ADR-0011 — Seeder discovery via attribute
- ADR-0016 — Actions-only; no services; no controllers (LOAD-BEARING — every
  backend package cites it)
- ADR-0017 — Delete workspace terminology
- ADR-0018 — Business types enum primary + DB seed dual-source
- ADR-0022 — Language-agnostic service boundary + four seams (BLOCKS every
  cross-service reviewer)
- ADR-0023 — Frontend package architecture

**New — required for open decisions:**

- Row-level attribution three-axes column contract (currently steering-only;
  needs ADR anchor)
- Runtime target: Laravel Octane (currently steering-only; needs ADR anchor)
- Audit consolidation (`shared/audit` + `observability/audit`)
- §2 8-row list extension for central-plane infrastructure rows
- `payment_methods` ownership
- Activities vs `activity_log` naming reconciliation
- Tenancy-hook wiring event surface
- Octane driver choice (Swoole vs Roadrunner)
- Composer publish destination (Packagist / Satis / path-repo forever)
- Workspace reorg (dashboard removal)
- `stackra-platform/application-sdk` sub-vendor justification

### Missing top-level docs

- `docs/architecture.md` — the reality of the current tree
- `docs/service-boundary.md` — the four-seam narrative
- `docs/doppler.md` — Doppler project layout + secret rotation
- `docs/turbo-remote-cache.md` — Turbo cache setup + signature-key policy
- `docs/migration.md` — three-phase migration state
- `docs/package-authoring.md` — package template reference
- `SECURITY.md` — top-level security posture
- `README.md` — the workspace root README is currently stock Vite template

### Missing schemas + contracts

- `docs/contracts/` directory doesn't exist
- `docs/contracts/README.md` — the 5-rule contract preamble
- `docs/contracts/service-identity.v1.schema.json` — Sanctum PAT identity +
  ServiceAccount projection
- `docs/contracts/service-jwt.v1.schema.json` — HS256 JWT payload + 13-step
  verification companion .md
- `docs/contracts/list-envelope.v1.schema.json` — `{data, meta, links}` shape
- `docs/contracts/single-envelope.v1.schema.json` — `{data, message?}` shape
- `docs/contracts/error-envelope.v1.schema.json` — `{message, errors?}` shape
- Per-resource wire request/response schemas — 100+ endpoints × 2

### Missing ERDs

Zero ERDs across 105 packages. 22 Priority-1 + 43 Priority-2 + 5 aggregate ERDs
needed.

---

## Tenancy gaps (12 known + 2 new)

From `.kiro/steering/tenancy-columns.md §9` Living gap register:

- ✅ 7 closed (audits.tenant_id, activity_log.tenant_id, Identity+User split,
  application_id on tenants + users + roles + permissions, ServiceAccount
  landing)
- ⏳ 4 still open: entitlements.application_id, settings scope-consumer
  registration, Access permission overlay, Auth model classification post-split
- 🚨 2 new class of blocker: duplicate-migration schema collisions (BLOCKER
  B1) + 15 tables carry `application_id` beyond §2 mandate (compliance C6)

---

## Security surface (consolidated from sibling reports)

The dedicated security-compliance-reviewer report aborted 3 times. Findings from
the 4 sibling reports:

### High-risk

- **SentryService captures request state under Octane** (R1) — leaks
  Auth::user() + request() between requests.
- **TenancyHooks not firing** (R2) — cache reads run WITHOUT per-tenant prefix
  under Octane. Cross-tenant leak silent.
- **3 spatie pivots carry `application_id`** without runtime
  `ApplicationMismatch (422)` verification (VIO-004/005/006 in tenancy report).
- **`ServiceAccount` code shipped WITHOUT
  `docs/contracts/service-identity.schema.json`** grounding — the contract lives
  in developers' heads.

### Medium-risk

- **`.env` on disk at `apps/laravel-template/.env`** — gitignored but present.
  No pre-commit hook to prevent future staging.
- **`docs/doppler.md` MISSING** — every secrets flow undocumented.
- **No `TURBO_REMOTE_CACHE_SIGNATURE_KEY`** — unsigned cache is an injection
  vector.
- **No `docs/contracts/service-jwt.schema.json`** — 13-step verifier lives in an
  example JSON file, not a formal schema.
- **12 Auth+Identity+MFA models post-Identity-split not classified** — some may
  leak between identity-plane and tenant-plane without verification.

### Low-risk

- **Zero known real-secret leaks in code** (standards-steward confirmed; only
  Stripe key regex patterns in JSON schemas — patterns, not values).

---

## What's SOLID (preserve as-is)

Every reviewer flagged these as canonical:

1. **Console-command discipline is exemplary** — 1,333 commands 100% compliant
   with `.kiro/steering/console-commands.md` (BaseCommand + AsCommand +
   $this->omni + method-injected handle()).
2. **Actions-only mandate is real** — 1,959 Action files, 100% `#[AsAction]`
   - `AsController` trait. Zero domain modules extend Controller-family bases.
3. **Attribute-first DI works** — 605 `#[Scoped]` + 110 `#[Singleton]` + 43
   imperative bindings (most legitimate).
4. **Provider migration 97.6% complete** — 120 on new base, 3 legacy.
5. **Discovery seam is universal** — 143 files use `DiscoversAttributes`, zero
   homegrown reflection walks.
6. **Migrations are canonical** — all 329 files have `@file` docblocks + strict
   types + explicit `down()`.
7. **Data-first is 100% clean** — 1 legitimate `rules()` override, zero
   `FormRequest`/`JsonResource` extenders.
8. **Exception hierarchy is 100% clean** — every exception extends
   `Stackra\Exceptions\Exception`.
9. **Column contracts** — 320 interfaces × 320 models × 328 migrations, zero
   mechanical drift.
10. **`Contracts/Data/<Model>Interface` + `ATTR_*` pattern** — used consistently
    across every package.
11. **Trait-lifecycle aliasing** — correctly applied at `BaseCommand`
    (`use UsesOmniTerm { initialize as bootOmniTerm; }`).
12. **`packages/backend/framework/feature-flags`** — flagged by both
    standards-steward + data-modeler as the canonical package model to match.

---

## Proposed fix order (Round 4+)

Ordered by (a) unblocker priority — deployment blockers first, (b) commit
granularity, (c) dependency ordering (some ADRs unblock code fixes).

### Phase A — Unblock deployment (1 day, 6 PRs)

**Wall time: 1 day if executed serially by codebase-housekeeper +
laravel-feature-builder.**

- **PR-A1** — Delete 11 duplicate migrations (mechanical `git rm`).
- **PR-A2** — Fix 4 migration ordering bugs (renumber timestamps).
- **PR-A3** — Rename `StaffInterface::TABLE` `'staffs'` → `'staff'` + migration
  file rename + verify FKs.
- **PR-A4** — Consolidate `Audit` (choose location; delete other; write ADR).
- **PR-A5** — Reconcile `payment_methods` (choose owner; drop other; write ADR).
- **PR-A6** — Rewrite 498 SDK namespaces from `Stackra\` to `Academorix\`.

Verify: `php artisan migrate --seed` runs green on a fresh DB.

### Phase B — Runtime correctness (2 days, 3 PRs)

- **PR-B1** — Rewrite `SentryService` as an instance service.
- **PR-B2** — Wire the phase-10 TenancyHook listener.
- **PR-B3** — Delete `CrudController` + `InteractsWithServices` (dead
  scaffolding).

### Phase C — Headless mandate + folder cleanup (2 days, 4 PRs)

- **PR-C1** — Remove Blade error views + JSON-first error handler switch.
- **PR-C2** — Delete `VerifyCsrfToken` + `EncryptCookies` middleware.
- **PR-C3** — Move 56 Registry classes from `Services/` → `Registry/`.
- **PR-C4** — Flatten Foundation `Middlewares/{Request,Response,Security}/` →
  `Middleware/`.

### Phase D — ADR + docs unblock (3 days, 5 PRs)

Blocks every subsequent reviewer that grounds against ADR text.

- **PR-D1** — Land the 6 load-bearing restored ADRs (0016, 0017, 0018, 0011,
  0022, 0008).
- **PR-D2** — Land the service-boundary bundle (ADR-0022 body +
  `docs/service-boundary.md` + `docs/contracts/README.md` + first 2 schemas).
- **PR-D3** — Land row-level-attribution + Octane-runtime ADRs at 0027/0028.
- **PR-D4** — Land top-level docs bundle (architecture.md, doppler.md,
  turbo-remote-cache.md, migration.md, package-authoring.md).
- **PR-D5** — Rewrite `README.md` + land `SECURITY.md`.

### Phase E — Compliance sweep (5 days, 10 PRs)

One commit per steering rule × package.

- **PR-E1** — Add `declare(strict_types=1);` to 37 files.
- **PR-E2** — Add `#[Bind]` to 4 scope Contracts/Data interfaces.
- **PR-E3** — Move `ToolDiscoveryBootstrapper` → `Bootstrappers/`.
- **PR-E4** — Flatten Actions two-level nesting (geography + localization).
- **PR-E5** — Migrate `Auth::` / `Log::` / `env()` facades to attribute
  injection in 6 files.
- **PR-E6** — Add missing `BelongsToTenant` trait to `AccessRequestProjection` +
  `ServiceAccount`.
- **PR-E7** — Rename `leads.owner_id` → `leads.assigned_user_id`.
- **PR-E8** — Add `application_id` to `entitlements` table + composite index.
- **PR-E9** — Drop `application_id` from 11 non-central-plane rows (after ADR
  lands).
- **PR-E10** — Rename ~49 residual `Workspace` strings to `Tenant`.

### Phase F — Infrastructure buildout (2 weeks — needs solution-architect decisions first)

- **PR-F1** — Decision: `apps/api` layout. Sign-off needed.
- **PR-F2** — `apps/api` scaffold + boot.
- **PR-F3** — Docker packaging.
- **PR-F4** — Horizon + Octane config.
- **PR-F5** — PHP CI lane.
- **PR-F6** — Changesets + release workflow.
- **PR-F7** — `config/phpstan-base.neon` + `config/pint.json`.

### Phase G — Test coverage (parallel to E + F)

- test-mutation-engineer per-package.
- Regression test for SentryService Octane leak (mock two consecutive requests).
- Regression test for TenancyHook fire (cache prefix + log context).
- Migration smoke test (verify `php artisan migrate --seed` on clean DB).

### Phase H — Documentation completion (parallel to E + F)

- Author 22 Priority-1 ERDs (data-modeler).
- Author 15 remaining new ADRs (docs-adr-steward).
- Author 100+ per-resource contract schemas (api-contract-designer).
- Author 130+ composite index migrations (laravel-feature-builder).
- Wire OpenAPI generation via Scramble.
- Add relationship methods to 320 models (codegen enhancement).

**Total wall time A+B+C+D+E: ~2 weeks of focused sequential work if we tolerate
1 executor at a time. Parallelizable to 4-5 days with 3 executors working
non-overlapping scopes.**

---

## User decisions needed before Round 4 starts

The following can't be decided by any single agent — they need product /
architecture / release-management sign-off.

### D1 — Runnable app target

`backend-platform-reviewer` cannot verify Octane / Horizon / Docker correctness
until an app boots the packages. Options:

- (a) Provision `apps/api` fresh + require the packages.
- (b) Extend `apps/academorix/` to be a runnable app (currently blueprint-only).
- (c) Rename `apps/laravel-template` to `apps/api` + wire dependencies.

**Recommendation:** (a) — new `apps/api` as a canary. Preserves the templates as
templates.

### D2 — Docker vs. Laravel Cloud vs. serverless

The steering promises Docker. `backend-platform-reviewer` recommends containers.
Alternative: Laravel Cloud (managed) or a serverless target.

### D3 — Octane driver

Swoole vs Roadrunner. Steering says both are supported. `octane-first-di.md`
prescribes one manual test per PR — pick a driver so that test is runnable.

### D4 — Composer publish destination

- Public Packagist?
- Private Satis?
- Composer path-repo forever (workspace-internal)?

Needs release-manager decision.

### D5 — ADR number collision resolution

Option A (recommended): never renumber; land the row-level-attribution +
Octane-runtime ADRs at 0027/0028. Option B: renumber this repo's 0024/0025
(breaks "never renumber" rule).

### D6 — Blade error views intent

Are the Blade views under
`packages/backend/framework/exceptions/views/errors/*.blade.php` intended as
DEV-ONLY (rendered by `php artisan serve`) or are they leaking into production
error paths? If dev-only, gate them behind `APP_ENV=local`. If production,
delete + switch to JSON-first.

### D7 — CrudController fate

Delete outright (violates ADR-0016) or complete the missing
`Stackra\Crud\Contracts\ServiceInterface` + `UseService` classes?

### D8 — Sub-vendor `stackra-platform/application-sdk`

`.kiro/steering/package-naming.md` §Rule 3 requires 3+ packages before spinning
up a sub-vendor. Only one exists. Options: collapse to
`stackra/platform-application-sdk` OR add two more packages to justify.

### D9 — Workspace root name

Directory is `academorix-frontend/` but every agent charter targets
`stackra-frontend/` or `stackra-backend/`. Either rename the repo or sweep every
charter. Not fixable inside the workspace.

---

## What comes next

The audit surface is complete. **Every finding above is already documented in
one of the 7 reports at `.kiro/reports/*-2026-07-21.md`.** This document is the
aggregation index.

**Your next call (as user):**

1. Approve or override the Fix Order Phase A (deployment blockers). This is the
   cheapest cycle — 6 mechanical PRs unlock everything else.
2. Decide D1-D9 above. Some of these need discussion; some are one-liners.
3. Green-light Round 4 execution: which agents fire first, on which packages, in
   what commit shape.

Once Phase A lands and D1-D9 are decided, the rest of Phases B-H become
straightforward sequential work.

---

_This document is generated from the 7 reports listed in the header. It contains
no findings not present in a sibling report._
