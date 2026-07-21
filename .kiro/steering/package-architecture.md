---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# Package architecture

The canonical architecture, layering, and layout for every package under
`packages/`. Ported from the old `nwidart/laravel-modules` standard and adapted
to our Composer-path-repository monorepo.

## Precedence

1. This file wins over any generic "Laravel best practices" skill wherever they
   differ. Deliberate overrides:
   - **Validation + transport use `spatie/laravel-data`, not `FormRequest` or
     API `Resource`.** See `data-first.md` for the detailed patterns.
   - **Docblocks + inline comments are mandatory** on every file, class, method,
     and non-obvious block. See `conventions.md`.
2. `AGENTS.md` (Laravel Boost) rules still apply: `pint` after PHP edits,
   `search-docs` before code changes, no dependency changes without approval.
3. **Consistency first.** When extending an existing package, match its
   established patterns. This standard is the target every package migrates
   toward; new code follows it exactly.

## Monorepo layout (recap)

```
stackra-backend/
├── apps/                  # deployable services — bootstrap the framework
│   ├── template/          # headless REST API template
│   ├── api/               # main tenant API (Phase 2)
│   └── ai-service/        # standalone AI microservice
├── packages/              # shared libraries — domain logic
│   ├── foundation/        # kernel every package depends on
│   ├── exceptions/        # exception hierarchy + renderers + reporters
│   └── <domain>/          # billing, user, tenancy, ai, ...
├── docker/, docs/, scripts/, config/
└── composer.json, turbo.json, package.json
```

Apps consume packages via Composer path repositories declared once per app.
Packages carry their own `composer.json`, service provider, and (optionally)
`views/`, `lang/`, `resources/`. Providers auto-register via
`extra.laravel.providers`.

## 1. Layered architecture (the golden rule)

Requests flow **inward**; dependencies point **inward**. Each layer may only
talk to the layer directly below it.

```
HTTP request
   │
   ▼
Controller ──────────► Data (input)      validation + typed transport
   │                        ▲
   ▼                        │
Service / Action ───────────┘            business rules, orchestration
   │
   ▼
Repository (Contract) ───────────────────the ONLY layer that builds
   │                                     Eloquent queries or persists
   ▼
Model (Eloquent)                         schema, casts, relations, scopes
   │
   ▼
Data (output) ◄──────────────────────────serialised back to the client
```

Hard rules — no exceptions:

- **Controllers never touch Eloquent.** No `Model::query()`, no
  `Model::create()`, no query building in controllers. Controllers receive an
  input `Data`, call one service/action, and return an output `Data` (or
  `JsonResponse` when an explicit status matters).
- **Services never build queries.** All reads / writes go through a repository
  contract. Services hold business logic + orchestration only.
- **Repositories are the only place Eloquent is used** for querying or
  persisting. They implement an interface from `Contracts/` and are bound in the
  package provider.
- **Models hold no business logic** beyond relationships, casts, accessors, and
  query scopes.
- **`Data` objects live at the edges** — input (validation) and output
  (serialisation). They replace both `FormRequest` and `Resource`.

## 2. Canonical package layout

Every package converges on the folder set below. This section is the shape
reference; `.kiro/steering/folder-conventions.md` is the deep contract for each
folder — read that alongside for the per-folder rules and anti-patterns.

```
packages/<name>/
├── composer.json                 # stackra/<name>; PSR-4 Stackra\<Name>\ -> src/
├── package.json                  # Turborepo shim; lint/analyse/test scripts
├── phpstan.neon                  # includes ../../config/phpstan-base.neon
├── phpunit.xml
├── README.md, RECOMMENDATIONS.md
├── config/
├── lang/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
├── src/
│   └── (see the "Locked folder table" below)
└── tests/
    ├── Feature/                  # controller-to-service happy paths (one file per use case)
    └── Unit/                     # services, actions, repositories, data (no framework boot)
```

### Locked folder table (canonical `src/` layout)

The table names every first-class primitive folder + its grab-bag siblings. Full
per-folder contract lives in `.kiro/steering/folder-conventions.md`.

| Folder                    | Primitive                       | First-class       | Owns                                                                                           |
| ------------------------- | ------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `Actions/`                | Action                          | ✅                | Single-endpoint invokable classes (ADR 0016).                                                  |
| `Actions/Support/`        | Private per-action collaborator | Grab-bag          | Multi-write orchestrators, computed views.                                                     |
| `Attributes/`             | PHP attribute class             | ✅                | `#[AsX]` markers this package owns.                                                            |
| `Bootstrappers/`          | App-boot bootstrapper           | ✅                | `AbstractBootstrapper` subclasses — hydrate registries at boot.                                |
| `Concerns/`               | Trait                           | ✅                | Reusable traits.                                                                               |
| `Console/`                | Artisan command                 | ✅                | `#[AsCommand]`-attributed entries.                                                             |
| `Contracts/Data/`         | Model table shape               | ✅                | `<Model>Interface` — `TABLE`, `PRIMARY_KEY`, `ATTR_*`.                                         |
| `Contracts/Repositories/` | Repository contract             | ✅                | `<Model>RepositoryInterface extends RepositoryInterface<Model>`.                               |
| `Data/`                   | Spatie DTO                      | ✅                | Input + output DTOs.                                                                           |
| `Dispatchers/`            | Runtime dispatcher              | ✅                | Iterate a `Registry/`, fire the referenced primitive.                                          |
| `Enums/`                  | Backed enum                     | ✅                | Composes `Stackra\Enum\Enum`.                                                               |
| `Events/` / `Listeners/`  | Domain event + listener         | ✅                | `#[AsEvent]` / `#[OnEvent]` attributed.                                                        |
| `Exceptions/`             | Package exception               | ✅                | Extends `Exception`.                                                                 |
| `Jobs/`                   | Queued job                      | ✅                | Tenant-aware.                                                                                  |
| `Middleware/`             | HTTP middleware                 | ✅                | Flat namespace — no `Http/` nesting. `#[AsMiddleware]`-attributed.                             |
| `Models/`                 | Eloquent model                  | ✅                | Attribute-first — `#[Table]`, `#[Fillable]`, `#[UseFactory]`, `#[UsePolicy]`, `#[ObservedBy]`. |
| `Observers/`              | Model observer                  | ✅                | Wired via `#[ObservedBy]`.                                                                     |
| `Policies/`               | Authorization policy            | ✅                | Wired via `#[UsePolicy]`.                                                                      |
| `Providers/`              | Service provider                | ✅                | One per package.                                                                               |
| `Registry/`               | Attribute-driven registry       | ✅                | `AbstractRegistry` subclasses. Every registry lives here — NEVER in `Support/` or `Services/`. |
| `Repositories/`           | Eloquent repository             | ✅                | The ONLY layer that builds Eloquent queries.                                                   |
| `Runner/`                 | Executor                        | ✅                | Applies one entry from a registry against its target.                                          |
| `Services/`               | Cross-action orchestrator       | Grab-bag (narrow) | Resolvers, contexts, long-running workers only. **Never CRUD wrappers** per ADR 0016.          |
| `Support/`                | Grab-bag helpers                | Grab-bag          | Readonly VOs, pure computations, builders. **Never registries, bootstrappers, or hooks.**      |
| `TenancyHooks/`           | Per-tenant lifecycle hook       | ✅                | `TenancyHookInterface` implementers.                                                           |
| `Tools/`                  | AI tool                         | ✅ (AI-only)      | `SensitiveTool` / `WritableTool` subclasses.                                                   |

**Rules**

- Create only the folders a package actually needs. Do NOT scaffold empty
  layers. Empty directories aren't shipped.
- **No `routes/` folder.** Controllers own their own routes via
  `#[AsController]` + `#[Get]` / `#[Post]` / ... attributes from
  `Stackra\Routing\Attributes`. See `php-attributes.md` for the full
  catalogue. The Routing package's `RouteRegistrar` discovers controllers via
  the unified `Stackra\Foundation\Contracts\DiscoversAttributes` contract at
  boot; no route file is required or accepted.
- **Flat namespaces.** `Stackra\<Name>\Middleware`,
  `Stackra\<Name>\Registry`, etc. No `Http\` nesting. Factories and seeders
  keep `Stackra\<Name>\Database\Factories` / `Seeders` because the framework
  expects that path.
- **No `config/config.php` name inside a package** — it clashes with Laravel's
  own configs. Config files are named for the package: `config/exceptions.php`,
  `config/billing.php`.
- **`src/` is the source root** for every package, matching every app. Autoload
  maps `Stackra\<Name>\` → `src/`.
- **`Support/` is grab-bag; `Registry/` is a first-class primitive.** Never
  conflate. See `.kiro/steering/folder-conventions.md` for the anti-pattern
  catalogue.

## 3. Providers

Prefer a **single** `<Name>ServiceProvider` extending {@see
Stackra\ServiceProvider\Providers\ServiceProvider}. The base class from
`stackra/service-provider` composes an attribute-first lifecycle:

- Module identity is declared via
  `#[AsModule(name, priority?, dependencies?, deferred?)]` — or auto-derived
  from the class name when the attribute is absent.
- Which conventional resources load (migrations, config, translations, views,
  routes, commands, publishables) is declared via `#[LoadsResources(...)]`. The
  six most common resources default to on; opt in explicitly to views, seeders,
  middleware, observers, policies, health checks, listeners, macros, or
  scheduled tasks.
- Container bindings, middleware aliases, policies, macros, observers, routes,
  health checks, and scheduled tasks live behind hook interfaces (`HasBindings`,
  `HasMiddleware`, `HasPolicies`, `HasMacros`, `HasObservers`, `HasRoutes`,
  `HasHealthChecks`, `HasScheduledTasks`, `Terminatable`). Each interface
  exposes exactly one method — the base dispatches them at the right phase.
- One-off register / boot / terminate hooks are declared via
  `#[OnRegister(priority?)]`, `#[OnBoot(priority?)]`, and
  `#[OnTerminate(priority?)]` on methods — no override of `register()` /
  `boot()` required.

The base class self-drives Laravel's `register()` / `boot()` sequence — no host
"Application" runner needed. Only override `register()` or `boot()` when
framework-level wiring must precede attribute resolution (rare); call
`parent::register()` / `parent::boot()` so the lifecycle still fires.

**Third-party bases** — when a package must extend a vendor base (Horizon,
Debugbar, Sentry, ...) it cannot also extend {@see
Stackra\ServiceProvider\Providers\ServiceProvider}. Use the {@see
Stackra\ServiceProvider\Concerns\AsModuleProvider} trait instead and bridge
the two lifecycles by hand:

```php
final class HorizonServiceProvider extends BaseHorizonServiceProvider
{
    use AsModuleProvider;

    public function register(): void { parent::register(); $this->registerModule(); }
    public function boot(): void     { parent::boot();     $this->bootModule(); }
}
```

Route registration is NOT a provider concern — the Routing package discovers
`#[AsController]` classes globally and handles it. See `php-attributes.md` §
"Stackra Routing attributes".

Only introduce a second provider (`EventServiceProvider`,
`RouteServiceProvider`) when the single provider grows past ~250 lines OR when
there's a genuine separate lifecycle concern.

### Legacy: `AbstractModuleServiceProvider`

Providers created before `stackra/service-provider` shipped extend {@see
Stackra\Foundation\Providers\AbstractModuleServiceProvider} — the
pre-attribute base that mapped `$bindings`, `$singletons`, `$middlewareAliases`,
`$policies`, `$configs`, `$migrations`, `$commands` array properties into wiring
calls with `registerBespoke()` / `bootBespoke()` escape hatches.

Every existing extender is migrating to
`Stackra\ServiceProvider\Providers\ServiceProvider` package by package. New
providers MUST target the new base class. When touching a legacy provider for
other reasons, migrate it in the same commit — the shape is:

| Old (Foundation)                                         | New (service-provider)                                                                                                                                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protected array $bindings = [I => C]`                   | `implements HasBindings` + `bindings()` writing `$this->app->bind(I, C)`                                                                                                                                                           |
| `protected array $singletons = [I => C]`                 | `bindings()` writing `$this->app->singleton(I, C)`                                                                                                                                                                                 |
| `protected array $middlewareAliases = [alias => class]`  | `implements HasMiddleware` + `middleware(Router $r)` writing `$r->aliasMiddleware(...)`                                                                                                                                            |
| `protected array $policies = [Model => Policy]`          | `implements HasPolicies` + `policies()` writing `Gate::policy(...)`                                                                                                                                                                |
| `protected array $configs = [['file'=>..., 'key'=>'x']]` | Keep the `mergeConfigFrom()` call inside `#[OnRegister]` OR rename `config/x.php` → `config/config.php` and rely on the base's convention (merges as `x.config`). Prefer the former to avoid breaking `config('x.key')` callsites. |
| `protected array $migrations = [dir]`                    | Move migrations to `packages/<name>/database/migrations/` (or `packages/<name>/src/Migrations/` if using the convention) — auto-loaded when `#[LoadsResources(migrations: true)]`.                                                 |
| `protected function registerBespoke()`                   | `#[OnRegister]` on a method, or `bindings()` when it's just container wiring.                                                                                                                                                      |
| `protected function bootBespoke()`                       | `#[OnBoot]` on a method, or a hook interface where one fits.                                                                                                                                                                       |

Example package provider (new base):

```php
use Stackra\ServiceProvider\Attributes\{Module, LoadsResources, OnBoot, OnRegister};
use Stackra\ServiceProvider\Contracts\{HasBindings, HasPolicies};
use Stackra\ServiceProvider\Providers\ServiceProvider;

#[AsModule(name: 'Billing', priority: 30)]
#[LoadsResources(migrations: true, config: true, commands: true, publishables: true)]
final class BillingServiceProvider extends ServiceProvider implements HasBindings, HasPolicies
{
    /**
     * Container wiring — invoked during register().
     * The Container attributes on the concrete services (`#[Bind]`,
     * `#[Singleton]`) still do most of the work; write imperative
     * `$this->app->bind(...)` here ONLY for closures / config-driven
     * bindings that can't be expressed declaratively.
     */
    public function bindings(): void
    {
        $this->app->singleton(\Stackra\Billing\Contracts\Invoicer::class, \Stackra\Billing\Services\StripeInvoicer::class);
    }

    /**
     * Model → Policy pairs — invoked during boot() by the base.
     */
    public function policies(): void
    {
        Gate::policy(\Stackra\Billing\Models\Invoice::class, \Stackra\Billing\Policies\InvoicePolicy::class);
    }

    /**
     * One-off register-time hook. `#[OnRegister]` methods run
     * before the HasBindings dispatch, sorted by priority.
     */
    #[OnRegister(priority: 10)]
    protected function mergeExtraConfig(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/billing.php', 'billing');
    }

    /**
     * One-off boot-time hook. Use `#[OnBoot]` for anything that
     * doesn't fit a hook interface.
     */
    #[OnBoot(priority: 50)]
    protected function warmInvoiceCategories(): void
    {
        Cache::forever('billing.categories', $this->app->make(Categorizer::class)->all());
    }

    // No middlewareAliases — middleware is discovered via #[AsMiddleware].
    // No routes — controllers own their routes via #[AsController].
    // Commands / migrations / config / publishables are auto-loaded
    // by #[LoadsResources] against the conventional package layout.
}
```

## 4. Cross-package dependencies

- A package MAY depend on another package via `require` in its `composer.json`.
  `stackra/foundation` is the only universal dep — everything else opt-in.
- A package MUST NOT depend on an app. Dependencies point downward in the
  dependency graph: apps → packages, packages → other packages.
- Circular package dependencies are forbidden. If A needs B and B needs A,
  either (a) they should be one package, or (b) a Contract belongs in a shared
  parent (`foundation`, `contracts`).

## 5. Route ownership

**There is no `routes/` folder.** In any package, in any app. Controllers own
their own routes via attributes:

```php
#[AsController]
#[Prefix('api/v1/invoices')]
#[Middleware(['api', 'auth:sanctum'])]
final class InvoiceController extends BaseController
{
    #[Get('/', name: 'invoices.index')] public function index() { /* ... */ }
    #[Post('/', name: 'invoices.store')] public function store(...) { /* ... */ }
    #[Get('/{id}')] #[WhereUuid('id')] public function show(string $id) { /* ... */ }
}
```

The Stackra Routing package's `RouteRegistrar` discovers `#[AsController]`
classes at app boot via the unified
`Stackra\Foundation\Contracts\DiscoversAttributes` contract (backed by
`olvlvl/composer-attribute-collector`) and registers their routes with Laravel's
router. One scan per boot — no runtime cost.

Consequences for apps:

- No `apps/*/routes/api.php`. No `apps/*/routes/web.php`.
- No `RouteServiceProvider` in any package.
- `bootstrap/app.php` `withRouting()` no longer takes an `api:` / `web:`
  argument — only `commands:` and `health:`.
- Discovery endpoint (`GET /`) and health probe live as `#[AsController]`
  classes inside the relevant app's `src/`.

## 6. Migrations ownership across apps

`apps/api` and `apps/ai-service` share database tables. To avoid drift:

- Only ONE app owns each migration file. By convention, that's the app that owns
  the write path for those tables.
- Both apps consume the same package for the Eloquent models, so schema shape
  stays in sync at the code level.
- Cross-app HTTP contracts use a shared Bearer token stored only in each app's
  Doppler config.
- Cross-app async messages travel over the shared Redis queue.

## 7. Quality gates

Before finalising any package change:

1. `pnpm turbo run install --filter=@stackra/<name>` — vendor hydrated.
2. `pnpm turbo run lint --filter=@stackra/<name>` — Pint clean.
3. `pnpm turbo run analyse --filter=@stackra/<name>` — Larastan / PHPStan
   level max, no baseline drift.
4. `pnpm turbo run test --filter=@stackra/<name>` — Pest green.
5. Commit with a conventional-commits message; stage specific files only (never
   `git add -A`); never commit `.kiro/settings/mcp.json`.

## 8. New-package checklist

- [ ] `./scripts/new-package.sh <name>` — creates the skeleton.
- [ ] Fill in `composer.json` — description, `require` (add
      `stackra/foundation`), PSR-4 already scaffolded.
- [ ] Update `extra.laravel.providers` to point at
      `Stackra\<Name>\Providers\<Name>ServiceProvider`.
- [ ] Create layers **only** as needed: `Data/`, `Services/` (+ `Actions/`),
      `Repositories/` + `Contracts/`, `Models/`, `Enums/`, events / listeners /
      jobs / policies / observers / middleware as required.
- [ ] Migrations, factories, seeders under `database/`.
- [ ] Feature tests split per use case (one file per named behaviour); unit
      tests for services / actions / data.
- [ ] Docblocks + inline comments throughout (see `conventions.md`).
- [ ] Register with a consuming app:
      `cd apps/api && composer require stackra/<name>:'*'`.
- [ ] `pint` + `phpstan` + `test` green; conventional commit.

## 9. When to add an app vs. a package

Default is: **add a package**. Adding an app is expensive.

Add a **package** when you have code that could reasonably be consumed by more
than one app, or code that has its own database tables + domain rules and would
benefit from its own PSR-4 root.

Add an **app** when you need:

- A distinct HTTP surface with its own routes and middleware pipeline.
- A distinct runtime profile (CPU / memory / GPU different from the API).
- A distinct release cadence.
- Deployment isolation (e.g. LLM provider outage should not affect the tenant
  API).

## 10. When to split a package into contract + implementer

Some framework packages have TWO natural audiences: every consumer needs the
contract layer (attributes, contracts, middleware); only some consumers need the
reference implementation (Eloquent models, migrations, admin CRUD, vendor
wiring). When both audiences exist, ship TWO packages — the light `<concern>`
package + the heavy `<concern>-store` (or reference-implementation) package.

The canonical example is `authorization` + `access` (ADR-0008): every domain
declares `#[RequirePermission]`, but only apps with an admin surface need the
roles + permissions storage.

See `.kiro/steering/contract-implementer-split.md` for:

- The three-part decision test (when the split applies).
- The canonical shape both packages converge on.
- Candidate future splits (`feature-flags` + `feature-flags-store`, `settings` +
  `settings-store`, `audit` + `audit-log`, `caching` + `caching-registry`,
  `scheduling` + `scheduling-runtime`, `events` + `events-bus`).
- Naming rules for the heavy package.
- Anti-patterns.

The split is not the default. Only reach for it when the three decision tests
all say yes.
