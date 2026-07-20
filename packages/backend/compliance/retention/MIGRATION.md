# academorix/retention — migration status

## Bootstrapper migration (Phase 2.C — 2026)

The retention module ships one discovery bootstrapper. Phase 2.C
renamed it to fit the framework's canonical
`Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper` base
per ADR 0020. The framework's `BootstrapperRunner` now iterates the
`$bootstrappers` array on `RetentionServiceProvider` and drives the
bootstrapper through its cache-aware lifecycle at boot — the
previous `afterResolving(RetentionPolicyRegistry::class, …)` hook is
gone.

| Old path                                                                  | New path                                                                  | Notes                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/Discovery/RetentionPolicyDiscoveryBootstrapper.php`                  | `src/Bootstrappers/RetentionPolicyBootstrapper.php`                       | Extends `AbstractBootstrapper`; constructor-injects `RetentionPolicyRegistry`; ships full descriptor cache pair (key/label/description/model/days/action/date column). |

### Provider changes

- `RetentionServiceProvider` now declares
  `protected array $bootstrappers = [RetentionPolicyBootstrapper::class]`.
- `bootRetentionRegistry()` (the previous `#[OnBoot(priority: 10)]`
  that wired the `afterResolving` hook) was deleted — the framework
  runner supersedes it.
- Remaining `#[OnBoot]` method: `bootRetentionCommand()` (priority
  20, registers `RunRetentionCommand` — TODO awaits the console
  package's `#[AsCommand]` discoverer).

### Related steering + ADR

- `.kiro/steering/bootstrappers.md` — canonical contract for the
  new base class.
- ADR 0020 — the naming split between `Bootstrapper` (app-boot,
  cached) and `TenancyHook` (per-tenant, uncached).

## Registry migration (Phase 2.D — 2026)

Phase 2.D moved every registry in the monorepo out of `Support/`
into `Registry/` and refactored each to extend the shared
`Academorix\ServiceProvider\Registry\AbstractRegistry` base — see
`.kiro/steering/folder-conventions.md` for the locked per-folder
ownership rule.

| Old path                                              | New path                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Support/RetentionPolicyRegistry.php`             | `src/Registry/RetentionPolicyRegistry.php`            | Namespace: `Academorix\Retention\Support` → `Academorix\Retention\Registry`. Extends `AbstractRegistry`. Descriptor payload now lives on the base's metadata slot via `parent::register($key, $priority, $descriptor)` — every internal (`$entries`, `$order`, `$cursor`, `usort`) deleted. Domain writer is `registerDescriptor()`; reader is `resolve()` (via `metadataOf()`) with `find()`/`get()` aliases. |
| `src/Support/RetentionPolicyDescriptor.php`           | (unchanged — still in `Support/`)                     | Readonly VO — `Support/` is the correct home per `folder-conventions.md`. Registries live in `Registry/`; VOs live in `Support/`.                                                                                                                                                                                                                                                            |

### API changes

- `RetentionPolicyRegistry::register(...)` → renamed to
  `registerDescriptor(RetentionPolicyDescriptor $descriptor,
  int $priority = 100)`. The base's `register(string $key,
  int $priority, mixed $metadata)` is inherited unchanged and callers
  MAY still use it if they carry the `(key, priority, descriptor)`
  shape.
- `RetentionPolicyRegistry::resolve(string $key)`, `find()`, `get()`
  — three aliases pointing at the same lookup (metadata slot on the
  base).
- `RetentionPolicyRegistry::descriptors()` — unchanged surface; the
  implementation now zips `all()` (priority-sorted keys) against
  `metadataOf()`.

### Consumer updates

- `RetentionPolicyBootstrapper::registerTarget()` /
  `fromCachePayload()` now call `->registerDescriptor($descriptor)`
  in place of the previous `->register($descriptor)`.
- No other in-monorepo consumer touches
  `RetentionPolicyRegistry::register` directly — the runner reads
  descriptors via `->descriptors()`.
