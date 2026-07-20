---
inclusion: auto
---

# Folder conventions — one folder, one primitive

The single source of truth for which folder owns which primitive across every
module + package in the monorepo. Codified after several modules mixed
conventions (registries in `Support/` vs `Registry/`, hooks in `Bootstrappers/`
vs `TenancyHooks/`, persistence services in `Services/` vs Actions in
`Actions/`).

Deviations become bugs. If you're about to put a class in a folder not listed
below, or use a folder for something other than its declared purpose, the fix is
to rename the folder — never to overload it.

## Purpose

- **One folder = one primitive.** Grep-navigable, no ambiguity, no debate at
  review time.
- **Registries live in `Registry/`.** Support types live in `Support/`.
  Bootstrappers live in `Bootstrappers/`. Per-tenant hooks live in
  `TenancyHooks/`. Never conflate.
- **Cross-linked steering.** Every folder with its own contract has a dedicated
  primitive steering file. This file is the navigation index; the primitive
  files are the depth.

## Locked folder table

The table below is the canonical layout every module and package converges to.
"First-class primitive ✅" columns get their own primitive steering file;
"Grab-bag" columns hold heterogeneous support types.

| Folder                    | Primitive                       | First-class           | Owns                                                                                                                                     |
| ------------------------- | ------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `Actions/`                | Action                          | ✅                    | Single-endpoint invokable classes (per ADR 0016). No Services layer, no Controllers layer.                                               |
| `Actions/<Context>/`      | Bounded-context Actions         | ✅                    | CRUD + lifecycle endpoints for one aggregate. One-level nesting only.                                                                    |
| `Actions/Support/`        | Private per-action collaborator | Grab-bag              | Multi-write orchestrators, computed views, notification emitters. Never a route.                                                         |
| `Attributes/`             | PHP attribute class             | ✅                    | `#[AsX]` markers this package owns. Consumed by discovery bootstrappers.                                                                 |
| `Bootstrappers/`          | App-boot bootstrapper           | ✅                    | Subclasses of `AbstractBootstrapper` — hydrate registries at framework boot. Includes discovery bootstrappers.                           |
| `Concerns/`               | Trait                           | ✅                    | Reusable traits (`HasMetadata`, `BelongsToTenant`, `InteractsWithCache`).                                                                |
| `Console/`                | Artisan command                 | ✅                    | `AsCommand`-attributed console entrypoints.                                                                                              |
| `Contracts/`              | Interface (grouped)             | Grab-bag              | Sub-organised by role — see below.                                                                                                       |
| `Contracts/Data/`         | Model table shape               | ✅                    | `<Model>Interface` — `TABLE`, `PRIMARY_KEY`, `ATTR_*` constants.                                                                         |
| `Contracts/Repositories/` | Repository contract             | ✅                    | `<Model>RepositoryInterface extends RepositoryInterface<Model>`.                                                                         |
| `Controllers/`            | HTTP controller                 | **Legacy — retiring** | Only during Phase 2 migration; new code uses `Actions/` per ADR 0016.                                                                    |
| `Data/`                   | Spatie DTO                      | ✅                    | `spatie/laravel-data` request + response DTOs.                                                                                           |
| `Data/Requests/`          | Input DTO                       | ✅                    | Validated request payloads.                                                                                                              |
| `Data/Resources/`         | Output DTO                      | ✅                    | Serialized response payloads.                                                                                                            |
| `Database/Factories/`     | Model factory                   | ✅                    | `<Model>Factory extends Factory<Model>`.                                                                                                 |
| `Database/Migrations/`    | Migration                       | ✅                    | Anonymous-class migrations with `@file` header.                                                                                          |
| `Database/Seeders/`       | Seeder                          | ✅                    | `AsSeeder`-attributed seeders.                                                                                                           |
| `Dispatchers/`            | Runtime dispatcher              | ✅                    | Classes that iterate a `Registry/` and fire the referenced primitive (e.g. `TenancyHookDispatcher`).                                     |
| `Enums/`                  | Backed enum                     | ✅                    | Composes `Academorix\Enum\Enum` trait.                                                                                                   |
| `Events/`                 | Domain event                    | ✅                    | `AsEvent`-attributed readonly classes.                                                                                                   |
| `Exceptions/`             | Package exception               | ✅                    | Every exception extends `AcademorixException`.                                                                                           |
| `Http/Middleware/`        | HTTP middleware                 | **Anti-pattern**      | Use flat `Middleware/` — no `Http/` nesting per package-architecture §2.                                                                 |
| `Jobs/`                   | Queued job                      | ✅                    | Tenant-aware.                                                                                                                            |
| `Listeners/`              | Event listener                  | ✅                    | `OnEvent` / `ListensFor` attributed.                                                                                                     |
| `Mail/`                   | Mailable                        | ✅                    | Emits structured payload; no Blade views per ADR 0021.                                                                                   |
| `Middleware/`             | HTTP middleware                 | ✅                    | `AsMiddleware`-attributed. Flat namespace — no `Http/` prefix.                                                                           |
| `Models/`                 | Eloquent model                  | ✅                    | Attribute-first — `#[Table]`, `#[Fillable]`, `#[UseFactory]`, `#[UsePolicy]`, `#[ObservedBy]`.                                           |
| `Notifications/`          | Notification                    | ✅                    | Emits structured payload; frontend renders.                                                                                              |
| `Observers/`              | Model observer                  | ✅                    | Wired via `#[ObservedBy]`.                                                                                                               |
| `Policies/`               | Authorization policy            | ✅                    | Wired via `#[UsePolicy]`.                                                                                                                |
| `Providers/`              | Service provider                | ✅                    | One per package — extends `Academorix\ServiceProvider\Providers\ServiceProvider` (or composes `AsModuleProvider`).                       |
| `Registry/`               | Attribute-driven registry       | ✅                    | Subclasses of `AbstractRegistry`. Every registry lives here — none in `Support/`, none in `Services/`.                                   |
| `Repositories/`           | Eloquent repository             | ✅                    | `Eloquent<Model>Repository implements <Model>RepositoryInterface`.                                                                       |
| `Runner/`                 | Executor                        | ✅                    | Classes that execute one registered primitive against its target (e.g. `RetentionRunner`).                                               |
| `Services/`               | Cross-action orchestrator       | Grab-bag (narrow)     | Registries + resolvers + contexts + long-running workers only. **Never CRUD wrappers** per ADR 0016.                                     |
| `Support/`                | Grab-bag helpers                | Grab-bag              | Readonly VOs (`Descriptor`, `Context`), pure computations, deep-nested builders. **Never registries, never bootstrappers, never hooks.** |
| `TenancyHooks/`           | Per-tenant lifecycle hook       | ✅                    | Classes implementing `TenancyHookInterface`. Fires on every tenant init / end.                                                           |
| `Tools/`                  | AI tool                         | ✅ (AI package only)  | `SensitiveTool` / `WritableTool` subclasses discovered by `#[AsAiTool]`.                                                                 |

## Per-folder contract

Each folder has a one-paragraph contract below. Deeper contracts live in the
primitive-specific steering files — this section cross-links them.

### `Actions/`

Single-endpoint invokable classes. One class per route. No Services layer above,
no Controllers layer beneath — the Action IS the endpoint; the repository IS the
persistence boundary. Bounded contexts nest one level deep (e.g.
`Actions/Tenants/CreateTenant.php`). Private per-action collaborators
(multi-write orchestrators, computed views) live in `Actions/Support/`.

See `.kiro/steering/actions-only-full.md` for the full contract + anti-patterns.

### `Attributes/`

Every `#[AsX]` marker attribute this package owns. Discovered at boot by
matching bootstrappers via the shared `DiscoversAttributes` seam.
`TARGET_CLASS`, `TARGET_METHOD`, `TARGET_PROPERTY` — one target class per
attribute.

See `.kiro/steering/php-attributes.md` for the attribute catalogue.

### `Bootstrappers/`

App-boot bootstrappers — subclasses of
`Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper`. Fire ONCE per
framework boot, hydrate a `Registry/` class, cache the payload under
`bootstrapper.*` for the next boot to skip discovery. Includes
attribute-discovery bootstrappers (the former `<Domain>DiscoveryBootstrapper`
names — renamed to their shorter form in Phase 2.C).

See `.kiro/steering/bootstrappers.md` for the full lifecycle contract and
`.kiro/steering/discovery.md` for the discovery pattern every bootstrapper
follows.

### `Concerns/`

Reusable traits. Composes cleanly across multiple classes — `HasMetadata`,
`BelongsToTenant`, `InteractsWithCache`, etc. Do not put single-consumer helpers
here; those live in `Support/`.

### `Console/`

Artisan commands, flat under `src/Console/*Command.php` — one file per command,
no nested `Commands/` subfolder. Namespace mirrors the path:
`Academorix\<Package>\Console\<Name>Command`. Every command carries
`#[AsCommand]` and, when scheduled, `#[Cron]` + `#[WithoutOverlapping]` +
`#[OnOneServer]` + `#[ScheduleName]` per the scheduling package.

`Console/` IS the primitive folder — nesting a `Commands/` layer inside it
repeats the concept (every file in `Console/` IS a command class, and the
filename already carries the `Command` suffix). Same reasoning as `Actions/` not
nesting `Action/` or `Models/` not nesting `Model/`. See
`.kiro/steering/console-commands.md` §"Where commands live" for the full rule
and the framework-`console`-package exception (which uses flat `src/Commands/`
because the whole package IS the console concern).

### `Contracts/`

Interfaces this package publishes to the outside world. Sub-organised:

- `Contracts/Data/<Model>Interface` — table shape constants (`TABLE`,
  `PRIMARY_KEY`, `KEY_TYPE`, `ATTR_*`). See `.kiro/steering/models.md`.
- `Contracts/Repositories/<Model>RepositoryInterface` —
  `extends RepositoryInterface<Model>` + domain finders.
- `Contracts/` (top-level) — cross-cutting contracts. Rare — most contracts fit
  under one of the two subdirectories above.

### `Data/`

`spatie/laravel-data` DTOs — the transport primitive. Input DTOs under
`Data/Requests/`, output DTOs under `Data/Resources/`, shared shapes at the top
level.

### `Dispatchers/`

Classes that iterate a `Registry/` and dispatch the referenced primitive at the
appropriate moment. `TenancyHookDispatcher` walks `TenancyHookRegistry` on
`fireInit()` / `fireEnd()`. Rarely more than one dispatcher per module.

### `Enums/`

Backed enums composing `Academorix\Enum\Enum`. Use `#[Meta]` + `#[Label]` +
`#[Description]` when consumers need human-readable labels.

### `Events/` / `Listeners/`

Domain events (`#[AsEvent]`) + their listeners (`#[OnEvent]` / `#[ListensFor]`).
Every listener that touches I/O implements `ShouldQueue`.

### `Middleware/`

HTTP middleware, flat namespace — NO `Http/` prefix. Every middleware carries
`#[AsMiddleware]` and is discovered at boot by the Routing package.

### `Models/`

Eloquent models — attribute-first. `#[Table]`, `#[Fillable]`, `#[UseFactory]`,
`#[UsePolicy]`, `#[ObservedBy]`. Composes `HasMetadata`, `BelongsToTenant`,
`Auditable`, `SoftDeletes`, `Userstamps` as needed.

### `Providers/`

One provider per package — extends
`Academorix\ServiceProvider\Providers\ServiceProvider` OR composes
`AsModuleProvider` when a vendor base must be extended. See
`package-architecture.md` §3 for the composition rules.

### `Registry/`

Every attribute-driven registry in the monorepo. Subclasses of
`Academorix\ServiceProvider\Registry\AbstractRegistry` — pure PHP arrays for
storage, memoized sort for Octane-safe hot-path reads, `#[Singleton]` binding.

See `.kiro/steering/discovery.md` and this file's parent section "Locked folder
table" for the primitive contract.

### `Repositories/`

`Eloquent<Model>Repository` classes — the ONLY layer that builds Eloquent
queries or persists rows. Bound via `#[Bind]` on the matching interface in
`Contracts/Repositories/`.

### `Runner/`

Executors — classes that apply ONE entry from a registry against its target.
`RetentionRunner` runs one `RetentionPolicyDescriptor`; similar executors land
here for other domains. Bracket every run in a timing bracket + try/catch and
return a report (never throw).

### `Services/`

Genuine cross-action orchestrators only:

- Registries (superseded by `Registry/` in Phase 2.D — new registries land
  there, not here).
- Resolvers (`TenantResolver`, `TenantContext`).
- Contexts / stateful helpers (`BootstrapContext`, `TenantGuardHandle`).
- Long-running background workers (`AttendanceSync`, `ReportPipeline`).

**Never a CRUD wrapper.** ADR 0016 kills the Service pattern for CRUD. The
Action is the endpoint; the repository is the persistence boundary.

### `Support/`

Grab-bag for readonly VOs, pure computations, deep-nested builders. Explicitly:

- Readonly value objects (`Descriptor`, `Context`, `Cursor`).
- Pure computations (`ComputeFoo`, `NormaliseBar`).
- Container attribute helpers.

**Never** registries, bootstrappers, hooks, actions, or repositories. Those
primitives all have their own folders.

### `TenancyHooks/`

Per-tenant lifecycle hooks — classes implementing
`Academorix\ServiceProvider\Contracts\TenancyHookInterface`. Fire on every
tenant init / end, symmetric revert on end, `#[AsTenancyHook]` for
auto-discovery.

See `.kiro/steering/tenancy-hooks.md` for the full contract.

### `Tools/` (AI package only)

`SensitiveTool` / `WritableTool` subclasses discovered by `#[AsAiTool]`.
Populates `ToolRegistry` at boot. Tools carry `TenantContext` in their
constructor — resolved through the scoped container inside the vendor agent
pipeline.

## Anti-patterns (each with a real-history example)

Every entry here was a real bug before Phase 2.D shipped this convention:

- ❌ **Registry classes in `Support/`.** Historical:
  `Support/BootstrapperRegistry.php`, `Support/TenancyHookRegistry.php`,
  `Support/RetentionPolicyRegistry.php`. **Fix**: move to `Registry/`.
  Registries are first-class primitives; `Support/` is for VOs and helpers.
- ❌ **Registry classes in `Services/`.** Historical:
  `Services/DraftActionRegistry.php`, `Services/PersonaResolver.php` (mis-named
  — was always a registry). **Fix**: move to `Registry/` and rename Resolver →
  Registry where the class was actually a registry.
- ❌ **VOs in `Registry/`.** `Descriptor`, `Cursor`, `Context` types are Support
  types. **Fix**: move to `Support/`.
- ❌ **Bootstrappers in `Concerns/`.** A bootstrapper is a concrete class, not a
  trait. **Fix**: move to `Bootstrappers/` and extend `AbstractBootstrapper`.
- ❌ **CRUD-wrapper Services** — `TenantService::create()`,
  `PermissionService::paginate()`, etc. ADR 0016 kills these. **Fix**: delete
  the Service. The Action IS the endpoint; the repository IS the persistence
  boundary.
- ❌ **Middleware in `Http/Middleware/`.** Historical vestige from
  `nwidart/laravel-modules`. **Fix**: rename to flat `Middleware/` per
  `package-architecture.md` §2.
- ❌ **Commands in `Console/Commands/`.** Same-shape vestige. `Console/` is the
  primitive folder; a nested `Commands/` repeats the concept. **Fix**: flatten
  to `src/Console/*Command.php`. 864 files already follow the flat shape; 12
  stragglers (SMS / Push / Products / geofencing) need the housekeep move. See
  `.kiro/steering/console-commands.md` §"Where commands live".
- ❌ **Doubled-namespace `Academorix\Console\Console\Commands\BaseCommand`.**
  Legacy autoload accident — the base class lives at
  `Academorix\Console\Commands\BaseCommand` (flat, single `Console`). Every
  consumer import that uses the doubled form is stale. **Fix**: mechanical
  find/replace across the workspace.
- ❌ **Contracts in top-level `Contracts/` when they should be under
  `Contracts/Data/` or `Contracts/Repositories/`.** Table-shape interfaces
  belong under `Contracts/Data/`; repository interfaces under
  `Contracts/Repositories/`.
- ❌ **`Actions/` with two-level nesting** (e.g.
  `Actions/Tenants/Draft/CreateDraftTenant.php`). Flat routes, flat folders.
  **Fix**: extract shared logic to `Actions/Support/` or sibling bounded
  context.
- ❌ **TenancyHook implementations in `Concerns/` or `Bootstrappers/`.** Hooks
  are their own primitive. **Fix**: move to `TenancyHooks/` and add
  `#[AsTenancyHook]`.
- ❌ **Executor / Runner classes in `Services/`.** A "runner" that iterates one
  descriptor and returns a report belongs in `Runner/`. **Fix**: rename the
  folder.

## Enforcement

TODO(package-compliance): add a rule to `packages/compliance/architecture/` (or
the equivalent audit package) that scans every `packages/`,
`apps/*/src/modules/` directory for the anti-patterns above and fails CI on
violations. The rule set:

1. Any class in `Support/` whose name ends in `Registry`.
2. Any class in `Services/` whose name ends in `Registry`.
3. Any class in `Services/` that ships a `register()` method + an `#[Singleton]`
   attribute (the registry shape).
4. Any class in `Registry/` marked `final readonly` (that's a VO shape — belongs
   in `Support/`).
5. Any class in `Concerns/` that extends `AbstractBootstrapper` (belongs in
   `Bootstrappers/`).
6. Any nested `Http/Middleware/` directory (flat `Middleware/` only).
7. Any nested `Actions/<Context>/<SubContext>/` directory (one-level nesting
   only).

Until the compliance rule ships, the review checklist is: grep
`find <module>/src -type d` and confirm every folder matches the "Locked folder
table" above.

## Related steering

- `.kiro/steering/package-architecture.md` — canonical package layout + provider
  composition rules.
- `.kiro/steering/bootstrappers.md` — the app-boot bootstrapper contract.
- `.kiro/steering/discovery.md` — the `DiscoversAttributes` seam every
  bootstrapper uses.
- `.kiro/steering/tenancy-hooks.md` — the per-tenant lifecycle hook contract
  (sibling of bootstrappers).
- `.kiro/steering/actions-only-full.md` — the Actions-only architecture (ADR
  0016 expanded).
- `.kiro/steering/models.md` — model + repository + Contracts/Data organisation.
- `.kiro/steering/php-attributes.md` — the attribute catalogue every
  `Attributes/` folder contributes to.
- `.kiro/steering/docblocks.md` — docblock rules on every class, method,
  property, constant in every folder above.
