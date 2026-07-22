# Backend Architecture Reviewer — Design-Level Audit

**Date:** 2026-07-21 **Scope:** `packages/backend/**`, `apps/academorix/**`,
`tools/cli/**` **Mode:** READ-ONLY. No code, migrations, or configs modified.

## Executive summary

- **PHP files in scope:** 14,029 (13,974 in `packages/backend` +
  `apps/academorix`, 55 in `tools/cli`).
- **Actions-only mandate compliance:** ~100% — 2,072 files carry `#[AsAction]`;
  zero domain-module classes extend `Controller` / `BaseController` /
  `CrudController`; zero `Controllers/` folders in domain modules.
- **Headless mandate compliance:** ~85% — no `routes/` folders, no
  `RouteServiceProvider`, but foundation still ships CSRF + EncryptCookies
  middleware + a full-HTML Blade layout (`foundation::layouts.app`).
- **Octane-first DI compliance:** ~95% — 605 `#[Scoped]` vs 110 `#[Singleton]`;
  **one live singleton pattern with static state and captured request state in
  `SentryService`** is the sharpest edge.
- **Attribute-first DI compliance:** ~92% — 43 imperative `->bind()` /
  `->singleton()` calls remain (12 in framework/exceptions; the rest largely
  closure-based and legitimate).
- **Provider migration compliance:** 120 providers on the new
  `@stackra/service-provider` base, 3 legacy providers still on
  `AbstractModuleServiceProvider`.
- **Trait/lifecycle gotcha compliance:** clean — `BaseCommand` correctly aliases
  the `UsesOmniTerm` trait's `initialize()`.
- **Discovery seam compliance:** clean — 143 files use `DiscoversAttributes`; no
  homegrown reflection walks in domain code.
- **Bootstrapper vs TenancyHook confusion:** none — hooks live under
  `TenancyHooks/`, bootstrappers under `Bootstrappers/`.
- **Additional critical break:** **25 apps/academorix SDK packages (498 files)
  declare `namespace Stackra\...` while their composer.json PSR-4 maps
  `Academorix\`** — every SDK class will fail composer autoload. See §Additional
  finding.

Overall shape: the architecture is _sound_ — actions-only landed,
attribute-first DI landed, discovery seam landed, provider migration is 97.6%
complete. The concerns worth attention are (1) the headless mandate has cosmetic
leaks in framework/foundation, (2) a single high-blast-radius Octane bug in the
sentry telemetry package, and (3) an SDK-wide autoload break in
`apps/academorix/src/sdks`.

---

## Findings by concern

### 1. Actions-only mandate

- **Total violations:** 0 (in domain modules).
- **Pattern breakdown:**
  - `class *Controller` in a domain module: **0** hits.
  - Domain module extending `Illuminate\Routing\Controller`: **0** hits.
  - Domain module extending `Stackra\Routing\Controller` / `BaseController` /
    `Stackra\Crud\Controllers\CrudController`: **0** hits.
  - Files under `src/Actions/**` (excluding `Actions/Support/`) NOT carrying
    `#[AsAction]`: **0** (a single test file lives under
    `packages/backend/platform/application/tests/Feature/Actions/Applications/ListApplicationsTest.php`
    and is correctly out of scope).
  - `#[UseService]` attribute uses on production classes: **0** — only appears
    in docblocks (concern 4 has more on this).
- **Dead framework scaffolding** (P1, not a mandate violation but calls for
  cleanup):
  - `packages/backend/framework/crud/src/Controllers/CrudController.php:119` —
    imports `use Stackra\Crud\Contracts\ServiceInterface;` but that class **does
    not exist on disk** (no
    `packages/backend/framework/crud/src/Contracts/ServiceInterface.php`).
  - Same file `use Stackra\Crud\Attributes\UseService;` — `UseService.php` is
    likewise missing from `crud/src/Attributes/` (verified: only
    `AsCriteria/AsRepository/AsScope/Cacheable/Filterable/OrderBy/UseCriteria/UseData/UseModel/UsePolicy/UseQueryScope/UseResource/UseScope/WithCount/WithRelations.php`
    present).
  - `packages/backend/framework/routing/src/Concerns/InteractsWithServices.php:17`
    — same broken import.
  - `AsController`
    (`packages/backend/framework/routing/src/Concerns/AsController.php:165`)
    composes `use InteractsWithServices;`, so every action indirectly relies on
    this trait. It doesn't fatal at boot because `$this->service()` is never
    called (`#[UseService]` is only referenced in docblocks), but PHPStan max
    would flag the import.
- **Fix priority:** P1 (delete or ship the missing interface/attribute — the
  code as-shipped won't survive PHPStan max, contradicting
  `docs/architecture.md`'s "Static analysis: Larastan / PHPStan (level max)").

### 2. Headless mandate

- **Total violations:** 3 files + a folder-taxonomy break.
- **Pattern breakdown:**
  - `routes/*.php` files anywhere: **0** hits.
  - `RouteServiceProvider` in packages: **0** hits.
  - `resources/views/**/*.blade.php` shipping HTML: **18** files across 2
    packages (foundation + framework/exceptions).
  - CSRF / EncryptCookies middleware on the `web` group: **2** files under
    `packages/backend/foundation/src/Middlewares/Security/`.
- **Sample violations:**
  - `packages/backend/foundation/views/layouts/app.blade.php` — full HTML
    `<!DOCTYPE html>...<body>@yield('content')</body></html>` skeleton with
    Tailwind CDN, Google Fonts (`Inter`), theme-aware `data-theme` toggling.
    Purely stateful-web infrastructure.
  - `packages/backend/foundation/src/Middlewares/Security/VerifyCsrfToken.php:89`
    — `#[AsMiddleware(alias: 'csrf', groups: ['web'], priority: 25)]`.
    Fully-formed CSRF middleware with `$except`, `$session`, `hash_equals`
    compare, and `X-XSRF-TOKEN` cookie decryption logic. Contradicts
    `architecture.md`'s "no session middleware, no CSRF cookie".
  - `packages/backend/foundation/src/Middlewares/Security/EncryptCookies.php:49`
    — `groups: ['web']`. Same story.
  - `packages/backend/framework/exceptions/views/errors/{400,401,402,403,404,405,419,422,429,500,502,503,504}.blade.php`
    — every one `@extends('foundation::layouts.app')`. The exception renderer
    defaults to Blade HTML instead of JSON for these codes — inverted from what
    a headless API needs.
- **Folder taxonomy break (adjacent violation):**
  - `packages/backend/foundation/src/Middlewares/{Request,Response,Security}/*.php`
    — plural `Middlewares/` with three nested subfolders.
    `package-architecture.md` §Locked folder table names `Middleware/`
    (singular, flat). 18 files carry
    `namespace Stackra\Foundation\Middlewares\{Request,Response,Security}` — the
    doubled category name is what the rule bans (parallel to the
    `Console\Console\Commands` warning in `console-commands.md`). Foundation
    ALSO ships a lone
    `packages/backend/foundation/src/Middleware/AssignCorrelationId.php` on the
    correct path, so both taxonomies coexist in one package.
- **Fix priority:** P0 for the CSRF/cookie/HTML surface (headless mandate is the
  flagship contract from `architecture.md`); P1 for the `Middlewares/` folder
  split.

### 3. Package boundaries

- **Packages requiring an app:** 0 hits (grepped every
  `packages/backend/**/composer.json` for `academorix` / `apps/academorix` —
  none).
- **Circular package deps:** none observed in the sampled paths (framework
  packages point up-graph; every domain module in `packages/backend/platform`
  requires `stackra/foundation`, `stackra/service-provider`, `stackra/database`,
  etc. — one-directional).
- **`stackra/foundation` universality:** the vast majority of non-app
  composer.json files require `stackra/foundation`; the exempt ones are
  `stackra/support`, `stackra/enum`, `stackra/container`, `stackra/foundation`
  itself — legitimate.
- **Fix priority:** clean ✓.

### 4. Octane-first DI

- **`#[Singleton]` classes:** 110.
- **`#[Scoped]` classes:** 605.
- **Facade usage inside services / actions (Log, Auth, Cache, DB, Session):**
  299 total call sites across the codebase, but **276 of those are
  migrations/seeders** (fine — one-shot scripts, no Octane concern). Only 9 hits
  are in `src/Services/` or `src/Actions/`, all of which are
  `DB::transaction(...)` (legitimate — the facade IS the transaction seam) or
  `DB::raw(...)` for aggregate SQL, or a single `Log::info` in
  `WebhookHandler.php`.
- **Static state on services:** 1 confirmed live vector.
- **`env()` outside `config/`:** 6 hits outside migrations/architecture
  rules/docblocks (see §Sample violations).
- **`app()->make(...)` inside constructor:** 0 in domain code; 0 in framework
  code.
- **Boot-time `app()->make(...)`:** limited to legitimate provider `register()`
  bodies inside closures (43 imperative `->bind`/`->singleton` calls — concern
  5).

- **Sample violations (top 5):**

  1. **`packages/backend/telemetry/sentry/src/Services/SentryService.php:78`** —
     P0.

     ```php
     #[Scoped]
     class SentryService
     {
         private static ?self $instance = null;
         // Entire public API is `public static function {isEnabled,configureScope,addBreadcrumb,captureException,captureMessage}(...)`.
         // configureScope() calls Auth::user(), request(), app()->environment() → captures per-request state into a static-held instance.
     }
     ```

     The `#[Scoped]` annotation is neutralised because `self::getInstance()`
     (line 95) stores the constructed object into `self::$instance` — a static
     property that survives every request. Under Octane, request-1's
     authenticated user + request-1's request-context leak into request-2's
     `configureScope()` call. `octane-first-di.md` §Anti-patterns cites this
     exact case: "Boot-time `Sentry::configureScope(...)` capturing request data
     → `Sentry::configureScope(...)` inside a request-scoped reporter".

  2. **`packages/backend/telemetry/horizon/src/Providers/HorizonServiceProvider.php:102-105`**
     — P1.

     ```php
     $mailTo = env('HORIZON_MAIL_NOTIFICATIONS');
     $slackWebhook = env('HORIZON_SLACK_WEBHOOK');
     $slackChannel = env('HORIZON_SLACK_CHANNEL', '#horizon');
     $smsTo = env('HORIZON_SMS_NOTIFICATIONS');
     ```

     `env()` outside `config/` bypasses Laravel's config cache.
     `octane-first-di.md` §Rules-don't #4 catches this exactly. Migrate to
     `config('horizon.notifications.mail')` + declare defaults in a
     `config/horizon.php`.

  3. **`packages/backend/telemetry/health/src/Support/HealthNotificationConfig.php:35,39`**
     — P1. Same shape: `env('HEALTH_SLACK_PLATFORM_ENG_WEBHOOK')` and
     `env('HEALTH_PAGERDUTY_KEY')` inside a Support helper. Move to config file.
  4. **`packages/backend/telemetry/debug-bar/src/Services/DebugbarService.php`**
     — P2. All-static (`info`, `warning`, `error`, `addMessage`, `startMeasure`,
     `stopMeasure`, `measure`, `addException`, `addTimelineEvent`) service. No
     static state (safe), but bypasses DI — can't be mocked / rebound /
     feature-flagged. Should be a `#[Scoped]` service with a facade in front if
     the terse call-site sugar is required.
  5. **`packages/backend/framework/settings/src/Listeners/WriteSettingsChangeToAudit.php:60`**
     — safe (correctly `#[Scoped]`, injects `Request` as constructor dep).
     Called out only because injecting `Request` into a listener under a
     `#[Scoped]` binding is one of the trickier idioms — this one is right.
     Documented here as a positive control.

- **Fix priority:** P0 for finding 1; P1 for findings 2-3; P2 for finding 4.

### 5. Attribute-first DI

- **Manual `$this->app->bind/singleton/scoped/instance/extend()` in providers:**
  43 total call sites.
- **Distribution:**
  - `exceptions/src`: 12 (mostly `useFactory` closures — legitimate; a few pure
    identity `singleton(A::class, A::class)` that should migrate to
    `#[Singleton]` on the target class).
  - `framework/service-provider`: 5 (framework-primitive wiring — legitimate).
  - `compliance/architecture/src`: 5 (framework-primitive wiring — legitimate).
  - `framework/caching`: 4 (legitimate — env-driven cache-driver selection).
  - `framework/container`: 3 (legitimate — DI framework itself).
  - `packages/backend/sdk/*-sdk`: 6 (SDK wiring — mostly closures).
  - Everything else: 8 (mostly legitimate closures).
- **Providers extending legacy `AbstractModuleServiceProvider`:** 3 files (see
  concern 6).
- **Providers on new `Stackra\ServiceProvider\Providers\ServiceProvider` base:**
  120 files.
- **Sample recommended migration:**

  ```php
  // packages/backend/framework/exceptions/src/Providers/ExceptionsServiceProvider.php:193
  $this->app->singleton(ExceptionMapper::class, ExceptionMapper::class);
  $this->app->singleton(JsonErrorFormatter::class, JsonErrorFormatter::class);
  $this->app->singleton(HtmlErrorFormatter::class, HtmlErrorFormatter::class);
  $this->app->singleton(LogReporter::class, LogReporter::class);
  $this->app->singleton(SentryReporter::class, SentryReporter::class);
  ```

  All five are identity bindings — trivial migration to `#[Singleton]` on the
  concrete class (per `php-attributes.md` §Container class-level).

- **Fix priority:** P2 — cosmetic cleanup that reduces provider surface area and
  lets the container-attribute discovery pipeline own the wiring.

### 6. Provider migration

- **Providers on new `@stackra/service-provider` base
  (`Stackra\ServiceProvider\Providers\ServiceProvider`):** 120.
- **Providers on legacy `AbstractModuleServiceProvider`:** 3.
- **Legacy providers awaiting migration:**
  - `packages/backend/framework/exceptions/src/Providers/ExceptionsServiceProvider.php`
  - `packages/backend/foundation/src/Providers/FoundationServiceProvider.php`
  - `packages/backend/compliance/architecture/src/Providers/ArchitectureServiceProvider.php`
- **Third-party base extenders using `AsModuleProvider` trait:** all three that
  need it — `HorizonServiceProvider`, `DebugbarServiceProvider`, and one
  implicit case (`SentryServiceProvider` extends `ServiceProvider` from Laravel
  directly rather than `AsModuleProvider`+`BaseServiceProvider`, which is
  acceptable because Sentry's vendor provider isn't extended). ✓
- **Fix priority:** P2 — migration momentum is strong; finish the last 3 during
  the next touch.

### 7. Discovery seam

- **Files referencing `DiscoversAttributes`:** 143.
- **Files using `new ReflectionClass(...)` outside vendor/tests:** 37.
- **Breakdown of `ReflectionClass` sites:**
  - 10 in `service-provider/src` — framework primitive (legitimate).
  - 5 in `src/Concerns` (routing InteractsWithServices, crud
    Concerns/Repository, etc.) — legitimate reflection-verify inside
    bootstrappers.
  - 3 in `framework/routing`, 3 in `database/src` — framework primitives.
  - Every remaining hit is a legitimate reflection-verify per `discovery.md`
    §Non-negotiable rules #5 ("Reflection-verify before registering") — none are
    homegrown scan-across-classes.
- **Homegrown `olvlvl` direct usage:** 0 hits — every consumer routes through
  `DiscoversAttributes`.
- **Fix priority:** clean ✓.

### 8. Bootstrapper vs TenancyHook confusion

- Files mixing `#[AsBootstrapper]` + `#[AsTenancyHook]` in the same class: 0
  hits.
- `TenancyHooks/` folders under domain modules: 1 package
  (`packages/backend/platform/tenancy/src/TenancyHooks/`), 2 hooks
  (`CachePrefixTenantHook`, `LogContextTenantHook`). Both correctly implement
  `TenancyHookInterface`, snapshot state on `onTenantInitialized()`, restore on
  `onTenantEnded()`, guard container-resolution failures with try/catch, return
  early on `null` tenant.
- `Bootstrappers/` folders under domain modules: 15 packages carry them
  (framework primitives + versioning). All correctly extend
  `AbstractBootstrapper`.
- **But:**
  `packages/backend/framework/service-provider/src/Dispatchers/TenancyHookDispatcher.php:56`
  carries a live TODO — "Phase 10 (api tenancy modernization, task 10.15) wires
  a listener that resolves this dispatcher and calls
  `fireInit($event->tenancy->tenant)` / `fireEnd($event->tenancy->tenant)` on
  those events. Until then, per-tenant hook registrations WILL NOT FIRE — the
  framework primitive exists but the invocation site is a Phase 10 deliverable."
  - The docblock references `apps/api/src/modules/tenancy/` — this workspace
    ships `apps/academorix/` instead. The docblock is stale.
  - Practical effect: `CachePrefixTenantHook` and `LogContextTenantHook` are
    DEAD-registered. When a request runs,
    `tenant_id`/`tenant_slug`/`application_id` never land in the log context;
    cache reads never get their per-tenant prefix. Silent security surface:
    cache reads under Octane are cross-tenant unless something else prefixes.
- **Fix priority:** P1 — the primitives exist but no invocation site is wired.
  Ship the tenancy-init listener before the observability audit fires.

### 9. Trait `initialize()` gotcha

- Classes overriding `initialize()` with a composed trait that also defines it,
  without aliasing: **0** confirmed hits.
- Only `packages/backend/framework/console/src/Commands/BaseCommand.php:52`
  overrides `initialize()`, and it correctly aliases the `UsesOmniTerm` trait's
  method:

  ```php
  use UsesOmniTerm { initialize as bootOmniTerm; }
  ```

  Its override calls `$this->bootOmniTerm($input, $output)` after capturing the
  start-time timestamp — canonical pattern per `console-commands.md` §Trait
  aliasing.

- Same review pass for `boot()` / `booted()` / `configure()` / `newFactory()`: 0
  domain-model class overrides these methods while composing a trait that also
  defines them.
  - `apps/academorix/src/modules/products/geofencing/src/Models/GeofenceCheck.php:117`
    — overrides `booted()`. Composed traits: `Auditable`, `BelongsToTenant`,
    `HasFactory`, `HasMetadata`, `HasPrefixedUlid`, `SoftDeletes`, `Userstamps`.
    None of these declare `booted()` (they declare `bootAuditable()`,
    `bootBelongsToTenant()`, etc. per Laravel's automatic `boot<TraitName>`
    dispatch). No conflict. ✓
- **Fix priority:** clean ✓.

### 10. Error-handler pre-boot safety

- Error handlers reading `$this->omni` (or another trait-owned property) without
  `isset()` guard: **0** confirmed hits.
- `BaseCommand::execute()` (`framework/console/src/Commands/BaseCommand.php:91`)
  does NOT wrap `handle()` in try/catch — it only fires before/after AOP hooks.
  If a fatal happens pre-`initialize()`, Symfony Console's default error
  rendering fires, not a Stackra path. No `$this->omni` access before
  `initialize()` seams observed.
- No observers / listeners reference `$this->omni` at all — clean.
- **Fix priority:** clean ✓.

---

## Additional finding — critical namespace-declaration break in apps SDKs

**Not covered by the ten charter concerns but P0 for release readiness.**

Every SDK package under `apps/academorix/src/sdks/*` declares its PSR-4 root as
`Academorix\<SdkName>\` in its `composer.json`, but the actual PHP source files
declare `namespace Stackra\<SdkName>\...`. Composer autoload will fail on every
one of these classes.

- **25 SDK packages affected** — every folder under `apps/academorix/src/sdks/`
  with a `src/` tree.
- **498 files affected** —
  `grep -rn '^namespace Stackra' apps/academorix/src/sdks --include="*.php"`
  returns 498 matches.
- **Distribution top-10:**

  | SDK                         | Files with wrong namespace |
  | --------------------------- | -------------------------: |
  | `platform-integrations-sdk` |                         40 |
  | `sports-progress-sdk`       |                         36 |
  | `sports-registrations-sdk`  |                         33 |
  | `finance-expenses-sdk`      |                         33 |
  | `sports-drills-sdk`         |                         30 |
  | `sports-medical-sdk`        |                         29 |
  | `sports-development-sdk`    |                         28 |
  | `sports-performance-sdk`    |                         22 |
  | `platform-forms-sdk`        |                         21 |
  | `platform-credentials-sdk`  |                         21 |

- **Concrete example:**

  ```
  apps/academorix/src/sdks/finance-expenses-sdk/composer.json:
    "autoload": { "psr-4": { "Academorix\\FinanceExpensesSdk\\": "src/" } }

  apps/academorix/src/sdks/finance-expenses-sdk/src/Resources/ExpensesResource.php:
    namespace Stackra\FinanceExpensesSdk\Resources;
  ```

- **Consumers of the SDK write
  `use Stackra\FinanceExpensesSdk\Resources\ExpensesResource;`** — that FQCN is
  not registered by any autoloader (`composer dump-autoload` maps
  `Academorix\FinanceExpensesSdk\Resources\ExpensesResource` to that file, but
  the class-name PHP declares is `Stackra\FinanceExpensesSdk\...`). Result:
  `Class not found` at every consumer call site.
- **Cross-check:** `apps/academorix/src/modules/**/src/*.php` (4,857 files)
  correctly declares `namespace Academorix\<Domain>\...`. The break is scoped to
  the SDK folder.
- **Fix priority:** P0. Every cross-service SDK consumer path is broken. Either
  rewrite the 498 file namespace declarations to `Academorix\<SdkName>\...` OR
  (rejected — see `package-naming.md`) rewrite every SDK composer.json to map
  `Stackra\<SdkName>\`. The former matches the package-naming rule Rule 5 ("PHP
  namespace derives mechanically from the vendor";
  `academorix-<domain>/<name>-sdk` → `Academorix\<Domain>\<NameSdk>\`).

---

## Top-P0 architectural violations

Ranked by blast radius (Octane runtime correctness > tenancy isolation > release
readiness > code-hygiene).

1. **`apps/academorix/src/sdks` namespace-declaration break** — 498 files, 25
   SDKs. Every cross-service SDK consumer is broken. P0-blocker.
2. **`SentryService` static-singleton with captured request state** —
   `packages/backend/telemetry/sentry/src/Services/SentryService.php`. Concrete
   Octane request-state leak. Ships silently — the `#[Scoped]` annotation looks
   correct at a glance, but the `private static ?self $instance` under the hood
   defeats it.
3. **Headless-mandate leaks in `packages/backend/foundation`** —
   `foundation/src/Middlewares/Security/{VerifyCsrfToken,EncryptCookies}.php`
   (both `groups: ['web']`) + `foundation/views/layouts/app.blade.php` (full
   HTML skeleton) + 13 error Blade views. Contradicts `architecture.md`'s "no
   `resources/`, no `routes/web.php`, no session middleware, no CSRF cookie".
4. **TenancyHooks registered but never fired** —
   `packages/backend/framework/service-provider/src/Dispatchers/TenancyHookDispatcher.php:56`.
   `CachePrefixTenantHook` + `LogContextTenantHook` are dead. Cache reads under
   Octane are effectively unprefixed — silent cross-tenant read risk.
5. **Middlewares/ folder violation** —
   `packages/backend/foundation/src/Middlewares/{Request,Response,Security}/`
   uses plural + nested taxonomy against `package-architecture.md`'s flat
   singular `Middleware/`. 18 files' namespaces need to move.
6. **`env()` outside `config/`** — Horizon + health packages read `env(...)` at
   runtime in `Providers/` and `Support/`. Bypasses Octane's cached config;
   observed 6 lines total.
7. **CrudController + InteractsWithServices broken imports** —
   `framework/crud/src/Controllers/CrudController.php` +
   `framework/routing/src/Concerns/InteractsWithServices.php` import
   `Stackra\Crud\Attributes\UseService` and
   `Stackra\Crud\Contracts\ServiceInterface`, neither of which exist on disk.
   `AsController` transitively composes the trait, so every action carries a
   broken import (works at runtime because `$this->service()` is never invoked,
   but PHPStan max would fail).
8. **3 legacy `AbstractModuleServiceProvider` extenders** — exceptions,
   foundation, compliance/architecture. Migration is 97.6% complete; finish the
   last three.
9. **`DebugbarService` all-static API** — bypasses DI, cannot be mocked or
   rebound. Migrate to `#[Scoped]` service.
10. **Identity `$this->app->singleton(A::class, A::class)` calls in
    framework/exceptions** — 5+ hits that should migrate to `#[Singleton]` on
    the target class.
11. **`packages/backend/telemetry/horizon/src/Providers/HorizonServiceProvider.php:102-105`**
    — 4x `env(...)` in `configureNotifications()`.
12. **Stray `stackra-platform` sub-vendor** —
    `apps/academorix/src/sdks/platform-application-sdk/composer.json` names
    itself `stackra-platform/application-sdk` (sub-vendor with a single
    package), while `package-naming.md` §Rule 3 requires 3+ packages before
    spinning up a sub-vendor. Should be `stackra/platform-application-sdk` OR
    `academorix-platform/application-sdk` per the boundary rule.
13. **Deprecated `Stackra\Routing\Controller` still ships** — legitimate per
    `NoBaseControllerRule.php:37` exception, but the deprecation banner has been
    up since ADR 0016 (a while ago) and no framework primitive still extends it.
    Candidate for removal.
14. **`Stackra\Crud\Controllers\CrudController` still ships** — same story. Zero
    domain consumers, broken imports, legacy scaffolding. Delete or fix the
    imports.

---

## Package-level architecture heatmap

Sort by P0-severity descending. `P0`/`P1`/`P2` counts are the sample-cited
findings this report already surfaces — not an exhaustive per-package tally.

| Package                                       | P0  | P1  | P2  | Notes                                                                                                    |
| --------------------------------------------- | :-: | :-: | :-: | -------------------------------------------------------------------------------------------------------- |
| `apps/academorix/src/sdks/*` (25 SDKs)        |  1  |  0  |  0  | 498-file namespace-declaration break — the largest single P0.                                            |
| `packages/backend/foundation`                 |  1  |  1  |  0  | CSRF + EncryptCookies + Blade error pages + `Middlewares/` folder split.                                 |
| `packages/backend/telemetry/sentry`           |  1  |  0  |  0  | Static-singleton `SentryService` captures request state.                                                 |
| `packages/backend/framework/service-provider` |  0  |  1  |  0  | TenancyHookDispatcher never invoked.                                                                     |
| `packages/backend/framework/crud`             |  0  |  1  |  1  | Broken imports in CrudController + dead framework scaffolding.                                           |
| `packages/backend/framework/routing`          |  0  |  1  |  0  | `InteractsWithServices` broken import.                                                                   |
| `packages/backend/telemetry/horizon`          |  0  |  1  |  0  | `env()` outside config; extends vendor base via `AsModuleProvider` — good.                               |
| `packages/backend/telemetry/health`           |  0  |  1  |  0  | `env()` outside config in `HealthNotificationConfig`.                                                    |
| `packages/backend/framework/exceptions`       |  0  |  0  |  2  | Legacy `AbstractModuleServiceProvider` + 12 identity `->singleton()` calls to migrate to `#[Singleton]`. |
| `packages/backend/compliance/architecture`    |  0  |  0  |  1  | Legacy `AbstractModuleServiceProvider`.                                                                  |
| `packages/backend/telemetry/debug-bar`        |  0  |  0  |  1  | All-static `DebugbarService` bypasses DI.                                                                |
| Every other package                           |  0  |  0  |  0  | Clean or below-noise-floor.                                                                              |

---

## Suggested fix order

Numbered batches, each sized for a single commit. Order is P0 first, then
blast-radius descending.

1. **Batch 1 — SDK namespace-declaration break (P0).** Bulk-rewrite 498 files
   under `apps/academorix/src/sdks/**/src/**` to declare
   `namespace Academorix\<SdkStudlyCase>\...` instead of
   `namespace Stackra\...`. Update every `Tests/` file namespace too (verified:
   also uses `Stackra\`). `composer dump-autoload` after. One commit per SDK is
   defensible; one bulk commit is faster and audit-friendlier.
2. **Batch 2 — Fix or remove the CRUD scaffolding (P1).** Either (a) delete
   `packages/backend/framework/crud/src/Controllers/CrudController.php` and
   `packages/backend/framework/routing/src/Concerns/InteractsWithServices.php`
   outright (both are dead), then remove the `use InteractsWithServices;` line
   from `AsController.php` and drop `use Stackra\Crud\Attributes\UseService;`
   imports; OR (b) actually author the missing
   `Stackra\Crud\Contracts\ServiceInterface` +
   `Stackra\Crud\Attributes\UseService` classes. Option (a) matches ADR-0016 and
   steering.
3. **Batch 3 — SentryService Octane-safety fix (P0).** Rewrite
   `packages/backend/telemetry/sentry/src/Services/SentryService.php`:
   - Delete the `private static ?self $instance = null` + `self::getInstance()`
     static-locator pattern.
   - Convert every `public static function ...` into an instance method.
   - Type-hint `Guard $guard`, `Request $request`, `Container $container` (or
     `#[Auth]`/`#[CurrentUser]`/injected accessors) via the constructor.
   - Confirm `#[Scoped]` remains on the class.
   - Update call sites (`SentryService::captureException($e)` →
     `$container->make(SentryService::class)->captureException($e)`; better
     still, migrate call sites to inject the service via constructor).
4. **Batch 4 — Wire tenancy hooks (P1).** Ship the phase-10 listener the
   `TenancyHookDispatcher.php` docblock references. Listen for
   `Stancl\Tenancy\Events\TenancyInitialized` / `TenancyEnded` (or whatever
   event surface the current `apps/academorix` tenancy middleware fires) and
   call `fireInit($event->tenancy->tenant)` / `fireEnd(...)`. Verify with a
   smoke test that the log context receives `tenant_id` on request-scoped log
   lines.
5. **Batch 5 — Headless mandate cleanup (P0/P1 combined).**
   - Delete `packages/backend/foundation/views/layouts/app.blade.php` +
     partials.
   - Delete `packages/backend/framework/exceptions/views/errors/*.blade.php` —
     the exceptions package's JSON error formatter already exists
     (`JsonErrorFormatter`). Confirm the Handler picks JSON over HTML for every
     `Accept:` including `*/*` and `text/html` — if any header falls back to
     HTML today, switch to JSON.
   - Delete
     `packages/backend/foundation/src/Middlewares/Security/VerifyCsrfToken.php` +
     `EncryptCookies.php`.
   - Flatten
     `packages/backend/foundation/src/Middlewares/{Request,Response,Security}/*.php`
     into `packages/backend/foundation/src/Middleware/*.php` and update
     `namespace Stackra\Foundation\Middlewares\{Request,Response,Security}` →
     `namespace Stackra\Foundation\Middleware` (single, flat, singular).
6. **Batch 6 — `env()` migrations (P1).** Move
   `env('HORIZON_MAIL_NOTIFICATIONS')` etc. into
   `packages/backend/telemetry/horizon/config/horizon.php` (or the existing
   `config/` if one exists — `LoadsResources` will merge). Same for
   `packages/backend/telemetry/health/src/Support/HealthNotificationConfig.php`
   — the env reads belong in a `config/health.php`. Consumers switch to
   `config('horizon.notifications.mail')` / `#[Config('...')]` injection.
7. **Batch 7 — Legacy provider migration (P2).** Migrate the three remaining
   `AbstractModuleServiceProvider` extenders to the new `ServiceProvider` base
   per `package-architecture.md` §Legacy migration table. During the migration,
   collapse the identity `->singleton(A::class, A::class)` calls into
   `#[Singleton]` attributes on the target classes.
8. **Batch 8 — DebugbarService DI cleanup (P2).** Make `DebugbarService` a
   regular `#[Scoped]` instance service with real instance methods. If terse
   call-site sugar is required, ship a `Debugbar` facade in front. Same audit
   for any static-only service in `packages/backend/telemetry/`.
9. **Batch 9 — Sub-vendor cleanup (P2).** Rename
   `stackra-platform/application-sdk` back to `stackra/platform-application-sdk`
   (the sub-vendor rule needs 3+ packages) OR add two more packages to justify
   `stackra-platform/`.

---

## Cross-agent handoffs

- **`standards-steward`** (per-file compliance): batches 5 (folder taxonomy:
  `Middlewares/` → `Middleware/`) and 7 (attribute-first cleanup: identity
  `->singleton` → `#[Singleton]`) live in its lane. This report only flags them.
- **`security-compliance-reviewer`**: TenancyHookDispatcher-not-fired (batch 4)
  has a **security surface** — cache reads under Octane are cross-tenant without
  the prefix hook wired. That reviewer should verify what other tenant-isolation
  guarantees depend on hook state landing before signing off.
- **`test-mutation-engineer`**: batch 3 (SentryService Octane fix) needs a
  regression test that simulates two consecutive Octane requests under different
  tenants + different users, asserting that request-2's
  `Sentry::captureException()` doesn't see request-1's user context. That test
  doesn't exist yet.
- **`docs-adr-steward`**:
  - The workspace has ADRs `0024-0026` but the code references ADR-0016
    (Actions-only), ADR-0006 (No manual bindings), ADR-0011 (Seeder discovery),
    ADR-0017 (Workspace terminology), ADR-0018 (Business types dual-source),
    ADR-0019 (Settings), ADR-0020 (Bootstrapper vs TenancyHook), ADR-0021
    (Headless), and ADR-0025 (Octane runtime target). Per `docs/adr/README.md`,
    "Rows 0001–0023 originate at `stackra-backend/docs/adr/`". If this workspace
    inherits those ADRs by reference, the reference should be linked from
    `docs/adr/README.md` (which currently only claims "See
    `stackra-backend/docs/adr/README.md`" as a bare pointer). Explicitly copying
    the referenced ADRs into `docs/adr/` closes the "where do the accepted rules
    actually live for this repo" question.
  - ADR needed for the `stackra-platform/application-sdk` sub-vendor decision if
    it stays (`package-naming.md` explicitly requires an ADR for a new
    sub-vendor).
  - ADR needed for the tenancy-hook wiring event choice (Stancl event listener
    vs middleware-driven fire).

---

## Naming & consistency

- **Composer package names:** all under `packages/backend/` correctly use
  `stackra/<kebab-name>` OR one of the two grandfathered sub-vendors
  (`stackra-observability/*`, `stackra-shared/*`) per `package-naming.md`. One
  outlier: `stackra-platform/application-sdk` — new sub-vendor with a single
  package, violates Rule 3 threshold.
- **PHP namespaces:** correctly derive from vendor for every
  `packages/backend/**` package. Broken for `apps/academorix/src/sdks/**` (see
  additional finding).
- **App-side domain modules:** `apps/academorix/src/modules/**` correctly
  declares `namespace Academorix\<Domain>\...` — 4,857 files.
- **Framework packages:** correctly declares `namespace Stackra\<Package>\...` —
  7,993 files across `packages/backend/**`.
- **Action naming:** every action file follows `<Verb><Noun>.php`
  (Create/Update/Delete/Show/List) — spot-checked identity/auth, no drift.
- **Action route names via `#[AsAction(name: '...')]`:** dot-separated,
  lowercase, singular. Spot-checked
  `packages/backend/identity/auth/src/Actions/Tenant/CreateLoginAction.php` →
  `auth.login.create`. ✓
- **Console commands:** framework
  `packages/backend/framework/console/src/Commands/` uses `Commands/`
  (canonical). Every domain package uses flat `src/Console/*Command.php` — 0
  hits for `src/Console/Commands/` in domain packages. ✓
- **Middleware:** foundation has both `Middleware/` (correct) and `Middlewares/`
  (incorrect, plural) — see concern 2. Every other package uses the correct
  singular `Middleware/`.

**Verdict:** Naming is 99% consistent. The two open items are (a) the SDK
namespace-declaration break (huge in file count, mechanical to fix), and (b)
`stackra-platform/application-sdk` sub-vendor (single-file rename or two more
packages to justify the sub-vendor).

---

## What's solid

Preserve these — they're the load-bearing signals of the audit.

1. **Actions-only mandate is genuinely respected.** 2,072 files carry
   `#[AsAction]`. Zero domain modules extend Controller-family bases. Zero CRUD
   wrapper services under `Services/`. The pattern is deeply internalised.
2. **Attribute-first DI is genuinely respected.** 605 `#[Scoped]` + 110
   `#[Singleton]`. Only 43 imperative `->bind()`/`->singleton()` calls remain,
   most of them legitimate closures.
3. **Provider migration is 97.6% done.** 120 on the new base, 3 legacy. Momentum
   is strong; the last 3 are addressable in a single sitting.
4. **Discovery seam is universal.** 143 files use `DiscoversAttributes`. Zero
   domain-side homegrown reflection walks. Zero `olvlvl` leaks past the
   framework layer.
5. **Trait-lifecycle aliasing pattern is correctly applied** at the one site
   that needs it (BaseCommand's `initialize()`).
6. **TenancyHook shape is correct** (symmetric init/end with snapshot/restore,
   Octane-safe by construction), even though the invocation site isn't wired
   yet.
7. **`Contracts/Data/*Interface` + `ATTR_*` column-constant pattern is used
   consistently.** Spot-checked identity, tenancy, feature-flags, geofencing —
   every model + migration + repository reads columns via the interface.
8. **`#[AsAction]` + typed Spatie `Data` DTO + `AsController` trait pattern is
   uniform.** No `FormRequest` extenders, no `JsonResource` extenders (both
   banned).
9. **Package boundaries are respected.** No package requires an app. No circular
   deps observed.
10. **Console commands live at the correct flat `src/Console/` in every
    domain.** Zero `src/Console/Commands/` in domain modules.

---

## Open questions for humans

Decisions the audit can't resolve alone. These need product/architecture
sign-off.

1. **Are `packages/backend/framework/exceptions/views/errors/*.blade.php`
   shipped intentionally as a _dev-mode_ affordance for `php artisan serve`
   local development, or are they leaking into every production error path?** If
   dev-only, the exception handler should switch to JSON in every non-local
   environment. If it's already doing that, the Blade views are legitimately
   dev-only and the finding is a P2 (misleading in a code-review pass but not a
   live headless leak).
2. **Should `CrudController` + `InteractsWithServices` be deleted or
   completed?** The scaffolding is 60% built (attributes exist, base class
   exists, hook methods exist) but `Stackra\Crud\Contracts\ServiceInterface` +
   `Stackra\Crud\Attributes\UseService` were never authored. Given ADR-0016
   explicitly bans the CRUD-service pattern this scaffolding assumes, delete is
   the correct answer — but the reference is intentional-looking (docblocks,
   comments, examples). Confirm before deleting.
3. **Which event surface does the tenancy-hook listener bind to?** The
   dispatcher's docblock references
   `Stancl\Tenancy\Events\{TenancyInitialized,TenancyEnded}`. That's a specific
   coupling to `stancl/tenancy`. Alternative: fire from the `ResolveTenant`
   middleware directly (which is the pattern documented in `tenancy-hooks.md`).
   Both work — the choice depends on what tests are already fixture'd against.
4. **Is `SentryService`'s all-static API load-bearing at any call site?** If
   dozens of files write `SentryService::captureException($e)` today, converting
   to instance-based will touch many files. The static-locator itself is unsound
   (P0) but the migration blast radius may span multiple commits.
5. **Does the workspace's ADR set live at `docs/adr/README.md`'s claim of "See
   `stackra-backend/docs/adr/README.md`"?** That reference points at a directory
   that doesn't exist in this workspace. Either (a) the ADRs are shipped
   somewhere else and the pointer is stale, (b) they should be copied into
   `docs/adr/` here, or (c) the workspace inherits them via a sibling monorepo
   layout the pointer implies. Without ADR-0016 physically in this repo, the
   enforcement is "trust the steering files" — which works but has less
   audit-trail weight.
6. **Is `stackra-platform/application-sdk` deliberate (planning ≥3
   platform-scope packages) or a one-off that should collapse to
   `stackra/platform-application-sdk`?** Two related packages already exist in
   `packages/backend/sdk/platform-sdk` and
   `packages/backend/sdk/platform-application-sdk` — those are `stackra/*`. The
   SDK inside `apps/academorix` is app-scoped. The `stackra-platform` sub-vendor
   name looks like early-stage design intent.
7. **The workspace root is `academorix-frontend` but it hosts the entire
   backend + frontend + CLI monorepo.** That's an unusual layout — an ADR should
   either rename the workspace (`stackra-monorepo`?) or document why the
   frontend name is authoritative for the whole workspace. This isn't code-level
   architecture; it's repository-naming architecture.
