# Container / DI Architecture Reviewer — 2026-07-21

**Scope.** Read-only audit of the DI framework (`@stackra/container`), the
cross-package contract vocabulary (`@stackra/contracts`), module lifecycle
across every `@stackra/*` package's `<name>.module.ts`, and the discovery-based
auto-registration pattern.

**Baseline.** After R1–R5 (manifest normalization, entity subfolder moves,
`@stackra/support` migration, 291 docblocks, workspace changeset).
`pnpm --filter='./packages/frontend/**' typecheck` was reported green as of
2026-07-21.

**Method.** Read the container's discovery + instance-loader in full, sampled 8
of 17 domain loaders (uniform pattern confirmed), grepped every module for
`class *Bootstrap`, sentinel-returning `useFactory`, contract re-export
patterns, `*Like` shim declarations, token duplication, globalThis escape
hatches, and services reading React context.

---

## 1. Executive Summary

**Verdict — yellow (holds together, four rule-anchored issues need attention).**

The DI framework itself is in **good shape**. The steering-defined lifecycle
rules are followed with impressive uniformity:

- Zero `class *Bootstrap` anywhere in the workspace.
- Zero `useFactory` returning `true` / `null` sentinels.
- All 17 domain loaders (`*-loader.service.ts`) uniformly implement
  `OnApplicationBootstrap`, inject `DISCOVERY_SERVICE`, and call
  `getProvidersByMetadata(...)`. (The one method-level scan in
  `event-subscribers-loader` uses `getProviders()` — steering-approved for
  method-level metadata.)
- Every `forFeature(...)` I audited routes through `createSeedLoader` +
  `seedLoaderToken` from `@stackra/support`. No local re-implementations.
- `IDiscoveryService` is single-sourced in contracts (no redeclarations).
- Zero `@Injectable()` services reading React context. Zero services import from
  `react`.

Four issues drop the grade from green:

1. **The DI kernel ships unconditional console diagnostics** in every bootstrap
   phase. `instance-loader.service.ts` has 10 hardcoded `console.log/warn/error`
   calls that fire on every provider resolution + every `onModuleInit` + every
   `onApplicationBootstrap`. The file's own comment says "Remove or gate behind
   `logger?.enabled` once boot is healthy" — that gate never landed.

2. **Divergent runtime symbol for `QUERY_CONFIG`.** `@stackra/contracts`
   publishes `Symbol.for("QUERY_CONFIG")`; the query package's `QueryModule`
   binds `Symbol.for("STACKRA_QUERY_CONFIG")`. Two different runtime symbols
   under the same name — a consumer importing from contracts silently gets the
   wrong slot.

3. **A `globalThis` escape hatch bypasses DI for queued events.**
   `event-subscribers-loader.service.ts` reads
   `(globalThis as any).__stackra_queue_manager__` to dispatch
   `@OnEvent({ queued: true })` listeners to the queue. Nothing in the workspace
   writes that slot, so the entire queued-listener feature is dead code that
   always falls through to sync execution.

4. **Nine `*Like` structural shim interfaces** violate the contract-reexports
   rule. Four duplicate interfaces that already exist in `@stackra/contracts`
   (`ITabCoordinator`, `IAuthService`, `ICacheManager`); two need contract
   promotion (`ILockManager`, `ITaggedCache`); two are legitimate third-party
   API probes (`ISentry`, `INetworkInformation`) and one is a duck-typing
   parameter (`IComponentRegistryLike` in the SDUI validator).

The remainder is drift, not breakage — 5 contract re-export pass-through files
still live in the grandfathered set (events × 3, logger × 1, queue × 2), two
managers still extend `Manager<T>` where steering says
`MultipleInstanceManager<T>` fits better, and a handful of packages re-declare
tokens locally that also live in contracts.

---

## 2. Contracts Posture

`@stackra/contracts` **is clean** as a vocabulary hub — no runtime-import
back-edges into feature packages, layout follows the canonical
`tokens/ | interfaces/ | types/ | enums/ | events/` split, and its
`src/index.ts` is a pure barrel with only two grandfathered legacy aliases at
the tail (`IProvider`, `IScope`).

**One structural drift** — a legitimate cross-package interface for
`LockManager` (from `@stackra/coordinator`) has never been promoted.
`TAB_LOCK_MANAGER` is exposed as a token in contracts (`coordinator.tokens.ts`),
but the matching `ILockManager` interface does not exist, forcing consumers
(`http/middleware/auth.middleware.ts`) to declare a local `ILockManagerLike`
shim. Same story for `TaggedCache` in cache. See §6 for the full list.

**Locally-redeclared tokens** (same `Symbol.for(name)` string on both sides —
same runtime value, but sourcecode duplication):

- `coordinator/src/core/constants/tokens.constant.ts` — `TAB_LOCK_MANAGER`
  duplicates `contracts/tokens/coordinator.tokens.ts:TAB_LOCK_MANAGER`. The
  docblock even claims "the package-internal `TAB_LOCK_MANAGER` stays here" —
  factually wrong, contracts has it too.
- `scope/src/core/constants/tokens.constant.ts` — `SCOPE_SERVICE` duplicates
  `contracts/tokens/scope.tokens.ts:SCOPE_SERVICE`. (Local `SCOPE_CONFIG` and
  `SCOPE_DATA_SOURCE` are not in contracts — they live only in the scope
  package. Whether they should be promoted is a design question; contracts has
  an adjacent `SCOPE_MODULE_OPTIONS`.)
- `analytics/src/core/constants/index.ts` — `CONSENT_MANAGER_TOKEN` wraps
  `Symbol.for("CONSENT_MANAGER")` (identical to
  `contracts/tokens/consent.tokens.ts:CONSENT_MANAGER`). The `_TOKEN` suffix is
  a naming drift too.

**Feature-package contract re-exports** (banned per
`.kiro/steering/contract-reexports.md`, grandfathered per the retrofit note):

| File                                                              | Re-exports                                                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events/src/core/decorators/index.ts:19-20`                       | `EVENT_SUBSCRIBER_METADATA_KEY as EVENT_SUBSCRIBER_METADATA`, `IEventSubscriberMap`                                                                        |
| `events/src/core/interfaces/on-event-metadata.interface.ts`       | `IOnEventMetadata`, `IOnEventOptions`                                                                                                                      |
| `events/src/core/interfaces/event-transport-options.interface.ts` | `IEventTransportOptions` (this file also declares the package-owned `IEventTransport` — the file itself is legitimate; only the re-exported type is drift) |
| `events/src/core/interfaces/event-subscriber-map.type.ts`         | `IEventSubscriberMap`                                                                                                                                      |
| `logger/src/core/decorators/reporter-metadata.constant.ts`        | `LOGGER_REPORTER_METADATA_KEY as REPORTER_METADATA_KEY`                                                                                                    |
| `queue/src/core/interfaces/job-event-type.interface.ts`           | `JobEventType`                                                                                                                                             |
| `queue/src/core/interfaces/processor-options.interface.ts`        | `IProcessorOptions`                                                                                                                                        |
| `container/src/core/index.ts:46`                                  | `Scope` — **intentional** exemption per steering (DI framework re-exports DI primitives à la `@nestjs/common`)                                             |

Only two runtime `export … from '@stackra/contracts'` lines survive on a subpath
`index.ts` barrel — one grandfathered (container), one pending removal (events
decorators barrel).

---

## 3. Module Lifecycle Audit

**All `class *Bootstrap` — zero hits** (checked with regex
`class\s+\w+Bootstrap` across every `.ts`/`.tsx` in `packages/frontend/*/src`).

**`useFactory` returning sentinels — zero hits.** The only `useFactory` +
`return true;` / `return null;` in the tree is inside a code fence in the
steering doc itself.

**`forFeature` / seeded providers — uniform.** Every one uses
`createSeedLoader` + `seedLoaderToken` from `@stackra/support`. Verified call
sites:

- `actions/src/core/actions.module.ts` — `actions:built-in`,
  `actions:built-in-async`, `actions:feature`.
- `cache/src/core/cache.module.ts` — `cache-store:<driver>`.
- `config/src/core/config.module.ts` — `config-service-setup`,
  `VALIDATED_ENV_LOADER`, `CONFIGURATION_LOADER`, `config-feature:<key>`.
- `devtools/src/core/devtools.module.ts` — `devtools:panel:<name>`,
  `devtools:inspector:<name>`.
- `http/src/core/http.module.ts` — `http-connector:<driver>`,
  `http-middleware:<Class>`, `http-interceptor:<Class>`.
- `notifications/src/core/notification.module.ts` —
  `notifications:channel:in-app`, `notifications:<Class>`.
- `queue/src/core/queue.module.ts` — `queue-connector:<driver>`.
- `sdui/src/core/sdui.module.ts` — `sdui:forRoot`, `sdui:forFeature`.
- `theming/src/core/theming.module.ts` — `theming:forFeature`.

Every seed factory returns the `SeedLoader` shape (an object with
`onApplicationBootstrap()`) and the InstanceLoader duck-types it via
`hasOnApplicationBootstrap` in
`container/src/core/container/instance-loader.service.ts`. The lifecycle
contract holds end-to-end.

**Inline `mergeConfig` — none observed.** Every `forRoot` / `forRootAsync` on
the legacy-trio side either routes through `mergeConfig(options)` (sync) or
`mergeConfig(await options.useFactory(...))` (async). The config-factory
adopters (cache, queue, events, logger) don't have a `mergeConfig` step at all —
defaults live inline in the app-level `registerAs` factory. Both patterns are
correct per current `package-conventions.md`.

**P1 — DI kernel ships unconditional diagnostics.**
`container/src/core/container/instance-loader.service.ts` has ten hardcoded
`console.log / console.warn / console.error` calls in the bootstrap path:

- Lines 138, 141, 145 — phase 1 (resolveProviders).
- Line 168 — phase 2 entry log.
- Line 174 — phase 3 entry log.
- Line 179 — completion log.
- Lines 262, 268, 279, 295 — per-hook logs for `onModuleInit` (before, watchdog
  warning at 5s, after, error).
- Lines 333, 339, 350, 366 — the same set for `onApplicationBootstrap`.

Every log fires unconditionally on every boot. The file's own top-of-block
comment says "Remove or gate behind `logger?.enabled` once boot is healthy" —
the removal never happened. Console output at framework kernel level is
invasive: it pollutes every downstream app's console, adds `performance.now()`
overhead per hook, and arms a `setTimeout` watchdog per provider that also has
to be cleared. Gate behind `logger?.enabled` or a `__DEV__` build flag.

---

## 4. Discovery / Loader Hygiene

**17 domain `*-loader.service.ts` files across 15 packages.** Every one audited
implements the canonical pattern:

| Loader                                               | `OnApplicationBootstrap` |    Injects `DISCOVERY_SERVICE`    |                          `getProvidersByMetadata`                           |
| ---------------------------------------------------- | :----------------------: | :-------------------------------: | :-------------------------------------------------------------------------: |
| `actions/…/handler-loader.service.ts`                |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `analytics/…/analytics-provider-loader.service.ts`   |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `cache/…/cache-store-loader.service.ts`              |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `console/…/command-loader.service.ts`                |            ✓             |           ✓ (required)            |                                      ✓                                      |
| `console/publishing/…/publishable-loader.service.ts` |            ✓             | ✓ (required, uses `getModules()`) |                              n/a — module-axis                              |
| `csp/…/csp-policy-loader.service.ts`                 |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `dashboard/…/widget-loader.service.ts`               |            ✓             |           ✓ (required)            |                                      ✓                                      |
| `devtools/…/devtools-inspector-loader.service.ts`    |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `devtools/…/devtools-panels-loader.service.ts`       |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `events/…/event-subscribers-loader.service.ts`       |  ✓ + `OnModuleDestroy`   |           ✓ (optional)            | ✓ for transports; `getProviders()` for listener methods (steering-approved) |
| `logger/…/reporter-loader.service.ts`                |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `monitoring/…/monitoring-provider-loader.service.ts` |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `queue/…/processor-subscribers-loader.service.ts`    |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `routing/guards/…/guard-loader.service.ts`           |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `routing/middleware/…/middleware-loader.service.ts`  |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `scheduler/…/scheduled-task-loader.service.ts`       |            ✓             |           ✓ (optional)            |                                      ✓                                      |
| `settings/…/settings-schema-loader.service.ts`       |    ✗ (`OnModuleInit`)    |   n/a — not a discovery loader    |                             n/a — HTTP fetcher                              |

The settings schema loader carries the `-loader.service.ts` suffix but is
**not** a discovery adapter — it fetches a schema over HTTP at `OnModuleInit`.
The naming is a minor drift (the steering reserves `-loader.service.ts` for the
discovery pattern). Either rename (e.g. `settings-schema-fetcher.service.ts`) or
accept the broader "populates a registry" meaning.

The class-name suffix rule from `.kiro/steering/discovery-vs-loader.md` (Rule 4
— "class name suffix is `Loader` — never `LoaderService`") is respected
everywhere except four files that use `LoaderService`:

- `DevtoolsInspectorLoaderService`
- `DevtoolsPanelsLoaderService`
- `GuardLoaderService`
- `MiddlewareLoaderService`

Every other domain loader class ends in `Loader`. Four exceptions is a small P3.

---

## 5. Manager Base Choice

Every fan-out surface uses one of `Manager<T>` or `MultipleInstanceManager<T>`
from `@stackra/support`. Steering (`package-conventions.md`) says:

> **`Manager<T>`** — one active driver, switchable (logger channels, auth).
> **`MultipleInstanceManager<T>`** — N independently-configured named instances
> (cache, queue, http, monitoring, analytics).

Current placement:

| Package                        | Base                                           | Steering says                           |
| ------------------------------ | ---------------------------------------------- | --------------------------------------- |
| `analytics/AnalyticsManager`   | `MultipleInstanceManager<IAnalyticsProvider>`  | ✓                                       |
| `cache/CacheManager`           | `Manager<ICacheStore>`                         | ✗ — should be `MultipleInstanceManager` |
| `http/HttpManager`             | `MultipleInstanceManager<IHttpClient>`         | ✓                                       |
| `logger/LoggerManager`         | `Manager<ILogChannel>`                         | ✓ (channels — single active)            |
| `monitoring/MonitoringManager` | `MultipleInstanceManager<IMonitoringProvider>` | ✓                                       |
| `queue/QueueManager`           | `Manager<IQueueConnection>`                    | ✗ — should be `MultipleInstanceManager` |
| `realtime/RealtimeManager`     | `Manager<IRealtimeConnection>`                 | tolerable — connection semantics        |
| `settings/SettingsManager`     | `MultipleInstanceManager<ISettingsStore>`      | ✓                                       |
| `storage/StorageManager`       | `MultipleInstanceManager<IStorage>`            | ✓                                       |

`CacheManager` and `QueueManager` extend `Manager<T>` and expose `store(name)` /
`connection(name)` aliases over `Manager.driver(name)`. Functionally works today
because both surfaces have caching per-name, but the base class contract
semantically models "one active driver" rather than "N independently-configured
instances". Per-instance config (`{ default, stores: {…} }`) isn't leveraged
through the base class — `getDefaultInstance()` / `getInstanceConfig(name)`
never gets called. Migration to `MultipleInstanceManager<T>` is drift-cleanup,
not a correctness fix. P2.

**Fan-out isolation** — every provider-fan-out I inspected (monitoring,
analytics, notifications) iterates the manager's active set and wraps the
per-provider call in `try/catch` so one throwing provider doesn't poison the
rest. Uniform.

---

## 6. Contract Re-export Leaks

Ran the full grep:

```
find packages/frontend -type f -name 'index.ts' -path '*/src/*'
| xargs -I{} grep -HnE "^\s*export\s.*from ['\"]@stackra/contracts['\"]" {}
```

**Two hits on subpath barrels:**

- `container/src/core/index.ts:46` —
  `export { Scope } from "@stackra/contracts";` — **intentional** per steering's
  grandfathered container exemption.
- `events/src/core/decorators/index.ts:19-20` — re-exports
  `EVENT_SUBSCRIBER_METADATA_KEY as EVENT_SUBSCRIBER_METADATA` and
  `IEventSubscriberMap`. Rule violation. Legacy rename shim; remove with a minor
  bump.

**Five pass-through interface files** (banned by the rule "no local files whose
only job is to re-export a contract"):

- `events/src/core/interfaces/on-event-metadata.interface.ts` — legacy shim for
  `IOnEventMetadata` + `IOnEventOptions`.
- `events/src/core/interfaces/event-subscriber-map.type.ts` — legacy shim for
  `IEventSubscriberMap`.
- `logger/src/core/decorators/reporter-metadata.constant.ts` — legacy rename
  shim for `LOGGER_REPORTER_METADATA_KEY`.
- `queue/src/core/interfaces/job-event-type.interface.ts` — legacy shim for
  `JobEventType`.
- `queue/src/core/interfaces/processor-options.interface.ts` — legacy shim for
  `IProcessorOptions`.

`events/src/core/interfaces/event-transport-options.interface.ts` also
re-exports `IEventTransportOptions`, but the same file legitimately declares the
package-owned `IEventTransport` behavior interface — the file is legitimate;
only the `export type { IEventTransportOptions }` line is drift.

Each of the pre-rule grandfathered feature packages (events, logger, queue) can
shed its re-export in a single per-package minor bump — consumers already import
from `@stackra/contracts` in most call sites.

**Nine `*Like` shim interfaces** found (checked with regex
`^\s*(export\s+)?interface\s+I\w+Like\b`). Per steering `contract-reexports.md`:
"Search `**/src/**/*.ts` for `interface I\w+Like\b` — zero hits allowed."

| Location                                                                                | Shim                                | Verdict                                                          |
| --------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `ai/react/providers/ai/leader-gate.component.tsx:21`                                    | `ITabCoordinatorLike`               | ✗ duplicates `ITabCoordinator` in contracts                      |
| `devtools/react/hooks/use-devtools-auth-guard/use-devtools-auth-guard.hook.ts:39`       | `IAuthServiceLike`                  | ✗ mismatched-shape shim of `IAuthService` (see P1-3 sub-note)    |
| `devtools/native/components/devtools-panel-frame/devtools-panel-frame.component.tsx:26` | `IAuthServiceLike`                  | ✗ duplicate of the above                                         |
| `http/core/middleware/auth.middleware.ts:34`                                            | `ILockManagerLike`                  | ✗ needs contract promotion (`ILockManager` missing in contracts) |
| `http/core/interceptors/metrics.interceptor.ts:32`                                      | `ISentryLike`                       | ✓ legitimate third-party API probe                               |
| `http/core/interceptors/cache.interceptor.ts:46`                                        | `ITaggedCacheLike`                  | ✗ needs contract promotion (`ITaggedCache` missing in contracts) |
| `http/core/interceptors/cache.interceptor.ts:55`                                        | `ICacheManagerLike`                 | ✗ duplicates `ICacheManager` in contracts                        |
| `pwa/react/hooks/use-adaptive-loading/use-adaptive-loading.hook.ts:15`                  | `INetworkInformationLike`           | ✓ legitimate `navigator.connection` browser-API probe            |
| `sdui/core/validator/screen-validator.ts:48`                                            | `IComponentRegistryLike` (exported) | ~ duck-typing seam for a validator's parameter                   |

---

## 7. `forFeature` Shape

Every `forFeature(...)` audited uses the canonical `createSeedLoader` +
`seedLoaderToken` from `@stackra/support`. No package re-implements them.

Two shape variants observed:

**Variant A — one-shot seeder.** `Cache`, `Queue`, `Notifications`:

```ts
static forFeature(driver: string, Cls: Type<T>): DynamicModule {
  return {
    module: X,
    providers: [
      Cls,
      {
        provide: seedLoaderToken(`x:${driver}`),
        useFactory: (mgr: XManager, inst: T) =>
          createSeedLoader(() => mgr.extend(driver, () => inst)),
        inject: [X_MANAGER, Cls],
      },
    ],
    exports: [Cls],
  };
}
```

**Variant B — fan-out over a list.** `Actions`, `Devtools`, `Theming`: identical
shape but wraps `providers` in `entries.flatMap([...])`.

**One `forFeature` variant does something interesting**:
`devtools/…/DevtoolsModule.forFeature` uses an `@Optional() DEVTOOLS_REGISTRY`
inside the factory and returns `createSeedLoader(() => {})` (a no-op loader)
when the registry isn't wired. Fail-soft rather than throw — correct pattern per
the module-lifecycle steering, since consumers may `forFeature` panels
defensively without `DevtoolsModule.forRoot()`.

---

## 8. React Bindings

`@stackra/container/react` ships five hooks + one provider + one context. All
clean:

- `useInject<T>(token): T` — memoized, throws when the container isn't mounted
  or the provider is missing.
- `useOptionalInject<T>(token): T | undefined` — memoized, returns `undefined`.
- `useContainer(): ApplicationContext` — the underlying handle.
- `useDiscovery(): DiscoveryService` — alias for `useInject(DiscoveryService)`.
- `useDiscovered()` — helper on top of `useDiscovery`.
- `ContainerProvider` — wraps children with `ContainerContext.Provider`. Falls
  back to `getGlobalApplicationContext()` (a documented `globalThis` +
  `Symbol.for` singleton pattern in `core/utils/global-application.util.ts`,
  chosen deliberately to survive tsup's per-entry bundle duplication).

**Cross-cutting: zero services read React context.**
`packages/frontend/*/src/**/*.service.ts` has no `useContext` /
`React.useContext` / `from 'react'` imports (verified with two greps). The
service → context read anti-pattern from `communication-patterns.md` is not in
the codebase.

**Container's global singleton** — legitimate. The
`globalThis[Symbol.for("@stackra/container:global-application-context")]` slot
is a workspace-wide pattern (documented in the file's docblock as mirroring
React DevTools / TanStack Query / Zustand) to survive tsup's per-entry bundling.
Not a hidden coupling.

---

## 9. Config Pattern

Four packages have migrated to the `@stackra/config` factory pattern (Pattern A
from `package-conventions.md`): **cache**, **queue**, **events**, **logger**.
Each `forRoot(config)` takes a fully-formed config (no `DEFAULT_*_CONFIG`, no
`mergeConfig` step) and each `forRootAsync(options)` accepts the exact object
from `cacheConfig.asProvider()`.

The other 19 module packages still use the legacy trio (Pattern B) —
`DEFAULT_<NAME>_CONFIG` + package-owned `defineConfig` + `mergeConfig`: actions,
ai, analytics, consent, coordinator, dashboard, devtools, i18n, monitoring,
notifications, pwa, query, realtime, routing, scheduler, scope, settings,
storage, sync.

Both patterns are correct per current steering. The migration is opportunistic
("when the package is touched next") — not a blocker.

**One hybrid** — `container/src/core/utils/define-config.util.ts` ships a
deprecated shim that re-exports `registerAs` from `@stackra/config` and emits a
one-time `console.warn` on first call, with "Removal target: v0.2" in the
docblock. Standard deprecation surface. Fine.

---

## 10. Findings by Priority

### P0 — Broken

**P0-1. `event-subscribers-loader.service.ts` — queue dispatch bypasses DI via a
`globalThis` slot that is never written.**

`packages/frontend/events/src/core/services/event-subscribers-loader.service.ts:268`:

```ts
const queueManager = (globalThis as any).__stackra_queue_manager__;
```

The path handling `@OnEvent({ queued: true, queue, delay })` reads
`globalThis.__stackra_queue_manager__` and, if present, calls
`queueManager.dispatch(...)`. Nothing in the workspace writes that slot — the
queue package never sets it. Every queued listener falls through to the sync
`safeInvoke` branch. The whole `queued` option is inert.

Two problems:

1. **DI bypass.** Steering `communication-patterns.md` says services consume
   dependencies via `@Inject(TOKEN)`. The correct wiring is
   `@Optional() @Inject(QUEUE_MANAGER) queue?: IQueueManager` on the loader's
   constructor.
2. **Dead code.** The `queued` branch is unreachable; the feature it advertises
   doesn't work.

Fix options: (a) delete the queued-listener branch entirely; (b) rewire through
`@Optional() @Inject(QUEUE_MANAGER)` and expose the right runtime shape; (c)
build a proper event → queue bridge module. Options (b) or (c) are the real
answers.

### P1 — Rule violation, meaningful drift

**P1-1. Container InstanceLoader ships unconditional console spam.**
`container/src/core/container/instance-loader.service.ts` — 10 hardcoded
`console.log/warn/error` calls fire on every boot for every provider
resolution + every lifecycle hook. Plus a 5-second `setTimeout` watchdog per
hook that also fires unconditionally. The file's own comment says "Remove or
gate behind `logger?.enabled` once boot is healthy." Gate it.

**P1-2. Divergent `QUERY_CONFIG` symbol strings.**

- `contracts/src/tokens/query.tokens.ts:13` — `Symbol.for("QUERY_CONFIG")`.
- `query/src/core/tokens/query.tokens.ts:12` —
  `Symbol.for("STACKRA_QUERY_CONFIG")`.

Two different runtime symbols. Any consumer importing `QUERY_CONFIG` from
`@stackra/contracts` gets a different symbol than the one `QueryModule` binds.
Either delete the contracts copy (the package docblock claims it's "internal to
`@stackra/query`") or rename the package-local copy to
`Symbol.for("QUERY_CONFIG")` — pick one.

**P1-3. `*Like` shims duplicating existing contract interfaces.** Per steering
`contract-reexports.md` — "Search `**/src/**/*.ts` for `interface I\w+Like\b` —
zero hits allowed."

- `ai/src/react/providers/ai/leader-gate.component.tsx:21` —
  `ITabCoordinatorLike`. `ITabCoordinator` exists in
  `contracts/src/interfaces/coordinator/tab-coordinator.interface.ts`.
- `devtools/src/react/hooks/use-devtools-auth-guard/use-devtools-auth-guard.hook.ts:39`
  — `IAuthServiceLike`. `IAuthService` exists in contracts.
- `devtools/src/native/components/devtools-panel-frame/devtools-panel-frame.component.tsx:26`
  — duplicate of the above.
- `http/src/core/interceptors/cache.interceptor.ts:55` — `ICacheManagerLike`.
  `ICacheManager` exists in contracts.

Sub-issue on the two `IAuthServiceLike` shims: the shape declared by the shim
does not match `IAuthService`. The shim expects `isAuthenticated`,
`currentUser`, `can(ability, resource)`, none of which are members of the
contract `IAuthService` (which has `login`, `logout`, `check`, `getIdentity`,
etc.). Either (a) devtools consumes a different auth surface than the platform
contract — in which case a new contract interface should be promoted — or (b)
the devtools shim is wrong and the fail-open gate is silently gating on
properties that will never exist. Worth clarifying with the devtools + auth
owners.

**P1-4. `*Like` shims for contracts that should be promoted.**

- `http/src/core/middleware/auth.middleware.ts:34` — `ILockManagerLike`. The
  `LockManager` class exists in `@stackra/coordinator`, exposed under
  `TAB_LOCK_MANAGER`, but no `ILockManager` interface exists in contracts.
  Promote to
  `@stackra/contracts/interfaces/coordinator/lock-manager.interface.ts` and drop
  the shim.
- `http/src/core/interceptors/cache.interceptor.ts:46` — `ITaggedCacheLike`.
  `TaggedCache` class exists in `@stackra/cache`. `ITaggedCache` needs to be
  added to contracts. Same story for `ICacheManager.tags(...)` — the method
  returning a tagged cache isn't in the interface either; adding `ITaggedCache`
  will require expanding `ICacheManager` too.

### P2 — Drift, low priority (address when touched)

**P2-1. Feature-package contract re-export pass-throughs (5 files).**
Grandfathered per steering; each is a per-package minor-bump cleanup.

**P2-2. `CacheManager` + `QueueManager` should extend
`MultipleInstanceManager<T>`** per steering.

**P2-3. Locally-declared tokens that duplicate contracts (3 cases).** Same
`Symbol.for(name)` string — same runtime symbol — but sourcecode duplication and
misleading docblocks:

- `coordinator/…/tokens.constant.ts:TAB_LOCK_MANAGER` (also in contracts).
- `scope/…/tokens.constant.ts:SCOPE_SERVICE` (also in contracts).
- `analytics/…/constants/index.ts:CONSENT_MANAGER_TOKEN` (aliased name wrapping
  the contract's `CONSENT_MANAGER`).

**P2-4. Loader class-name drift** — four loaders end in `LoaderService` where
steering says `Loader`:

- `DevtoolsInspectorLoaderService`.
- `DevtoolsPanelsLoaderService`.
- `GuardLoaderService`.
- `MiddlewareLoaderService`.

**P2-5. `settings-schema-loader.service.ts` name.** Not a discovery loader —
it's an HTTP schema fetcher running at `OnModuleInit`. Rename or accept that
`-loader.service.ts` now covers "populates a registry" regardless of source.

### P3 — Nit

**P3-1. `useOnEvent` hook signature.**
`events/src/react/hooks/use-on-event/use-on-event.hook.ts` ships
`useOnEvent(event, handler)` — missing the generic `<TPayload>` and the `deps?`
parameter the steering-declared shape includes. The ref pattern makes `deps`
structurally unnecessary, but typed payloads would improve DX. Cosmetic.

**P3-2. `IComponentRegistryLike` exported from
`sdui/src/core/validator/screen-validator.ts:48`.** Duck-typing seam for a
validator function's dependency (`{ has(type: string): boolean }`), not a
DI-injected shim. Strict reading of the steering flags it, but functionally it's
a legitimate function parameter shape. Consider renaming to `IValidatorRegistry`
or accepting the strict-mode exception.

**P3-3. `ConsoleModule.registered` static flag.**
`console/src/console.module.ts:67` gates `forRoot()` / `forRootAsync()` behind a
private static `registered = false` + throws `ModuleAlreadyRegisteredError` on
the second call. No other module in the workspace has this pattern. Complicates
test lifecycles (needs a reset hook after `clearGlobalApplicationContext`) and
is non-idiomatic. Consider whether the guard earns its keep vs. simply warning.

**P3-4. `state-store.tokens.ts` name is misleading.** The file only declares
`SDUI_RUNTIME_STORE` — a specific SDUI thing, not a general state store.
Consider renaming to `sdui-runtime-store.token.ts` (which also aligns with the
"one token per file, `.token.ts` singular" convention rather than the plural
`.tokens.ts`).

**P3-5. `analytics/…/constants/index.ts:CONSENT_MANAGER_TOKEN` — the `_TOKEN`
suffix is redundant** vs. the workspace's naming convention (every other token
drops the suffix — `CONSENT_MANAGER`, `AUTH_SERVICE`, `CACHE_MANAGER`, etc.).
Rename to `CONSENT_MANAGER` (which is also the canonical name in contracts,
which the analytics package should import directly).

---

## Naming & Consistency

- **Package names.** `@stackra/<name>` — uniformly kebab-case, no framework
  prefix. ✓
- **Loader files** — uniformly `<name>-loader.service.ts`. ✓
- **Loader class names.** Mostly `<Name>Loader`; four use `<Name>LoaderService`
  (see P2-4).
- **Module classes.** `<Name>Module` — consistent.
- **Module lifecycle contracts.** `<Name>Module.forRoot()`,
  `<Name>Module.forRootAsync()`, `<Name>Module.forFeature()` — every audited
  module follows the naming.
- **Token names.** UPPER_SNAKE_CASE `Symbol.for(...)`, mostly consistent. One
  drift with `CONSENT_MANAGER_TOKEN` (P3-5) and the `_INTERNAL` package-private
  suffix (`CACHE_CONFIG_INTERNAL`, `LOGGER_CONFIG_INTERNAL`, etc.) is a nice
  convention for hidden-from-consumers tokens.
- **File suffix for token files** — mixed `<name>.tokens.ts` (multi-token
  legacy) vs `<name>.token.ts` (single-token new). Both variants live in
  contracts. Per `.kiro/steering/code-standards.md` the singular variant is
  preferred; the plural is grandfathered.
- **Decorators.** `@Name` factory function → `<Name>Decorator` file. ✓
- **Interfaces.** `I<Name>` prefix for framework contracts; component props drop
  the `I` prefix (`NetworkStatusIndicatorProps`). Uniform.

Proposed convention (already ~90% honored):

- Loaders: filename `<name>-loader.service.ts`, class `<Name>Loader` (no
  `Service` suffix on the class).
- Tokens: prefer singular `.token.ts` for new tokens; keep `.tokens.ts` for the
  pre-existing multi-token files (grandfathered) unless a file gets split.
- Package-internal tokens: `X_CONFIG_INTERNAL` naming convention when the token
  has a same-domain public counterpart the app owns (already used in cache,
  queue, events, logger).

---

## What's Solid

- **The DI framework itself** — provider resolution, module scanning, lifecycle
  orchestration, discovery — is coherent and well-doc'd. The duck-typed
  `hasOnApplicationBootstrap` check that makes `createSeedLoader` work is a nice
  touch.
- **Discovery contract single-sourcing.** `IDiscoveryService` in contracts,
  `ContainerDiscoveryService` in container, everywhere else injects the contract
  token. No redeclarations.
- **Uniform loader pattern.** 17 domain loaders across 15 packages, identical
  shape.
- **Uniform `forFeature` pattern** via `createSeedLoader` + `seedLoaderToken`.
  No local re-implementations.
- **No `class *Bootstrap`. No sentinel-returning `useFactory`.**
- **No service reads React context.** The composition happens in hooks, as the
  communication-patterns steering requires.
- **`ContainerProvider` + `useInject` + `useOptionalInject`** — clean, memoized,
  throws with a specific message when unmounted.
- **Global-context singleton** uses `globalThis[Symbol.for(...)]` with
  documented rationale — the correct workaround for tsup's per-entry bundling.
- **Package boundaries**: `@stackra/contracts` → nothing; `@stackra/support` →
  nothing from feature packages; `@stackra/container` → contracts + support
  only. No inverted deps detected.

---

## Open Questions for Humans

1. **`ILockManager` + `ITaggedCache` promotion.** Should we add these interfaces
   to `@stackra/contracts` (and drop the `*Like` shims), or accept them as
   coordinator-side / cache-side concrete surfaces that other packages
   type-narrow locally? The steering says "promote"; if we do,
   `ICacheManager.tags(tags)` also needs to be in the interface.

2. **`QUERY_CONFIG` reconciliation.** The contracts copy
   (`Symbol.for("QUERY_CONFIG")`) and the query-package copy
   (`Symbol.for("STACKRA_QUERY_CONFIG")`) are structurally divergent. Kill the
   contracts copy (the query docblock claims it's internal) or rename the
   package copy to match contracts?

3. **InstanceLoader diagnostics.** The 10 unconditional `console.*` calls +
   5-second watchdogs — gate behind `logger?.enabled`, gate behind `__DEV__`, or
   delete outright? The comment in the file says "boot is healthy" is the
   trigger for removal. Is that now?

4. **`CacheManager` + `QueueManager` base class.** Steering says
   `MultipleInstanceManager<T>`; today they're `Manager<T>`. Migrate or relax
   the steering?

5. **Queued `@OnEvent` listeners.** The `globalThis`-based dispatch path is
   broken. Delete it and drop the `queued`/`queue`/`delay` options, or rewire
   through DI (`@Optional() @Inject(QUEUE_MANAGER)`)? The `@OnEvent` type
   surface currently advertises queue delivery that the framework doesn't
   provide.

6. **`AUTH_SERVICE` binding shape.** The two `IAuthServiceLike` shims in
   devtools describe methods (`isAuthenticated`, `currentUser`, `can`) that
   don't exist on the contract's `IAuthService`. Is the devtools consuming a
   different auth surface (in which case a contract interface should be
   promoted) or is the shim wrong (in which case the fail-open gate is gating on
   undefined properties)?
