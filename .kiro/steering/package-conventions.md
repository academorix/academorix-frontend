# Package Conventions

The standard shape every `@stackra/*` **module package** follows. Read alongside
`module-lifecycle.md` (lifecycle hooks), `contract-reexports.md` (what a package
may export), and `ui-components.md` (React UI packages).

"Module package" = a package that ships a DI module with a static `forRoot`.
Vocabulary-only packages (`contracts`), base utilities (`support`, `testing`),
and the DI framework (`container`) are exempt from the module/config rules
below.

## Scaffold

Every package has, at minimum:

- `package.json` — `publishConfig.access: public`, `engines.node >= 22`,
  `main`/`module`/`types`, an `exports` map (`.`, plus `./react`, `./testing`,
  and other subpaths as needed), `files: ["dist", "LICENSE", "README.md"]`, and
  the standard scripts
  (`build`/`dev`/`clean`/`typecheck`/`test`/`test:watch`/`test:coverage`).
- `tsconfig.json` extending `../tsconfig.base.json` with
  `paths: { "@/*": ["./src/*"] }`.
- `tsup.config.ts` via `defineBaseConfig({ index: 'src/core/index.ts', ... })`.
- `vitest.config.ts` merging `@stackra/testing/preset`.
- `README.md`.
- `src/core/index.ts` — the public API (package-owned symbols only).

## Config authoring

Two patterns are supported. The **config factory** pattern (via
`@stackra/config`, forked from `@nestjs/config`) is canonical for every new or
migrating package. The **legacy config trio** stays valid until each package
migrates. See `.kiro/specs/stackra-config-package/PLAN.md` for the full design +
task sequence.

### Pattern A — config factory (`@stackra/config` adopting packages)

The consumer writes a factory that produces the config directly. There is no
`DEFAULT_<NAME>_CONFIG` constant, no `mergeConfig` merge step, and no
package-owned `defineConfig` alias — the factory IS the merged config, and
defaults live inline via `env('X', default)` calls that wrap
`@stackra/support`'s `Env`:

```ts
// apps/dashboard/src/config/cache.config.ts
import { registerAs, env } from "@stackra/config";
import type { ICacheModuleConfig } from "@stackra/cache";

export const cacheConfig = registerAs<ICacheModuleConfig>("cache", () => ({
  default: env("CACHE_STORE", "memory"),
  ttl: env.number("CACHE_TTL", 3600),
  prefix: env("CACHE_PREFIX", "app:"),
  stores: { memory: { driver: "memory" } },
}));
```

The factory is passed to `ConfigModule.forRoot({ load: [cacheConfig] })` at the
app root, and `.asProvider()` feeds it into `<X>Module.forRootAsync`:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [cacheConfig], cache: true }),
    CacheModule.forRootAsync(cacheConfig.asProvider()),
  ],
})
```

Rules for adopting packages:

- **No `DEFAULT_<NAME>_CONFIG`** — defaults live in the app-level factory via
  `env('X', default)`.
- **No package-owned `defineConfig`** — consumers import `registerAs` from
  `@stackra/config` directly.
- **No `mergeConfig`** — the factory-produced object IS the final config.
- **No framework-level `<X>_CONFIG` token in `@stackra/contracts`** — consumers
  reach the config through the app-owned `cacheConfig.KEY`.
- **`<X>Module.forRootAsync(options)`** accepts either the traditional
  `{ useFactory, inject, imports }` shape OR the exact object `.asProvider()`
  returns (they're identical).
- **Normalisation moves into the manager.** If the package needs to prune
  `enabled: false` instances or filter a `stack` list, do it in the manager's
  constructor as a private `normalizeConfig(input)` method — not in a public
  `mergeConfig` util.

### Pattern B — legacy config trio (packages not yet migrated)

Every configurable module that has not migrated to `@stackra/config` still ships
the three pieces below. Each of these ports to Pattern A when the package is
touched next.

1. **`constants/` — `DEFAULT_<NAME>_CONFIG`.** The single source of default
   values, typed as the package's options interface. (Not `*_OPTIONS`, not
   inline in the module.)
2. **`utils/define-config.util.ts` — `defineConfig(config)`.** A typed identity
   for authoring config in a `config/*.config.ts` file. Authoring only — it
   performs no merging.
3. **`utils/merge-config.util.ts` — `mergeConfig(options?)`.** The single place
   defaults are applied. `forRoot` **and** `forRootAsync` both route through it
   — never merge inline in the module.

`mergeConfig` responsibilities:

- Spread `DEFAULT_<NAME>_CONFIG` under the user options.
- **Normalise.** For multi-instance packages (a `providers`/`stores`/
  `connections` map), prune instances that are `enabled: false` or missing a
  required field, and filter any `stack`/selection list down to the survivors.
  Encode required fields in a `constants` map (`<NAME>_REQUIRED_FIELDS`). This
  lets consumers wire env-driven ids unconditionally (`dsn: env.SENTRY_DSN`) and
  let the module skip unset ones — no `...(x ? {…} : {})` in config files.

```ts
export function mergeConfig(options?: Partial<Options>): Options {
  const merged = { ...DEFAULT_X_CONFIG, ...options };
  const providers: Record<string, InstanceConfig> = {};
  for (const [name, cfg] of Object.entries(merged.providers ?? {})) {
    if (isInstanceActive(cfg)) providers[name] = cfg;
  }
  const stack = merged.stack?.filter((n) => n in providers);
  return { ...merged, providers, ...(stack ? { stack } : {}) };
}
```

During migration, the package's local `defineConfig` becomes a thin deprecation
shim that re-exports `registerAs` from `@stackra/config` and warns once at
runtime; the shim is removed in the next major.

## Manager base — pick the right one

From `@stackra/support`:

- **`Manager<T>`** — one active driver, switchable (logger channels, auth).
  `driver(name)`.
- **`MultipleInstanceManager<T>`** — N independently-configured named instances
  (cache, queue, http, **monitoring, analytics**). `instance(name)`,
  `create{Driver}Driver(config)` convention, `extend(driver, creator)`.

**Fan-out** (dispatch one call to many providers — monitoring, analytics) is a
facade layered on `MultipleInstanceManager`: iterate the active set (configured
`stack` ∪ ad-hoc registered), never a bespoke flat registry. A throwing provider
must be isolated (`try/catch` per provider).

## `forFeature` — always via the shared seed loader

Never run a side effect in a `useFactory` that returns a sentinel
(`return null`/`return true`). Use the canonical helper from `@stackra/support`:

```ts
import { createSeedLoader, seedLoaderToken } from '@stackra/support';

static forFeature(driver: string, Cls: Type<T>): DynamicModule {
  return {
    module: XModule,
    providers: [
      Cls,
      {
        provide: seedLoaderToken(`x-thing:${driver}`), // unique per call
        useFactory: (mgr: XManager, inst: T) =>
          createSeedLoader(() => mgr.extend(driver, () => inst)),
        inject: [X_MANAGER, Cls],
      },
    ],
    exports: [Cls],
  };
}
```

Do **not** re-implement `createSeedLoader`/`seedLoaderToken` locally — import
them from `@stackra/support`. (`seedLoaderToken` returns a fresh `Symbol()` per
call, so contributions don't collide under the container's last-wins token
semantics — never use `Symbol.for(...)` here.)

## Auto-registration — decorator + loader

Discoverable contributors (stores, reporters, providers, processors) use a class
decorator that stamps a metadata key + a loader service that scans the container
and registers them.

- The loader queries **`discovery.getProvidersByMetadata(METADATA_KEY)`** — not
  `getProviders()` + manual `getMetadata` filtering.
- `OnModuleInit` when seeding the service's own state; `OnApplicationBootstrap`
  when scanning other modules (discovery).
- Import `IDiscoveryService` from `@stackra/contracts` — do not redeclare it.

## Contracts

Import tokens/interfaces from `@stackra/contracts` directly; new packages do not
re-export them (see `contract-reexports.md`).

---

## Conformance backlog (as of the standardization sweep)

**Completed:**

- `class *Bootstrap` — 0 hits (eradicated).
- `forFeature` return-`null` side-effect factories — fixed in `cache`, `queue`,
  `realtime`, `http` (now use the shared `createSeedLoader`).
- Shared `createSeedLoader`/`seedLoaderToken` live in `@stackra/support`;
  `analytics`, `monitoring`, and `csp` all source them from there (csp keeps its
  public re-export for back-compat).
- Discovery loaders switched to `getProvidersByMetadata`: `analytics`,
  `monitoring`, `queue`, `cache`, `scheduler`, and `events` (transport scan; the
  `@OnEvent` listener scan stays on `getProviders()` because it's method-level
  metadata). `events` no longer redeclares `IDiscoveryService`.
- Config trio (`DEFAULT_*_CONFIG` + `defineConfig` + `mergeConfig`) extracted
  for `consent`, `scope`, `query` (were merging inline).
- Stray legacy `network/network/**` (`@stackra/ts-network`) tree removed.

**Intentional exceptions (not to be "fixed"):**

- **`@stackra/container` DI re-export.** It re-exports the DI foundation
  vocabulary (`Type`, `Provider`, `DynamicModule`, lifecycle hooks, `Scope`)
  from `@stackra/contracts`. This is deliberate — the DI framework re-exporting
  DI primitives, à la `@nestjs/common`; every module imports
  `Module`/`DynamicModule` from it. Keep it. `contract-reexports.md` targets
  _feature_ packages leaking _domain_ tokens, not this.

**Still divergent — low priority, address when touched:**

- **`mergeConfig` normalization** — `events`, `cache`, `queue`, `realtime`,
  `scheduler`, `coordinator` are shallow-spread only. Fine (single-instance / no
  required fields); adopt the pruning shape if they grow a providers map.
- **No defaults merge** — `csp`/`http`/`network` bind options without a
  `DEFAULT_*_CONFIG` merge. Acceptable (little/nothing to default); add the trio
  only if defaults appear.
- **Feature-package contract re-exports** — the pre-rule grandfathered set
  (`logger`, `queue`, `cache`, `events`, `realtime`, `scheduler`, `coordinator`,
  `collaboration`, `ssr`) still re-export their domain contracts; remove
  per-package with a minor bump + changeset when touched (per
  `contract-reexports.md`).
