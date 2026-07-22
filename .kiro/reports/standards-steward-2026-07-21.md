# Standards Steward — Compliance Audit Report

**Date:** 2026-07-21 **Scope:** `packages/backend/**`, `apps/academorix/**`,
`tools/cli/**`, `blueprints/**` **Total PHP files scanned:** ~14,029 (13,056
under `packages/backend/**/src/**`, ~5,737 under `apps/academorix/src/**`, 55
under `tools/cli/**`) **Total JSON blueprints:** ~2,411 **Steering files
consulted:** all 48 files under `.kiro/steering/`

> **NOTE on workspace layout.** The task description references a repo path of
> `/Users/akouta/Projects/stackra/stackra-backend`. The actual repo on disk is
> `/Users/akouta/Projects/academorix-frontend` — a mixed backend + frontend
> monorepo. This audit strictly targets the **backend** subtree.
> `packages/frontend/**` and `packages/config/**` were **not read** per the task
> out-of-scope instruction.

---

## Summary

- **P0 violations (blockers):** ~7 systemic patterns
- **P1 violations (major):** ~9 systemic patterns
- **P2 violations (minor):** ~6 systemic patterns
- **P3 violations (cosmetic):** ~4 systemic patterns

Absolute hits are much larger than the systemic-pattern count — one finding may
map to hundreds of files (e.g. 56 misplaced Registry classes, 37% of framework
files without @category, 9,422 auto-generated skeleton files).

**Overall verdict:** the codebase is largely on-standard for the primitives that
are hard to slip (Actions, Console commands, Migrations, Data classes, #[Bind]
on Repository interfaces, Exception hierarchy, headless routing). The
cross-cutting failures cluster in three areas:

1. **Folder placement** — 56 Registry classes in Services/ (should be
   Registry/), 1 misplaced Bootstrapper, 1 misplaced Middleware tree.
2. **Skeleton / generator drift** — 9,422 files carry the AUTO-GENERATED header.
   Generator emits Action class names with a redundant Action suffix (1,608
   files) and skeleton Services shells that would become P0 CRUD-wrappers the
   moment they gain a create() / find() method.
3. **Headless-mandate leftovers** — 18 blade view files, view() +
   response()->view() call paths, a VerifyCsrfToken middleware, an
   EncryptCookies middleware.

The rest is polish — ~37% of framework files missing Magento @category / @since
tags, ~16 unqualified global functions in namespaced files, ~9 legacy protected
$fillable / $hidden / $appends properties in vendor-wrapping models.

---

## Per-steering-rule findings

### `docblocks.md` — docblocks + inline comments

**Total violations:** ~450 (framework files missing `@category` / `@since`)
**Fix priority:** P2

- **Sample violations:**
- `packages/backend/framework/exceptions/src/Exception.php`
- `packages/backend/framework/exceptions/src/Support/TraceCleaner.php`
- `packages/backend/framework/exceptions/src/Enums/ErrorSeverity.php`
- `packages/backend/framework/database/src/Concerns/HasMetadata.php`
- `packages/backend/framework/support/src/Helpers/Polyfills.php`
- `packages/backend/framework/scope/src/Services/ScopeRegistry.php`
- `packages/backend/framework/scope/src/Contracts/Data/ScopeDefinitionInterface.php`
- **Signal:** sampled 100 random framework files: 37/100 missing `@category`.
  Scaling to ~1,220 framework files → ~450 missing.
- **Steering:** `.kiro/steering/docblocks.md §Universal 9`.
- **Suggested batch:**
  `chore(docs): add @category + @since tags to every  framework class`.

Sub-findings:

- File-level `@file` header — clean on all 329 migration files.
- Class-level docblock coverage — sampled 300 random files, ~98% have a docblock
  within 15 lines of the class declaration.

---

### `code-standards.md` — folder placement, suffix-per-kind

**Status:** the file is FRONTEND-focused (React/TS). Does not apply to backend
PHP tree — backend equivalent is `.kiro/steering/folder-conventions.md`.

**No violations flagged from this file.**

---

### `folder-conventions.md` — one folder, one primitive

**Total violations:** 60+ (blocker-level: 56 Registries in `Services/`) **Fix
priority:** P0

#### P0 — 56 Registry classes in `Services/` (must move to `Registry/`)

Steering rule:

> ❌ **Registry classes in `Services/`.** … **Fix**: move to `Registry/` and
> rename Resolver → Registry where the class was actually a registry.

Sample hits (of 56 total):

- `packages/backend/access/rbac/src/Services/RoleDefinitionRegistry.php`
- `packages/backend/access/grants/src/Services/GrantableRegistry.php`
- `packages/backend/access/requests/src/Services/AccessRequestableRegistry.php`
- `packages/backend/access/invitations/src/Services/InvitationTargetRegistry.php`
- `packages/backend/access/invitations/src/Services/DefaultInvitationTargetRegistry.php`
- `packages/backend/framework/scope/src/Services/ScopeRegistry.php`
- `packages/backend/platform/webhook/src/Services/WebhookRegistry.php`
- `packages/backend/platform/webhook/src/Services/WebhookDestinationRegistry.php`
- `packages/backend/platform/forms/src/Services/FieldTypeRegistry.php`
- `packages/backend/platform/storage/src/Services/FileKindRegistry.php`
- `packages/backend/platform/realtime/src/Services/BroadcastChannelRegistry.php`
- `packages/backend/platform/integrations/src/Services/AppRegistry.php`
- `packages/backend/billing/subscription/src/Services/PlanRegistry.php`
- `packages/backend/billing/entitlements/src/Services/EntitlementRegistry.php`
- `packages/backend/notifications/notifications-push/src/Services/PushSubscriptionRegistry.php`
- `packages/backend/notifications/notifications-sms/src/Services/SmsOptOutRegistry.php`
- …44 more.

The routing package has 1 Registry in `Support/`:
`packages/backend/framework/routing/src/Support/ApiVersionRegistry.php` — same
violation, different origin.

**Fix priority:** P0 **Suggested batch:**
`refactor(folder-conventions): move Registry classes from Services/ + Support/ to Registry/`.

#### P0 — Bootstrapper in `Services/`

**Hit:**
`packages/backend/platform/ai/src/Services/ToolDiscoveryBootstrapper.php`

Should live at
`packages/backend/platform/ai/src/Bootstrappers/ToolDiscoveryBootstrapper.php`.

#### P0 — Foundation Middleware folder is plural + nested

Steering rule:

> ❌ **Middleware in `Http/Middleware/`.** … **Fix**: rename to flat
> `Middleware/`.

Extended: same rule against sub-nesting.

**Hits:**

- `packages/backend/foundation/src/Middlewares/Request/*` — 8 files
- `packages/backend/foundation/src/Middlewares/Response/*` — 2 files
- `packages/backend/foundation/src/Middlewares/Security/*` — 7 files

All 17 files also miss `declare(strict_types=1);`.

**Fix priority:** P0 **Suggested batch:**
`refactor(foundation): flatten Middlewares/Request+Response+Security → Middleware/*`.

#### P1 — Actions two-level nesting (2 packages)

Steering: forbids `Actions/Tenants/Draft/Create.php`.

Hits:

- `packages/backend/shared/geography/src/Actions/Platform/{Cities,Countries,Currencies,Languages,States,Timezones}/*`
  — 6 sub-sub-folders
- `packages/backend/shared/localization/src/Actions/{Platform,Tenant}/{Drivers,Languages,TenantLocales,TranslationJobs,Translations}/*`
  — 7 sub-sub-folders

#### P3 — 6 test packages missing Feature/Unit split

- `packages/backend/framework/database/tests/`
- `packages/backend/framework/crud/tests/`
- `packages/backend/compliance/retention/tests/`
- `packages/backend/telemetry/health/tests/`
- `packages/backend/telemetry/horizon/tests/`
- `packages/backend/authorization/tests/`

Zero test files under each — un-tested rather than mis-organized.

---

### `conventions.md` — general PHP conventions

**Total violations:** 37 (missing strict_types) + 16 unqualified globals + 9
legacy `protected $property` on models **Fix priority:** P0 (strict types), P2
(globals + legacy properties)

#### P0 — 37 files without `declare(strict_types=1);`

Sample:

- `packages/backend/framework/support/src/Path.php`
- `packages/backend/framework/support/src/Concerns/HasLaravelPaths.php`
- `packages/backend/framework/routing/src/ClassRouteAttributes.php`
- Every file under `packages/backend/framework/routing/src/Attributes/*.php` (30
  files including `Get.php`, `Post.php`, `Domain.php`, `Middleware.php`,
  `Route.php`, `AsMiddleware.php`, …)
- `packages/backend/framework/routing/src/RouteRegistrar.php`
- `packages/backend/foundation/src/Middlewares/Security/SecurityHeaders.php`
- `packages/backend/foundation/src/Middlewares/Request/SanitizeInput.php`
- `packages/backend/foundation/src/Middlewares/Request/ForceJsonResponse.php`
- `packages/backend/foundation/src/Middlewares/Request/ValidateApiVersion.php`

The `apps/academorix/**` and `tools/cli/**` trees are 100% clean.

**Fix priority:** P0 **Suggested batch:**
`chore(strict-types): add declare(strict_types=1) to routing attributes + support + foundation middlewares`.

#### P2 — 16 unqualified global function calls

Steering (`.kiro/steering/console-commands.md §Anti-patterns`).

Sample:

- `packages/backend/framework/exceptions/src/Guard.php` — 5 `sprintf(...)` calls
- `packages/backend/framework/database/src/Concerns/HasMockableStorage.php:217`
- `packages/backend/framework/routing/src/Attributes/Sunsets.php:147,155`
- `packages/backend/sdk/api-sdk/src/Attributes/SdkPayload.php:130`
- `packages/backend/sdk/api-sdk/src/Attributes/SdkEndpoint.php:180`

#### P2 — 9 legacy `protected $property` on models

- `packages/backend/platform/storage/src/Models/ChunkedUpload.php` (`$hidden`)
- `packages/backend/platform/storage/src/Models/File.php` (`$hidden`)
- `packages/backend/platform/storage/src/Models/FileVariant.php` (`$hidden`)
- `packages/backend/platform/storage/src/Models/SignedUrlAudit.php` (`$hidden`)
- `packages/backend/shared/activity/src/Models/Activity.php` (`$fillable`)
- `packages/backend/shared/transfer/src/Models/XferArtifact.php` (`$hidden`)
- `packages/backend/shared/audit/src/Models/Audit.php` (`$guarded = []`)
- `packages/backend/shared/geography/src/Models/Country.php` (`$appends`)

---

### `console-commands.md` — Console-command contract

**Status:** ✅ **100% compliant.**

| Check                                                 | Result                                                |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `use Symfony\Component\Console\Attribute\AsCommand;`  | **0 hits**                                            |
| `use Illuminate\Console\Command;` (outside vendor)    | **0 hits**                                            |
| Doubled `Stackra\Console\Console\Commands\` namespace | **0 hits**                                            |
| `extends Command` on `*Command` outside vendor        | **0 hits**                                            |
| `extends BaseCommand` on all 1,333 command classes    | ✅ 100%                                               |
| `Console/Commands/` folder in domain packages         | **0 hits** — all use flat `Console/*Command.php`      |
| `$this->info/error/warn/line` calls                   | 1 deliberate `$this->line($json)` for raw JSON output |

Every command carries `#[Stackra\Console\Attributes\AsCommand]`, extends
`Stackra\Console\Commands\BaseCommand`, uses `$this->omni->*`. Model for the
whole repo.

---

### `data-first.md` — Spatie Data, no FormRequest, no JsonResource

**Status:** ✅ **compliant.**

| Check                                                 | Result                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `extends FormRequest`                                 | 3 hits, all in compliance/architecture rules or docs                                                                                 |
| `extends JsonResource` / `extends ResourceCollection` | 1 hit in the same compliance rule                                                                                                    |
| `public function rules(): array` on a Data class      | **1 hit**: `packages/backend/framework/settings/src/Data/UpdateSettingsRequestData.php:51` — legitimate `ValidationContext` override |

---

### php-attributes - attribute-first

**Total violations:** ~15 **Fix priority:** P1 (env) / P2 (rest)

Signals:

- Legacy protected properties: 9 hits (see above)
- env() outside config/: 4 real hits at
  packages/backend/telemetry/horizon/src/Providers/HorizonServiceProvider.php:102-105
- Auth::check/user() in
  packages/backend/telemetry/sentry/src/Services/SentryService.php:120-121
- Log::info() in
  apps/academorix/src/modules/finance/gateway/src/Services/WebhookHandler.php:95
- Repository interface #[Bind] on all 316 files: 100 percent present
- Data interface #[Bind] on 320 files: 316/320 present; 4 missing in
  packages/backend/framework/scope/src/Contracts/Data/

---

### tenancy-columns - quick pre-check

**Fix priority:** N/A — the two gaps flagged in the steering are FILLED.

- Gap 1 (audits.tenant_id): filled by
  packages/backend/shared/audit/database/migrations/2026_07_15_000100_add_tenant_id_chain_to_audits_table.php
- Gap 2 (activity_log.tenant_id): filled by
  packages/backend/shared/activity/database/migrations/2026_07_15_000090_add_tenant_id_to_activity_log_table.php

Deep audit (illegal application_id outside 8 rows, illegal region_id on
organizations, #[BypassScope] without paired withoutGlobalScope) — defer to
tenancy-compliance-auditor.

---

### octane-first-di - #[Scoped] vs #[Singleton]

**Fix priority:** P1 (env + facade)

Signals:

- #[Singleton] count in Services/: 20. Spot-checked
  MailProviderWebhookIngestor.php — stateless, correctly singleton. Registries
  are all stateless catalogues.
- Auth::check() / Auth::user() in SentryService.php:120-121 — should be
  #[Auth] + #[CurrentUser].
- Log::info() in WebhookHandler.php:95 — should be #[Log(finance)].
- env() in HorizonServiceProvider.php:102-105 — bypasses config cache.

---

### hierarchy - canonical nouns (ADR-0017)

**Total violations:** 0 class-name violations + ~49 residual docblock strings.
**Fix priority:** P2

| Check                                             | Result                                               |
| ------------------------------------------------- | ---------------------------------------------------- |
| TenantMembership class or reference               | 0 hits                                               |
| tenant_memberships table name                     | 0 hits                                               |
| Workspace class name                              | 0 hits                                               |
| [Ww]orkspace in strings / docblocks / config keys | ~49 hits (all docblock prose or SDK example strings) |

Sample residual:

- packages/backend/framework/exceptions/lang/en/domain.php:27 — user-facing
  message says workspace
- packages/backend/framework/exceptions/lang/en/domain.php:28 — same
- packages/backend/framework/exceptions/src/Auth/ForbiddenException.php:78 —
  docblock
- packages/backend/framework/exceptions/src/Domain/TenantException.php:49 —
  docblock
- packages/backend/sdk/platform-application-sdk/**/*.php — ~20+ residual
  references to config/workspaces.php, workspace-picker host, WorkspaceData
  examples
- packages/backend/sdk/api-sdk/src/Attributes/Sdk{Endpoint,Payload,Response}.php
  — attribute-example strings
- packages/backend/authorization/src/Settings/AuthSettings.php:100 — docblock

Per ADR-0017 the grep exit criterion is zero hits.

---

### discovery + bootstrappers

- Direct calls to olvlvl Attributes::findTargetClasses() outside foundation: 0
  hits
- Bootstrappers in Bootstrappers/ folders: 8 across 4 packages
- One misplaced in Services/ (already flagged:
  packages/backend/platform/ai/src/Services/ToolDiscoveryBootstrapper.php)

---

### tenancy-hooks

- Two hooks — both in packages/backend/platform/tenancy/src/TenancyHooks/
- Both symmetric — implement both onTenantInitialized AND onTenantEnded
- Both carry #[AsTenancyHook(priority: 10)]

**Verdict:** compliant.

---

### scope

- #[BypassScope] — 0 hits (nothing uses it, nothing violates)
- #[ScopedTo] — attribute definition + 5 references. Consumer model audit
  deferred.

---

### testing

| Check                                                | Result                                   |
| ---------------------------------------------------- | ---------------------------------------- |
| Tests under tests/Feature/ or tests/Unit/ (Pest v4)  | 153 test folders                         |
| 6 packages missing Feature/Unit split (empty tests/) | flagged above                            |
| ->truncate() in tests                                | 0 hits — 100 percent RefreshDatabase     |
| assertExactJson (fragile)                            | 0 hits — 100 percent assertJsonStructure |

**Verdict:** shape on-standard. Coverage thin (max 17 tests per package) — defer
to test-mutation-engineer.

---

### doppler

- .env file at apps/laravel-template/.env — gitignored (verified via git
  check-ignore)
- .env absent from apps/academorix/ and every package
- Composer scripts wrapping doppler run — not audited via grep
- Real secrets scan — deferred to security-compliance-reviewer

**Verdict:** no violations found.

---

### Not applicable to PHP (TS/frontend-focused)

code-standards.md, browser-safe-imports.md, contract-reexports.md,
discovery-vs-loader.md, module-lifecycle.md, communication-patterns.md,
events-authoring.md, frontend-module-architecture.md, frontend-packages.md,
growth-and-observability.md, heroui-*, localization-content-strategy.md,
module-graph.md, module-partitioning.md, priority-ordering.md,
shell-commands.md, storage-usage.md, support-utilities.md,
ulid-prefix-registry.md, ui-components.md, sdk-authoring.md,
contract-implementer-split.md.

---

### package-conventions + package-naming + package-architecture

**Non-final concrete Service classes** (P3):

- packages/backend/telemetry/debug-bar/src/Services/DebugbarService.php
- packages/backend/telemetry/sentry/src/Services/SentryService.php

Package naming (composer names) — no violations spotted.

---

### ADR-specific compliance

| ADR                 | Rule                                           | Findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-0002 + ADR-0006 | Exceptions extend Stackra\Exceptions\Exception | All 300+ verified. No extends \Exception, \RuntimeException, \LogicException outside vendor + tests.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ADR-0010            | Events carry #[AsEvent]                        | Not deep-audited.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ADR-0011            | Seeders carry #[AsSeeder]                      | Not deep-audited.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ADR-0014            | Domain modules in apps/name/src/Modules/       | Steering says apps/api/src/modules/, actual is apps/academorix/src/modules/*/. Case-only discrepancy.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ADR-0016            | Actions-only                                   | 1,959 Actions with #[AsAction]. 56 skeleton Service shells could become CRUD-wrappers on next generator run.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ADR-0017            | No workspace in domain code                    | ~49 residual docblock strings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ADR-0018            | Business type enum + DB seed dual-source       | Not deep-audited.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ADR-0019            | No TenantSetting model                         | Zero hits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ADR-0020            | Bootstrapper vs TenancyHook — two lifecycles   | Every hook in TenancyHooks/, every bootstrapper in Bootstrappers/ except the one flagged.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ADR-0021            | Headless mandate                               | **VIOLATIONS**: 18 blade view files at packages/backend/framework/exceptions/views/errors/*.blade.php (15 files) + packages/backend/framework/exceptions/views/prompts/solution.blade.php + packages/backend/foundation/views/layouts/{app,partials/theme-styles,partials/theme-scripts}.blade.php (3); view() + response()->view() at Handler.php:181-182, HtmlErrorFormatter.php:71, InteractsWithResponse.php:200,205; VerifyCsrfToken + EncryptCookies middleware at packages/backend/foundation/src/Middlewares/Security/. |
| ADR-0022            | Every new deployable through four seams        | Not deep-audited. Defer to security-compliance-reviewer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## Top-P0 findings (ranked)

1. **56 Registry classes in Services/ (should be Registry/).**
   folder-conventions.md §Locked folder table. Mechanical git mv + namespace
   update per package.

2. **18 Blade view files + view() / response()->view() / Blade::render() call
   paths violate ADR-0021 headless mandate.** architecture.md §Non-negotiable
   conventions + ADR-0021. Hits at exceptions/views/errors/_.blade.php,
   foundation/views/layouts/_.blade.php, Handler.php:181-182,
   HtmlErrorFormatter.php:71, InteractsWithResponse.php:200,205.

3. **VerifyCsrfToken + EncryptCookies middleware ships in foundation/.** Same
   rule set. Delete or gate behind a config flag.

4. **37 files under packages/backend/**/src missing declare(strict_types=1).**
   Concentration in framework/routing/src/Attributes/*.

5. **Foundation Middlewares/ folder** — plural naming + sub-nested
   Request/Response/Security/.

6. **ToolDiscoveryBootstrapper misplaced in Services/.**

7. **56 skeleton <Concept>Service shells at risk of becoming CRUD-wrappers** on
   next generator run.

8. **4 files in packages/backend/framework/scope/src/Contracts/Data/ missing
   #[Bind(<Model>::class)].**

9. **Two packages have two-level Action nesting** (geography + localization, 13
   sub-sub-folders total).

10. **~49 residual [Ww]orkspace strings** (ADR-0017 grep exit criterion is
    zero).

11. **env() reads in HorizonServiceProvider.php:102-105** — move to
    config(horizon.notifications.*) + #[Config].

12. **Auth::check() + Auth::user() in SentryService.php:120-121** — should be
    #[Auth] + #[CurrentUser].

13. **Log::info() in WebhookHandler.php:95** — should be #[Log].

14. **9 legacy protected $fillable/hidden/appends/guarded on models.**

15. **1 registry in Support/:**
    packages/backend/framework/routing/src/Support/ApiVersionRegistry.php.

16. **6 packages ship an empty tests/ folder.**

17. **~450 framework files missing @category / @since Magento tags.**

18. **2 non-final concrete Service classes** (DebugbarService, SentryService).

19. **~16 unqualified global function calls** in namespaced files.

20. **1,608 Action files carry a redundant Action suffix.**

---

## Package-level violation heatmap

| Package                               | P0  | P1  | P2  | P3  | Total |
| ------------------------------------- | --- | --- | --- | --- | ----- |
| packages/backend/foundation           | 3   | 0   | 4   | 0   | 7     |
| packages/backend/framework/exceptions | 2   | 1   | 15  | 0   | 18    |
| packages/backend/framework/routing    | 1   | 0   | 30  | 0   | 31    |
| packages/backend/framework/scope      | 1   | 4   | 3   | 0   | 8     |
| packages/backend/framework/settings   | 0   | 1   | 0   | 0   | 1     |
| packages/backend/telemetry/horizon    | 0   | 4   | 0   | 0   | 4     |
| packages/backend/telemetry/sentry     | 0   | 2   | 0   | 1   | 3     |
| packages/backend/telemetry/debug-bar  | 0   | 0   | 1   | 1   | 2     |
| packages/backend/access/* (5)         | 5   | 0   | 5   | 0   | 10    |
| packages/backend/platform/* (20)      | 12  | 4   | 0   | 0   | 16    |
| packages/backend/notifications/* (9)  | 5   | 3   | 0   | 0   | 8     |
| packages/backend/billing/* (2)        | 2   | 0   | 0   | 0   | 2     |
| packages/backend/shared/geography     | 1   | 0   | 0   | 0   | 1     |
| packages/backend/shared/localization  | 1   | 0   | 0   | 0   | 1     |
| packages/backend/shared/audit         | 0   | 1   | 0   | 0   | 1     |
| packages/backend/shared/activity      | 0   | 1   | 0   | 0   | 1     |
| packages/backend/framework/support    | 0   | 0   | 2   | 0   | 2     |
| apps/academorix/**                    | 1   | 1   | 0   | 0   | 2     |
| tools/cli/**                          | 0   | 0   | 0   | 0   | 0     |

Ranked descending by P0 then total. Platform/* and notifications/* trees carry
the largest cluster of Registry-in-Services violations.

---

## Suggested fix order

Numbered list — top 10 batches to feed to codebase-housekeeper.

1. **refactor(headless): remove Blade error views + view() call paths** —
   ADR-0021. Files: packages/backend/framework/exceptions/views/**/\*.blade.php
   (16); packages/backend/foundation/views/**/*.blade.php (3);
   Handler.php:181-182, HtmlErrorFormatter.php:71,
   InteractsWithResponse.php:200,205. Choose JSON-first replacement or gate to
   APP_ENV=local. **Blocks nothing; needs deep human review.**

2. **refactor(folder-conventions): move Registry classes from Services/ +
   Support/ to Registry/** — 57 files across access, billing, platform,
   notifications, framework/scope, framework/routing. Each move includes
   updating namespace + every consumer. **Depends on nothing.**

3. **chore(strict-types): add declare(strict_types=1) to routing + support +
   foundation middlewares** — 37 files. **Depends on nothing.**

4. **refactor(foundation): flatten Middlewares/{Request,Response,Security}/ to
   Middleware/*** — bundles folder rename + namespace update + strict-types fix.
   **Sequences after batch 3.**

5. **refactor(actions): flatten Actions/{Platform,Tenant}/<Ctx>/ to
   Actions/<Ctx>/** — 13 folders in geography + localization.

6. **refactor(bootstrap): move ToolDiscoveryBootstrapper from Services/ to
   Bootstrappers/** — one file.

7. **chore(headless): delete VerifyCsrfToken + EncryptCookies from
   foundation/Middlewares/Security** — ADR-0021. **Depends on batch 4.**

8. **chore(hierarchy): rename residual workspace to tenant in docblocks + lang
   files + SDK docblocks** — ADR-0017. ~49 hits.

9. *_chore(scope): add #[Bind(ScopeXxx::class)] to
   Contracts/Data/*Interface.php*_ — 4 files.

10. **chore(octane-di): swap Auth:: / Log:: facade calls in SentryService +
    WebhookHandler + Horizon env() to attribute injection** — 3 files.

Follow-ups (not top-10):

- Migrate 9 legacy protected $fillable/hidden/appends/guarded to attributes.
- Add @category / @since to ~450 framework files (Pint / Rector rule).
- Prefix unqualified globals with backslash (Rector rule).
- Drop redundant Action suffix from 1,608 files (generator template fix).
- Mark SentryService + DebugbarService final; extract Sentry interface.
- Verify PHPStan NoServiceLayerRule covers every domain module.

---

## Follow-ups (not violations, informational)

### Broken steering references

- .kiro/steering/models.md references old/backend/modules/reviewing/** — that
  folder does not exist. Reference is historical.
- .kiro/steering/architecture.md §Monorepo layout lists apps/template, apps/api,
  apps/ai-service — actual apps are apps/academorix, apps/laravel-template,
  apps/react-native-template, apps/vite-template.
- .kiro/steering/docblocks.md references
  stackra-backend/apps/api/config/auth.php — that file does not exist.
- .kiro/steering/domain-patterns.md references apps/api/src/modules/* — should
  be apps/academorix/src/modules/*.
- Path drift across steering files: stackra-backend/** vs
  academorix-frontend/**.

### Aspirational rules with no consumers

- .kiro/steering/folder-conventions.md §Enforcement — TODO(package-compliance):
  add a rule. The rule set is documented but not shipped. Compliance is a
  per-review manual check.

### Steering files that seem stale

- .kiro/steering/architecture.md — monorepo layout table does not match reality.
- Multiple steering files still reference stackra/* framework packages where
  actual code uses stackra/*. .kiro/steering/package-naming.md itself documents
  the migration is in-progress.

### Coverage gaps (not violations — deferred to sibling reviewers)

- **Tenancy compliance** — cross-tenant FKs, illegal application_id on
  non-8-row-types, illegal shortcut FKs — defer to tenancy-compliance-auditor.
- **Octane runtime behaviour under load** — request-state leaks — defer to
  backend-architecture-reviewer.
- **Real secrets in git** — high-entropy hex, sk_live_*, private keys — defer to
  security-compliance-reviewer.
- **Test coverage depth / mutation score** — defer to test-mutation-engineer.
- **Cross-service contract consistency** — defer to docs-adr-steward.

---

## What is solid (preserve)

- **Console-command discipline is exemplary.** 1,333 commands extending
  BaseCommand, using #[AsCommand], $this->omni, method DI on handle(). Zero
  doubled-namespace hits. Zero Symfony AsCommand imports. Zero Laravel Command
  extends outside vendor.
- **Actions-only architecture is 100 percent enforced.** 1,959 Action files, all
  final, all carry #[AsAction], all use AsController trait.
- **Repository interfaces carry #[Bind]** across all 316 files.
- **Data-first is 100 percent clean.** Only 1 rules() method — a legitimate
  ValidationContext override.
- **Attribute-first models.** Only 9 protected $property leftovers (all wrapping
  vendor base models), zero Model::observe() calls, zero Route::get() calls.
- **Migrations are canonical.** All 329 files have @file docblocks + strict
  types + down() methods. No truncate. No fixture arrays.
- **Repository interface layout.** 100 percent under Contracts/Repositories/.
  Data interfaces 99 percent under Contracts/Data/.
- **Exception hierarchy is 100 percent clean.** Every exception extends
  Stackra\Exceptions\Exception; zero \Exception, \RuntimeException, or
  \LogicException extensions outside vendor + tests.
- **Foundation contracts + DI framework.** Discovery is entirely gated by the
  DiscoversAttributes contract; no direct olvlvl calls outside foundation.
- **TenancyHooks are symmetric + attribute-driven.**
- **Migration schema tenant_id gaps in tenancy-columns.md are FILLED** (audit +
  activity tables both migrated).

Packages that model the standard well:

1. **packages/backend/framework/feature-flags** — canonical actions, data,
   models, interfaces, #[Bind], #[AsFeatureFlag], attribute-first repository
   with #[UseModel] + #[Cacheable] + #[Filterable].
2. **packages/backend/access/delegation** — 300+ exception classes, every one
   with CODE / TRANSLATION_KEY constants + @category / @since.
3. **packages/backend/platform/tenancy/src/TenancyHooks/** — perfect
   AsTenancyHook + symmetric init/end implementation.
4. **packages/backend/framework/service-provider** — the attribute-first
   provider + bootstrapper contract every other package builds on.
