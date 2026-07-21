# Migration notes — `stackra/service-provider`

Mechanical port of the `stackra/service-provider` package with a few known
adaptations captured below. Every TODO in the source tree maps to an entry in
this document. The goal is that when the missing integration points land, the
resolution is textual — search for the `TODO(...)` marker and follow the shape
sketched inline.

## Namespace rewrites (mechanical)

Applied to every ported file:

| From                                         | To                                                      |
| -------------------------------------------- | ------------------------------------------------------- |
| `Stackra\ServiceProvider\`                | `Stackra\ServiceProvider\`                           |
| `Stackra\Enum\`                           | `Stackra\Enum\`                                      |
| `Stackra\Support\Reflection`              | inline `\ReflectionClass(...)` (no monorepo equivalent) |
| `Stackra\Routing\Attributes\AsController` | removed — pending `stackra/routing`                  |
| `Stackra\Routing\Attributes\AsMiddleware` | removed — pending `stackra/routing`                  |
| `Stackra\Routing\RouteRegistrar`          | removed — pending `stackra/routing`                  |
| `Stackra\Blog\Providers\...` (examples)   | `Stackra\Blog\Providers\...`                         |
| `Stackra\Tenancy\...` (examples)          | `Stackra\Tenancy\...`                                |
| `Pixielity\Discovery\Facades\Discovery`      | `olvlvl\ComposerAttributeCollector\Attributes`          |

## Structural improvements applied

1. **`#[LoadsResources]` defaults**. The original constructor defaulted every
   flag to `false`, so a bare `#[LoadsResources]` loaded nothing. The Stackra
   constructor turns on the six most common resources — `migrations`, `config`,
   `translations`, `routes`, `commands`, `publishables` — matching Laravel's own
   conventions. Rarer integrations (`views`, `seeders`, `middleware`,
   `observers`, `policies`, `healthChecks`, `listeners`, `macros`,
   `scheduledTasks`) remain `false` and require explicit opt-in. When the
   attribute is entirely absent, `ReadsAttributes::getResourcesConfig()` returns
   `new LoadsResources()`, which now inherits the same helpful defaults. See the
   class docblock and constructor PHPDoc for the full opt-in matrix.

2. **`AsListener` attribute**. New file at `src/Attributes/AsListener.php`.
   Consumers annotate a listener class with `#[AsListener(events: [...])]` and
   the module provider auto-wires `Event::listen($event, $listenerClass)` during
   boot.

3. **Discovery is attribute-only**. The old
   `DiscoversResources::discoverAndRegisterListeners()` used
   `Discovery::directories([$listenersPath])->classes()` to sweep every file in
   `src/Listeners/`. Stackra drops that pattern — a class without
   `#[AsListener]` is inert regardless of where it lives.

## Discovery rewrites (Pixielity → olvlvl)

Every use of the old `Pixielity\Discovery\Facades\Discovery` facade was replaced
with the equivalent `olvlvl/composer-attribute-collector` call, wrapped in the
`try { ... } catch (\LogicException) { ... }` guard used across the monorepo
(see
`packages/health/src/Support/HealthCheckDiscoverer.php::collectAttributeTargets()`
for the reference pattern).

Rewritten call sites:

- `DiscoversResources::discoverAndRegisterCommands()` → walks
  `Attributes::findTargetClasses(AsCommand::class)`, filters abstract classes
  with `\ReflectionClass`, feeds the survivors to `$this->commands([...])`.
- `DiscoversResources::discoverAndRegisterListeners()` → walks
  `Attributes::findTargetClasses(AsListener::class)`, iterates
  `$attribute->events`, calls `Event::listen(...)` per pair.
- `ReadsAttributes::resolveAttributes()` → reads
  `Attributes::forClass(static::class)` with a `\ReflectionClass` fallback for
  the "collector not primed yet" case.
- `ReadsAttributes::validateDependencies()` →
  `Attributes::findTargetClasses(Module::class)` and extracts each attribute's
  `name` field. Skips the check when the collector isn't primed rather than
  failing first boot.
- `RegistersHooks::dispatchLifecycleAttributes()` and
  `registerTerminateAttributes()` → `Attributes::forClass(static::class)` with a
  graceful skip on `LogicException`.
- `SupportsDeferredLoading::resolveDeferredFromAttribute()` →
  `Attributes::forClass(static::class)` with a runtime-reflection fallback so
  deferred loading still works on the very first boot.

## TODO markers and their resolution paths

Every `TODO(...)` marker in the ported source is captured here.

### `TODO(package-routing)` — `stackra/routing` not yet in the monorepo

Locations:

- `src/Concerns/DiscoversResources.php::discoverAndRegisterControllers()`
- `src/Concerns/DiscoversResources.php::discoverAndRegisterMiddleware()`

**Why**: the old backend depended on
`Stackra\Routing\Attributes\AsController`,
`Stackra\Routing\Attributes\AsMiddleware`, and
`Stackra\Routing\RouteRegistrar`. The Stackra monorepo does have a
`packages/routing/` package, but it does not yet expose those specific
attributes. Rather than couple this package to whatever shape they eventually
take, both methods are kept as scaffolding — the call sites in
`discoverResources()` and the gating by `LoadsResources::ATTR_ROUTES` /
`LoadsResources::ATTR_MIDDLEWARE` are intact, but the bodies are inert.

**Resolution**: once `stackra/routing` defines `#[AsController]`,
`#[AsMiddleware]`, and a `RouteRegistrar` service:

```php
// discoverAndRegisterControllers
$targets = Attributes::findTargetClasses(AsController::class);
$registrar = $this->app->make(RouteRegistrar::class);
foreach ($targets as $target) {
    if (class_exists($target->name)) {
        $registrar->registerController($target->name);
    }
}
```

```php
// discoverAndRegisterMiddleware
$targets = Attributes::findTargetClasses(AsMiddleware::class);
$router = $this->app['router'];
foreach ($targets as $target) {
    $attr = $target->attribute;
    if (! $attr->enabled) { continue; }
    $router->aliasMiddleware($attr->alias, $target->name);
    foreach ($attr->groups as $group) {
        $router->pushMiddlewareToGroup($group, $target->name);
    }
}
```

Both suggestions are inlined as comments in the source too.

## Files intentionally NOT ported

None. Every source file has a target:

- `.md` files under `.examples/` (10, 11) are documentation, not code, and were
  explicitly excluded per the port instructions — they weren't targeted for the
  port.
- The source `composer.json` and `module.json` are replaced by the new
  `composer.json` at the package root.

## Auto-discovered service provider

The consumer-facing surface is unchanged: concrete providers extend
`Stackra\ServiceProvider\Providers\ServiceProvider` and get auto-registered
the standard Laravel way.

Additionally, the package auto-registers
`Stackra\ServiceProvider\Providers\ServiceProviderServiceProvider` via
`extra.laravel.providers`. Its only job is to include `vendor/attributes.php` at
register-time so olvlvl's runtime lookups have a `Collection` provider. The
pattern mirrors
`packages/health/src/Providers/HealthServiceProvider::loadAttributesFile()`.

## Registry folder move + `AbstractRegistry` base (Phase 2.D — 2026)

Phase 2.D moved every registry in the monorepo out of `Support/` into
`Registry/` and introduced the shared framework base class
`Stackra\ServiceProvider\Registry\AbstractRegistry` — see
`.kiro/steering/folder-conventions.md` for the locked per-folder ownership rule
and the anti-pattern catalogue.

### Files moved within this package

| Old path                               | New path                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Support/BootstrapperRegistry.php` | `src/Registry/BootstrapperRegistry.php` | Namespace: `Stackra\ServiceProvider\Support` → `Stackra\ServiceProvider\Registry`. Now extends `AbstractRegistry`; every duplicated internal (`$entries`, `$order`, `$cursor`, `register`, `all`, `has`, `count`, `clear`) removed. Bespoke priority-derivation (attribute → container → `DEFAULT_PRIORITY`) migrated to the base's `resolvePriorityFor(string $key, int $providedPriority): int` protected hook. |
| `src/Support/TenancyHookRegistry.php`  | `src/Registry/TenancyHookRegistry.php`  | Namespace: `Stackra\ServiceProvider\Support` → `Stackra\ServiceProvider\Registry`. Now extends `AbstractRegistry`; class body is empty — the base's `all()` + `allReversed()` cover the symmetric-init/teardown pattern out of the box.                                                                                                                                                                           |

### Files that stayed in `Support/`

- `src/Support/BootstrapperRunner.php` — dispatcher-style consumer of the
  registry, NOT a registry itself. Support folder is the correct home for
  utility runtime coordinators per `folder-conventions.md`.
- `src/Support/TenantHookContext.php` — readonly VO passed to every tenancy-hook
  callback. VOs live in `Support/` per the same convention.

### New file — `AbstractRegistry`

`src/Registry/AbstractRegistry.php` (~370 lines) absorbs the mechanical shape
every registry re-implemented. Public surface:

- `register(string $key, int $priority = 100, mixed $metadata = null): void` —
  idempotent; calls `resolvePriorityFor()` hook before stamping.
- `all(): list<string>` — priority-ascending, insertion-order tie-breaker,
  memoized after the first call.
- `allReversed(): list<string>` — `array_reverse($this->all())`.
- `entries(): list<array{key,priority,metadata}>` — full-record iterator for
  admin surfaces + diagnostics.
- `has(string $key): bool`, `count(): int`.
- `priorityOf(string $key): ?int`, `metadataOf(string $key): mixed` —
  domain-typed accessors.
- `clear(): void` — for tests + `bootstrap:clear`.
- `collect(): \Illuminate\Support\Collection` — fluent bridge, new instance per
  call.
- Protected `resolvePriorityFor(string $key, int $providedPriority): int` hook —
  base is a pass-through; subclasses override to derive priority from the key
  (attribute inspection, container introspection, config lookup).

Perf rationale documented on the class docblock — pure PHP arrays

- memoized sort keep Octane hot-path reads allocation-free after the first sort.

### Consumer updates within this package

Every consumer already resolves the registries via container DI, so the
namespace change is a plain import rewrite:

- `Support/BootstrapperRunner.php` — imports
  `Stackra\ServiceProvider\Registry\BootstrapperRegistry`.
- `Bootstrappers/BootstrapperDiscoveryBootstrapper.php` — same.
- `Bootstrappers/TenancyHookBootstrapper.php` — imports
  `Stackra\ServiceProvider\Registry\TenancyHookRegistry`.
- `Dispatchers/TenancyHookDispatcher.php` — imports
  `Stackra\ServiceProvider\Registry\TenancyHookRegistry`.
- `Console/BootstrapCacheCommand.php`, `Console/BootstrapClearCommand.php` —
  import `Stackra\ServiceProvider\Registry\BootstrapperRegistry`.
- `Concerns/AsModuleProvider.php` — imports
  `Stackra\ServiceProvider\Registry\BootstrapperRegistry`.
- `Attributes/AsBootstrapper.php`, `Attributes/AsTenancyHook.php` — `@see`
  docblock references.
- `Providers/ServiceProviderServiceProvider.php` — imports
  `Stackra\ServiceProvider\Registry\BootstrapperRegistry`.

### Tests

`tests/Unit/Registry/AbstractRegistryTest.php` (~310 lines, 22 Pest cases)
covers register + retrieve, priority ordering, insertion-order tie-break,
idempotent duplicate registration (priority + cursor + metadata stability),
`entries()` struct iteration, `priorityOf()` + `metadataOf()` accessors,
`allReversed()`, `clear()` reset of every slot, memoization, memo invalidation
on `register()` + `clear()`, `resolvePriorityFor()` hook invocation, `collect()`
bridge allocation semantics, and the concrete-subclass extension contract.

### Related steering

- `.kiro/steering/folder-conventions.md` — the locked per-folder ownership
  table + anti-pattern catalogue.
- `.kiro/steering/discovery.md` — every bootstrapper populates a registry that
  extends `AbstractRegistry`.
- `.kiro/steering/bootstrappers.md` — the sibling primitive whose cache-aware
  lifecycle drives every registry population.
