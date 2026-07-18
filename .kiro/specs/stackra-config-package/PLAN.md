# `@stackra/config` — package plan (v2, fork-and-adapt `@nestjs/config`)

Unified configuration + DI namespace registry for the `@stackra/*` workspace.
This is a **fork-and-adapt** of `@nestjs/config@4.0.4` — we adopt the public API
surface verbatim (`registerAs`, `.KEY`, `.asProvider()`, `ConfigType`,
`ConfigService.get/getOrThrow/set`, `ConfigModule.forRoot/forFeature`,
`envVariablesLoaded`, `ConditionalModule`) and fork the implementation to swap
`@nestjs/common` for `@stackra/container` + strip Node-only file/dotenv paths so
it runs cleanly in Vite / browser bundles.

Replaces the per-package `defineConfig` alias currently duplicated across
`@stackra/{cache,container,events,logger,network,queue,ssr}` and the
`defineConfig` / `createDefineConfig` helpers in `@stackra/support`. **Also
kills** the per-package `DEFAULT_<X>_CONFIG` constants, `mergeConfig(user)`
utilities, and framework-level `<X>_CONFIG` tokens in `@stackra/contracts` — the
factory-based configs shipped by `registerAs` replace all three.

---

## TL;DR

- **Adopt** the entire public API of `@nestjs/config@4.0.4` verbatim —
  `registerAs`, `.KEY`, `.asProvider()`, `ConfigType`, `ConfigModule.forRoot`,
  `ConfigModule.forFeature`, `ConfigService` (get / getOrThrow / set),
  `envVariablesLoaded`, `ConditionalModule.registerWhen`.
- **Fork** the runtime: `@nestjs/common` → `@stackra/container`, drop `rxjs`,
  strip `es-toolkit`, hand-roll dotted-path helpers, guard `fs` / `dotenv`
  behind runtime detection so the browser bundle stays clean.
- **Layer** our `env()` / `env.number` / `env.bool` / `env.orFail` / `env.enum`
  / `env.url` typed helpers on top — used inside `registerAs` factories, wraps
  `@stackra/support`'s `Env` class.
- **Kill** per-package `DEFAULT_<X>_CONFIG` + `mergeConfig` + `<X>_CONFIG`
  contracts tokens. Factory-based configs replace all three.
- **Ship** deprecation shims for the seven packages' existing `defineConfig`
  aliases — one release cycle before removal.
- **Attribute** under MIT to Kamil Myśliwiec + the NestJS team via `NOTICE`
  file + per-file `@derived` JSDoc tags.

---

## 1. Motivation

Three overlapping problems in the current workspace, all traceable to the absent
`@stackra/config` package that seven `defineConfig` docblocks already point at
as their eventual home:

1. **No namespaced DI for config.** Consumers today `@Inject(CACHE_CONFIG)`
   where the token is a hand-declared symbol per module. Every new config
   surface requires a new token declaration + provider registration + a
   `DEFAULT_<X>_CONFIG` constant + a `mergeConfig` util. That's ~80 LOC of
   ceremony per package.
2. **No unified env-var story.** Apps sprinkle `import.meta.env.VITE_X` /
   `process.env.X` across config files. `@stackra/support`'s `Env` class is the
   workspace's canonical answer but its `Env.get(...)` API doesn't read
   naturally inside object literals.
3. **`defineConfig` is duplicated seven times** across module packages plus one
   central copy in `@stackra/support`. Every new module ships the same ~40
   lines.

The natural fit is **`@nestjs/config`'s API**. Our earlier design iterations
(`registerAs` → `defineConfig(namespace, value)` with symbol tagging → "kill
mergeConfig + DEFAULT_CONFIG") converged on it from first principles — which is
a signal to just adopt the proven surface. `.asProvider()` in particular solves
the "how do I plug this config into another module's `forRootAsync`?" problem
more elegantly than the tag-inspection auto-registration we were sketching, and
`ConfigType<typeof cfg>` gives us the typed-inject DX for free.

But `@nestjs/config` v4 assumes Node (`fs.readFileSync`, `process.env`
write-back, `dotenv`), which our Vite SPA dashboard cannot ship. Straight
adoption breaks the browser bundle. **Fork-and-adapt** — same API, browser-safe
implementation — gives us the mature surface without the runtime constraints.

---

## 2. Attribution

`@stackra/config` is a derivative work of
[`@nestjs/config@4.0.4`](https://github.com/nestjs/config) by Kamil Myśliwiec,
licensed MIT.

Attribution requirements:

- **`packages/config/LICENSE`** — MIT with combined copyright:
  `Copyright (c) 2018-present Kamil Myśliwiec. Copyright (c) 2025 Stackra L.L.C.`
- **`packages/config/NOTICE`** — long-form attribution + link to upstream
  repository + summary of divergences (browser adaptation, container swap, rxjs
  / es-toolkit / dotenv removal, additive `env()` helpers).
- **Per-file `@derived` JSDoc tag** on every source file whose content was
  ported from upstream, in the top-of-file block:

  ```typescript
  /**
   * @file register-as.util.ts
   * @module @stackra/config/core/utils
   * @description Registers a factory function under a namespace token.
   *   The returned factory has a `.KEY` symbol + `.asProvider()` method for
   *   integration with `<X>Module.forRootAsync(...)`.
   *
   * @derived @nestjs/config@4.0.4 — lib/utils/register-as.util.ts
   */
  ```

- **README credit block** — dedicated section at the bottom of
  `packages/config/README.md` acknowledging the upstream.

---

## 3. Scope

### 3.1 In v0.1 (adopted verbatim from `@nestjs/config`)

**Authoring:**

- `registerAs<T>(token, factory)` — the tagged factory helper. Returns
  `TFactory & IConfigFactoryKeyHost<ReturnType<TFactory>>` with a non-enumerable
  `.KEY`, `.asProvider()`, and the internal registration metadata.
- `getConfigToken(namespace)` — derives the string DI token from a namespace.

**Module wiring:**

- `ConfigModule.forRoot(options)` — accepting `load`, `cache`, `isGlobal`,
  `validate`, `validationSchema`, `expandVariables`, `ignoreEnvFile`,
  `override`, `skipProcessEnv`, `envFilePath`, `parser`, `validationOptions`,
  `validatePredefined`. Returns `Promise<DynamicModule>`.
- `ConfigModule.forFeature(config)` — partial registration for feature modules.
- `ConfigModule.envVariablesLoaded` — static promise, resolves after `forRoot`
  finishes env loading (async factories can `await` before touching
  `process.env`).

**Runtime:**

- `ConfigService<K, WasValidated>` — the injectable API:
  - `get(path)` / `get(path, defaultValue)` / `get(path, options)` /
    `get(path, defaultValue, options)` — 4 overloads (nestjs verbatim).
  - `getOrThrow(path)` / `getOrThrow(path, defaultValue)` /
    `getOrThrow(path, options)` / `getOrThrow(path, defaultValue, options)` — 4
    overloads.
  - `set(path, value)` — writes to internal config; writes to `process.env` in
    Node; internal-only in browser.

**Conditional loading:**

- `ConditionalModule.registerWhen(module, condition, options?)` — condition is
  either an env-var name (`'USE_FOO'`) or a predicate
  `(env: NodeJS.ProcessEnv) => boolean`.

**Typing:**

- `ConfigType<typeof cfg>` — resolves the return type of a registered factory.
  Powers `@Inject(cacheConfig.KEY) cfg: ConfigType<typeof cacheConfig>`.

### 3.2 In v0.1 (our additions on top)

**Env helpers** (`utils/env.util.ts` — wraps `@stackra/support`.`Env`):

- `env(key, defaultValue?)` — three-source resolution (`process.env` →
  `import.meta.env` → `globalThis.__ENV__`).
- `env.number(key, defaultValue?)` — coerces to number, NaN-safe.
- `env.bool(key, defaultValue?)` — coerces to boolean (`true`/`1`/`yes`/`on`).
- `env.orFail(key)` — throws `ConfigEnvMissingError` if the key is unset.
- `env.enum(key, allowed, defaultValue?)` — throws `ConfigEnvInvalidError` if
  the value is outside the allowed list.
- `env.url(key, defaultValue?)` — parses via `new URL(...)`, throws
  `ConfigEnvInvalidError` on failure.

**Introspection:**

- `ConfigService.describe(options?)` — returns
  `Record<string, { value: unknown; source: 'load' | 'env' | 'validated' | 'process'; isDefault: boolean; path: string }>`
  for every registered key. Supports `redactedKeys?: RegExp[]` for masking
  values matching a pattern. Powers `/api/debug/config` endpoints in dev builds.

**Deprecation shims** (one release cycle):

- Each of the seven packages' existing `defineConfig` alias becomes a thin
  re-export of `registerAs` from `@stackra/config`, with `@deprecated` in
  TSDoc + a one-time `console.warn` at runtime.
- `@stackra/support`'s `defineConfig` + `createDefineConfig` receive the same
  treatment.

**Errors:**

- `ConfigError` — base class, all others extend.
- `ConfigMissingKeyError` — thrown by `getOrThrow`.
- `ConfigReadonlyError` — thrown by `set()` on a read-only source.
- `ConfigValidationError` — thrown when `validate` / `validationSchema` fails.
- `ConfigEnvMissingError` — thrown by `env.orFail`.
- `ConfigEnvInvalidError` — thrown by `env.enum` / `env.url`.

### 3.3 Out of v0.1 (v0.2+)

Deferred wholesale:

- **`changes$` observable stream.** nestjs uses rxjs. v0.1 skips (nice-to-have,
  not P0). v0.2 revisits with either an EventEmitter or rxjs.
- **`dotenv-expand` env-file interpolation.** Vite already handles `${VAR}`
  expansion at build time via its own env-loading. Guarded behind Node runtime +
  `expandVariables: true` opt-in.
- **Vite plugin** — compile-time namespace autocomplete + duplicate-namespace
  compile error. Genuinely useful, our unique contribution, but scoped to v0.2.
- **Doppler secrets driver** — v0.2.
- **HTTP config driver** — v0.2, remote config over `fetch`.
- **React hooks subpath** — `useConfig()` / `useConfigValue(key)` in `/react`.
- **NestJS-compat subpath** — for consumers who bring a NestJS app into the
  workspace and want direct API parity.
- **CLI init** — `pnpm dlx @stackra/config init` scaffolds config files.

---

## 4. Complete v0.1 API surface

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// Authoring — registerAs (nestjs verbatim)
// ═══════════════════════════════════════════════════════════════════════════

/** Registers a config factory under a namespace token. */
export function registerAs<
  TConfig extends ConfigObject,
  TFactory extends ConfigFactory = ConfigFactory<TConfig>,
>(
  token: string | symbol,
  configFactory: TFactory,
): TFactory & IConfigFactoryKeyHost<ReturnType<TFactory>>;

/** Derives the string DI token for a namespace. */
export function getConfigToken(name: string | symbol): string;

/** DEPRECATED alias — will be removed in v0.2. Prefer `registerAs`. */
export { registerAs as defineConfig };

// ═══════════════════════════════════════════════════════════════════════════
// Env helpers — our addition, wraps @stackra/support.Env
// ═══════════════════════════════════════════════════════════════════════════

export function env(key: string, defaultValue?: string): string;
env.number = (key: string, defaultValue?: number): number;
env.bool = (key: string, defaultValue?: boolean): boolean;
env.orFail = (key: string): string;
env.enum = <T extends string>(key: string, allowed: readonly T[], defaultValue?: T): T;
env.url = (key: string, defaultValue?: string): URL;

// ═══════════════════════════════════════════════════════════════════════════
// Module — DI wiring (nestjs verbatim)
// ═══════════════════════════════════════════════════════════════════════════

export class ConfigModule {
  /** Load env + register configs globally. */
  static forRoot<V extends Record<string, any>>(
    options?: IConfigModuleOptions<V>,
  ): Promise<DynamicModule>;

  /** Partial registration for feature modules. */
  static forFeature(config: IConfigFactory): DynamicModule;

  /** Promise resolves when env variables are loaded. */
  static readonly envVariablesLoaded: Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Runtime — ConfigService (nestjs verbatim + describe() added)
// ═══════════════════════════════════════════════════════════════════════════

export class ConfigService<K = Record<string, unknown>, WasValidated extends boolean = false> {
  // 4 get() overloads (nestjs verbatim)
  get<T = any>(propertyPath: KeyOf<K>): ValidatedResult<WasValidated, T>;
  get<T, P extends Path<T>, R extends PathValue<T, P>>(propertyPath: P, options: IConfigGetOptions): ValidatedResult<WasValidated, R>;
  get<T = any>(propertyPath: KeyOf<K>, defaultValue: NoInferType<T>): T;
  get<T, P extends Path<T>, R extends PathValue<T, P>>(propertyPath: P, defaultValue: NoInferType<R>, options: IConfigGetOptions): Exclude<R, undefined>;

  // 4 getOrThrow() overloads (nestjs verbatim)
  getOrThrow<T = any>(propertyPath: KeyOf<K>): Exclude<T, undefined>;
  // (etc. mirroring get())

  /** Mutates internal config; writes process.env in Node, internal-only in browser. */
  set<T = any>(propertyPath: KeyOf<K>, value: T): void;

  /** OUR ADDITION — introspection. */
  describe(options?: { redactedKeys?: RegExp[] }): Record<string, {
    value: unknown;
    source: 'load' | 'env' | 'validated' | 'process';
    isDefault: boolean;
    path: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Conditional loading (nestjs verbatim)
// ═══════════════════════════════════════════════════════════════════════════

export class ConditionalModule {
  static registerWhen(
    module: Type<any> | DynamicModule,
    condition: string | ((env: Record<string, string | undefined>) => boolean),
    options?: { timeout?: number },
  ): DynamicModule;
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type ConfigType<TFactory extends (...args: any[]) => any> = ReturnType<TFactory>;

// ═══════════════════════════════════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════════════════════════════════

export class ConfigError extends Error { readonly code: string }
export class ConfigMissingKeyError extends ConfigError
export class ConfigReadonlyError extends ConfigError
export class ConfigValidationError extends ConfigError
export class ConfigEnvMissingError extends ConfigError
export class ConfigEnvInvalidError extends ConfigError
```

Contracts side — interfaces + tokens promoted to `@stackra/contracts` (see §7):

```typescript
// From @stackra/contracts
export interface IConfigService { /* mirror of ConfigService methods */ }
export interface IConfigFactory<T = unknown> { (): T | Promise<T>; namespace?: string }
export interface IConfigFactoryKeyHost<T = unknown> {
  readonly KEY: string | symbol;
  asProvider(): {
    imports: [DynamicModule];
    useFactory: (config: T) => T;
    inject: [string | symbol];
  };
}
export interface IConfigModuleOptions<V = Record<string, any>> { /* full option shape */ }
export interface IConfigModuleAsyncOptions { /* async form */ }
export interface IConfigGetOptions { infer: true }
export interface IConditionalModuleOptions { timeout?: number }
export type ConfigObject = Record<string, any>;
export type NoInferType<T> = /* nestjs pattern */;
export type Path<T> = /* dotted-path type */;
export type PathValue<T, P> = /* value at path type */;
export type Parser = (source: Buffer | string) => Record<string, string>;

// Tokens
export const CONFIGURATION_TOKEN: symbol;         // internal config host
export const CONFIGURATION_SERVICE_TOKEN: symbol; // ConfigService instance
export const CONFIGURATION_LOADER: symbol;        // loader factory sentinel
export const VALIDATED_ENV_LOADER: symbol;        // validated-env loader
export const VALIDATED_ENV_PROPNAME: string;      // propname on internal host
```

---

## 5. Design decisions

### 5.1 Why adopt the API, not the runtime

- Every P0 the reviewers flagged in the v1 plan is solved by nestjs's design:
  factory-only (no overload landmine), same-value in ConfigService + inject (no
  split-brain), real-value ConfigService (no unspreadable proxy), non-enumerable
  `.KEY` on a factory function (no tag lost on spread).
- `.asProvider()` is the killer pattern we didn't design. Solves module
  composition in one line: `CacheModule.forRootAsync(cacheConfig.asProvider())`.
- `ConfigType<typeof cfg>` collapses the typed-inject pattern to zero
  boilerplate.
- Adoption cost: 100% API compatibility, 40% of the runtime complexity.

But the runtime is wrong for us:

- `@nestjs/config` uses `fs.readFileSync` + `process.env` write-back — the
  browser bundle in a Vite SPA can't ship `fs` and can't write `process.env`.
- `rxjs` peer dep for `changes$` observable — we don't ship rxjs at workspace
  level.
- `es-toolkit/compat/{get,set,has}` — new dep for functionality we can hand-roll
  in 30 LOC.
- `dotenv` + `dotenv-expand` are file-parsing deps that only matter in Node.

**Fork-and-adapt**: same API, browser-safe implementation, no new workspace
deps.

### 5.2 Kill per-package `DEFAULT_<X>_CONFIG` + `mergeConfig` + `<X>_CONFIG` token

The user's earlier decision, folded in here. Rationale:

- **Consumer writes**:
  `registerAs('cache', () => ({ store: env('CACHE_STORE', 'memory'), ttl: env.number('CACHE_TTL', 3600), ... }))`.
- The factory IS the config. Defaults live inline via `env('X', default)`. No
  `DEFAULT_CACHE_CONFIG` constant is needed.
- The factory-produced object is the final config. No
  `mergeConfig(defaults, user)` merge pass is needed.
- **`<X>_CONFIG` token in contracts dies.** The framework-level token was the
  module's internal binding. In the new world:
  - The app-owned `cacheConfig.KEY` is the canonical way consumers reach the
    config.
  - `<X>Module.forRoot` binds the resolved config value to a **private**
    internal symbol (`Symbol('cache-config-internal')`) — not exposed to
    consumers.
  - The manager reads from the private token.
  - Any downstream provider that needs the config injects `cacheConfig.KEY`.

**Normalization** (pruning `enabled: false` instances, filtering `stack`) moves
**into the manager** where the domain knowledge lives. `mergeConfig` becomes
`normalizeConfig` as a private method on `CacheManager`, called from its
constructor. Not a public export.

### 5.3 `defineConfig` → `registerAs`, one-cycle deprecation

- Use nestjs's `registerAs` name as the canonical.
- Ship `defineConfig` as an alias in `@stackra/config` for one release cycle.
- Each of the seven packages' local `defineConfig` becomes a deprecation shim:
  - Re-exports `registerAs` from `@stackra/config`.
  - Marked `@deprecated` in TSDoc pointing at the new import path.
  - Emits a one-time `console.warn` at runtime.
- v0.2 removes the alias and the seven shims.

### 5.4 `<X>Module.forRoot` shape — two forms

Both forms work; consumer picks based on context:

**Form A — plain object (untagged, no ConfigService integration):**

```typescript
CacheModule.forRoot({ default: 'memory', stores: {...} })
```

**Form B — tagged via `.asProvider()` (integrated with ConfigModule):**

```typescript
CacheModule.forRootAsync(cacheConfig.asProvider());
```

Form B is canonical for apps that use `@stackra/config`. Form A stays as an
escape hatch for tests, inline configs, or packages that don't want the
ConfigModule dependency.

The `.asProvider()` output shape is exactly what `forRootAsync` expects (the
`IConfigModuleAsyncOptions` shape). Zero glue code.

### 5.5 Env-file loading — runtime-detected

- **Node runtime**: fs-based load (nestjs's original path), gated behind
  `typeof process !== 'undefined' && !!process.versions?.node`.
- **Browser runtime**: skip file loading entirely — Vite already inlined env
  vars into `import.meta.env` at build time.
- **Consumer code doesn't care** — the same `env('X', default)` call works in
  both runtimes because `Env.get` (from `@stackra/support`) already handles the
  three-source resolution (`process.env` → `import.meta.env` →
  `globalThis.__ENV__`).
- `dotenv` + `dotenv-expand` stay as runtime deps but their imports are dynamic
  behind the Node guard. tsup marks them as external so they're not bundled into
  the browser build.

### 5.6 `rxjs` dep — drop for v0.1

- `@nestjs/config` uses `rxjs.Subject` for `changes$` observable.
- We don't ship rxjs at workspace level; adopting it as a peer for
  `@stackra/config` alone is disproportionate.
- Drop `changes$` for v0.1. Nothing else in nestjs's ConfigService uses rxjs.
- v0.2 can add back via either rxjs (add as workspace peer) or a lightweight
  `EventEmitter` pattern (matches how `@stackra/events` handles pub/sub).

### 5.7 `es-toolkit` dep — hand-roll dotted-path helpers

- nestjs uses `es-toolkit/compat/{get,set,has}` for
  `ConfigService.get('a.b.c')`.
- We ship three tiny utils in `packages/config/src/core/utils/` (~30 LOC each):
  - `get-nested-value.util.ts` — `getNestedValue(obj, 'a.b.c')`
  - `set-nested-value.util.ts` — `setNestedValue(obj, 'a.b.c', value)`
  - `has-nested-value.util.ts` — `hasNestedValue(obj, 'a.b.c')`
- Handles: dotted keys, array indexes (`items[0].name`), missing intermediate
  keys (returns `undefined` rather than throw).

### 5.8 `ConfigService.describe()` — our addition

Both reviewers flagged this as the single most valuable addition. Backs
`/api/debug/config` endpoints in dev:

```typescript
const snapshot = configService.describe({
  redactedKeys: [/_SECRET$/, /_KEY$/, /_TOKEN$/],
});
// {
//   'cache.prefix': { value: 'dashboard:', source: 'load', isDefault: false, path: 'cache.prefix' },
//   'auth.jwt_secret': { value: '***REDACTED***', source: 'env', isDefault: false, path: 'auth.jwt_secret' },
//   ...
// }
```

Not in nestjs's `ConfigService`. Ships in v0.1.

### 5.9 Doppler ownership of env-var names

Unchanged from v1 plan. `doppler run -- pnpm vite dev` injects env vars into
`process.env` before Vite starts; Vite bakes them into `import.meta.env` for the
browser bundle. Every `env('NAME', ...)` call resolves to a name that must exist
in the Doppler project.

---

## 6. Steering conformance

Explicit mapping from each `.kiro/steering/*.md` rule to how this plan observes
it.

### 6.1 `code-standards.md` — one-export-per-file, suffix-per-kind, folder-per-category

The fork drops nestjs's multi-export files and splits into one-export-per-file
per our rule:

| Symbol                       | File                             | Folder                     |
| ---------------------------- | -------------------------------- | -------------------------- |
| `registerAs`                 | `register-as.util.ts`            | `utils/`                   |
| `getConfigToken`             | `get-config-token.util.ts`       | `utils/`                   |
| `getRegistrationToken`       | `get-registration-token.util.ts` | `utils/`                   |
| `createConfigProvider`       | `create-config-provider.util.ts` | `utils/`                   |
| `mergeConfigObject`          | `merge-config-object.util.ts`    | `utils/` (internal helper) |
| `getNestedValue`             | `get-nested-value.util.ts`       | `utils/`                   |
| `setNestedValue`             | `set-nested-value.util.ts`       | `utils/`                   |
| `hasNestedValue`             | `has-nested-value.util.ts`       | `utils/`                   |
| `env` (+ methods)            | `env.util.ts`                    | `utils/`                   |
| `loadEnvFile`                | `load-env-file.util.ts`          | `utils/` (Node-only)       |
| `getDefaultParser`           | `default-parser.util.ts`         | `utils/`                   |
| `isNode`                     | `is-node.util.ts`                | `utils/`                   |
| `ConfigService`              | `config.service.ts`              | `services/`                |
| `ConfigModule`               | `config.module.ts`               | root                       |
| `ConfigHostModule`           | `config-host.module.ts`          | root                       |
| `ConditionalModule`          | `conditional.module.ts`          | root                       |
| `ConfigError` (+ subclasses) | one file each                    | `errors/`                  |
| Constants                    | one per file                     | `constants/`               |

Filename convention: kebab-case + suffix (`.service.ts`, `.util.ts`,
`.module.ts`, `.error.ts`, `.constant.ts`). Symbol names PascalCase for classes
/ interfaces, camelCase for functions, `SCREAMING_SNAKE` for constants.

### 6.2 `package-conventions.md` — config trio replaced by config factory

`package-conventions.md` currently mandates a per-package "config trio":
`DEFAULT_<X>_CONFIG` constant + `defineConfig` util + `mergeConfig` util.

**Task 6 updates the steering doc** to introduce a new "config factory" pattern
for `@stackra/config`-adopting packages, and preserves the trio as "legacy" for
packages that haven't migrated yet.

New rule (for adopting packages):

- **No `DEFAULT_<NAME>_CONFIG`** — defaults live inline in the app's
  `registerAs` factory via `env('X', default)` calls.
- **No package-owned `defineConfig`** — consumers import `registerAs` from
  `@stackra/config` directly.
- **No `mergeConfig`** — the factory IS the merged config.
- **Normalization** (if any) moves into the manager's constructor as a private
  `normalizeConfig(input)` method.

### 6.3 `contract-reexports.md` — no re-exports from contracts

`@stackra/config` does NOT re-export any symbol from `@stackra/contracts`.
Consumers import types + tokens directly:

```typescript
// ❌ WRONG
import { IConfigService } from "@stackra/config";

// ✅ CORRECT
import type { IConfigService } from "@stackra/contracts";
import { ConfigService } from "@stackra/config";
```

The public surface of `@stackra/config` is only the runtime symbols it owns
(`ConfigService` class, `ConfigModule` class, `registerAs` function, `env`
function, error classes). Every interface / type / DI token lives in
`@stackra/contracts`.

### 6.4 `documentation.md` — top-of-file docblock + per-export JSDoc

Every source file in `packages/config/src/`:

- **Top-of-file docblock** with `@file` / `@module` / `@description`.
- **Per-export JSDoc** with one-line summary + `@param` / `@returns` / `@throws`
  / `@example` as applicable.
- **Fork-derived files** carry `@derived @nestjs/config@4.0.4 — <path>` tag.
- **Inline comments** on non-obvious flow, ordering constraints, fail-soft
  behavior, or platform quirks.
- **Section dividers** in `ConfigService` (>4 members) grouping Public API /
  Lifecycle / Private.

### 6.5 `module-lifecycle.md` — no bootstrap-class, use lifecycle hooks

Nestjs's `ConfigModule.forRoot` internally uses factory providers with a
sentinel-returning `useFactory` (the `CONFIGURATION_LOADER` pattern). Our fork
replaces those with **`createSeedLoader` + `seedLoaderToken`** from
`@stackra/support`:

```typescript
// Old nestjs pattern (violates our steering)
providers: [
  {
    provide: CONFIGURATION_LOADER,
    useFactory: (host, ...configs) => {
      configs.forEach((c, i) => mergePartial(host, c, providers[i]));
      // returns undefined — sentinel
    },
    inject: [CONFIGURATION_TOKEN, ...configProviderTokens],
  },
];

// Our replacement (conforms to steering)
providers: [
  {
    provide: seedLoaderToken("config-loader"),
    useFactory: (host, ...configs) =>
      createSeedLoader(() => {
        configs.forEach((c, i) => mergePartial(host, c, providers[i]));
      }),
    inject: [CONFIGURATION_TOKEN, ...configProviderTokens],
  },
];
```

`createSeedLoader(fn)` returns an object implementing `onApplicationBootstrap`
that the container's instance loader duck-types and calls in the proper
lifecycle phase.

### 6.6 `support-utilities.md` — env() wraps @stackra/support.Env

Our `env(...)` helpers wrap `@stackra/support`'s `Env` class rather than
re-implement the three-source resolver:

```typescript
// packages/config/src/core/utils/env.util.ts
import { Env } from "@stackra/support";

export function env(key: string, defaultValue: string = ""): string {
  return Env.get(key, defaultValue);
}
env.number = (key: string, defaultValue = 0): number =>
  Env.getNumber(key, defaultValue);
env.bool = (key: string, defaultValue = false): boolean =>
  Env.getBoolean(key, defaultValue);
env.orFail = (key: string): string => Env.getOrFail(key);
env.enum = <T extends string>(
  key: string,
  allowed: readonly T[],
  defaultValue?: T,
): T => {
  const value = Env.get(key, defaultValue ?? "");
  if (!allowed.includes(value as T)) {
    throw new ConfigEnvInvalidError(
      key,
      `must be one of: ${allowed.join(", ")}, got: ${value}`,
    );
  }
  return value as T;
};
env.url = (key: string, defaultValue?: string): URL => {
  const raw = Env.get(key, defaultValue ?? "");
  try {
    return new URL(raw);
  } catch {
    throw new ConfigEnvInvalidError(key, `must be a valid URL, got: ${raw}`);
  }
};
```

Single source of truth for env resolution. `@stackra/support` becomes a required
peer of `@stackra/config`.

### 6.7 `shell-commands.md` — no for/while in tool-invoked commands

Every verification command in the task breakdown uses `pnpm --filter` /
`pnpm -r` / `xargs` / dedicated tools. No `for` / `while` loops in shell strings
handed to `execute_bash`.

---

## 7. Contracts additions

Following `contract-reexports.md`, `@stackra/contracts` holds cross-package
interfaces + types + tokens. `@stackra/config` imports them directly and never
re-exports.

### 7.1 New in `packages/contracts/src/`

```
interfaces/config/
├── config-service.interface.ts             # IConfigService
├── config-factory.interface.ts             # IConfigFactory<T>
├── config-factory-key-host.interface.ts    # IConfigFactoryKeyHost<T>
├── config-module-options.interface.ts      # IConfigModuleOptions<V>
├── config-module-async-options.interface.ts # IConfigModuleAsyncOptions
├── config-get-options.interface.ts         # IConfigGetOptions
├── conditional-module-options.interface.ts # IConditionalModuleOptions
├── config-change-event.interface.ts        # IConfigChangeEvent (v0.2, ships as type stub in v0.1)
└── index.ts

types/config/
├── config-object.type.ts                   # ConfigObject
├── no-infer-type.type.ts                   # NoInferType<T>
├── path.type.ts                            # Path<T>
├── path-value.type.ts                      # PathValue<T, P>
├── parser.type.ts                          # Parser
└── index.ts

tokens/
├── config.tokens.ts                        # CONFIGURATION_TOKEN, CONFIGURATION_SERVICE_TOKEN, CONFIGURATION_LOADER, VALIDATED_ENV_LOADER, VALIDATED_ENV_PROPNAME
```

Barrel through:

- `contracts/src/interfaces/config/index.ts` →
  `contracts/src/interfaces/index.ts`
- `contracts/src/types/config/index.ts` → `contracts/src/types/index.ts`
- `contracts/src/tokens/config.tokens.ts` → `contracts/src/tokens/index.ts`

### 7.2 Deleted from `packages/contracts/src/tokens/` (Task 3)

- `CACHE_CONFIG` — was `packages/contracts/src/tokens/cache.tokens.ts`
- `QUEUE_CONFIG`
- `NETWORK_CONFIG`
- `EVENTS_CONFIG`
- `LOGGER_CONFIG`
- `SSR_CONFIG`
- `APPLICATION_CONFIG` (kept, used internally by `@stackra/container` — see
  below)

Each package that used to bind under one of these tokens now binds under a
**private, package-internal symbol** (`Symbol('cache-config-internal')`) that is
never exported. Consumers who need the config value inject via
`@Inject(cacheConfig.KEY)` at the app level.

**`APPLICATION_CONFIG` is a special case** — `@stackra/container` uses it for
`ApplicationFactory.create(AppModule, applicationConfig)` bootstrapping and that
flow doesn't go through ConfigModule. Keep it in contracts.

---

## 8. File tree

```
packages/config/
├── src/core/
│   ├── config.module.ts                              # ConfigModule.forRoot/forFeature/envVariablesLoaded
│   ├── config-host.module.ts                         # internal host module (nestjs pattern)
│   ├── conditional.module.ts                         # ConditionalModule.registerWhen
│   │
│   ├── constants/
│   │   ├── configuration-token.constant.ts           # CONFIGURATION_TOKEN Symbol export
│   │   ├── configuration-service-token.constant.ts
│   │   ├── configuration-loader.constant.ts
│   │   ├── validated-env-loader.constant.ts
│   │   ├── validated-env-propname.constant.ts
│   │   ├── partial-configuration-key.constant.ts
│   │   ├── partial-configuration-propname.constant.ts
│   │   ├── as-provider-method-key.constant.ts
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── config.error.ts                           # base
│   │   ├── config-missing-key.error.ts
│   │   ├── config-readonly.error.ts
│   │   ├── config-validation.error.ts
│   │   ├── config-env-missing.error.ts
│   │   ├── config-env-invalid.error.ts
│   │   └── index.ts
│   │
│   ├── interfaces/                                   # package-internal shapes only
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── config.service.ts                         # get / getOrThrow / set / describe
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── register-as.util.ts                       # registerAs + ConfigFactoryKeyHost impl
│   │   ├── get-config-token.util.ts                  # 'CONFIGURATION(namespace)' derivation
│   │   ├── get-registration-token.util.ts            # internal: read token off factory
│   │   ├── create-config-provider.util.ts            # internal: builds provider for factory
│   │   ├── merge-config-object.util.ts               # internal: nestjs's partial merge
│   │   ├── get-nested-value.util.ts                  # dotted-path get (replaces es-toolkit)
│   │   ├── set-nested-value.util.ts                  # dotted-path set
│   │   ├── has-nested-value.util.ts                  # dotted-path has
│   │   ├── env.util.ts                               # env + env.number + env.bool + env.orFail + env.enum + env.url
│   │   ├── default-parser.util.ts                    # dotenv parser wrapper (Node-only)
│   │   ├── load-env-file.util.ts                     # Node-only, guarded
│   │   ├── is-node.util.ts                           # runtime detection
│   │   ├── define-config.util.ts                     # DEPRECATED alias — re-exports registerAs
│   │   └── index.ts
│   │
│   └── index.ts                                      # root barrel
│
├── config/
│   └── config.config.ts                              # consumer template
│
├── __tests__/
│   ├── vitest.setup.ts
│   ├── unit/
│   │   ├── register-as.spec.ts
│   │   ├── config-service.spec.ts
│   │   ├── config-service-describe.spec.ts
│   │   ├── config-module.spec.ts
│   │   ├── config-module-validation.spec.ts
│   │   ├── conditional-module.spec.ts
│   │   ├── env.spec.ts
│   │   ├── env-enum.spec.ts
│   │   ├── env-url.spec.ts
│   │   ├── nested-value.spec.ts
│   │   ├── deprecation-shim.spec.ts
│   │   └── errors.spec.ts
│   └── integration/
│       └── full-bootstrap.spec.ts                    # AppModule with 2 modules + assertions
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── LICENSE                                           # MIT with combined copyright
├── NOTICE                                            # nestjs attribution
└── README.md                                         # full API + migration guide
```

---

## 9. Consumer patterns

### 9.1 Pattern A — registerAs + forRoot load (canonical)

```typescript
// apps/dashboard/src/config/cache.config.ts
import { registerAs, env } from "@stackra/config";
import type { ICacheModuleConfig } from "@stackra/cache";

export const cacheConfig = registerAs<ICacheModuleConfig>("cache", () => ({
  default: env("CACHE_STORE", "memory"),
  ttl: env.number("CACHE_TTL", 3600),
  prefix: env("CACHE_PREFIX", "app:"),
  stores: {
    memory: { driver: "memory" },
  },
}));
```

### 9.2 Pattern B — AppModule wires everything

```typescript
// apps/dashboard/src/app.module.ts
import { Module } from "@stackra/container";
import { ConfigModule } from "@stackra/config";
import { CacheModule } from "@stackra/cache";

import { cacheConfig } from "@/config/cache.config";
import { networkConfig } from "@/config/network.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cacheConfig, networkConfig],
      cache: true,
    }),

    // .asProvider() feeds the tagged factory into <X>Module.forRootAsync
    CacheModule.forRootAsync(cacheConfig.asProvider()),
    NetworkModule.forRootAsync(networkConfig.asProvider()),
  ],
})
export class AppModule {}
```

### 9.3 Pattern C — Consuming inside a service (typed)

```typescript
import { Injectable, Inject } from "@stackra/container";
import type { ConfigType } from "@stackra/config";

import { cacheConfig } from "@/config/cache.config";

@Injectable()
class CacheDebugger {
  public constructor(
    @Inject(cacheConfig.KEY)
    private readonly cfg: ConfigType<typeof cacheConfig>,
  ) {}

  public dump(): void {
    console.log(this.cfg.prefix, this.cfg.ttl);
  }
}
```

### 9.4 Pattern D — Dynamic key lookup via ConfigService

```typescript
import { Injectable } from "@stackra/container";
import { ConfigService } from "@stackra/config";

@Injectable()
class FeatureFlags {
  public constructor(private readonly config: ConfigService) {}

  public useNewCache(): boolean {
    return this.config.get<string>("cache.prefix", "").startsWith("beta:");
  }

  public port(): number {
    return this.config.getOrThrow<number>("port");
  }
}
```

### 9.5 Pattern E — Conditional module loading

```typescript
import { ConditionalModule } from '@stackra/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Env-var name form — loads when USE_REDIS is truthy
    ConditionalModule.registerWhen(RedisCacheModule, 'USE_REDIS'),

    // Predicate form — loads when SENTRY_DSN is set
    ConditionalModule.registerWhen(SentryModule, (env) => !!env['SENTRY_DSN']),
  ],
})
```

### 9.6 Pattern F — With Joi validation (opt-in)

```typescript
// apps/dashboard/src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
});

// apps/dashboard/src/app.module.ts
import { envValidationSchema } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [cacheConfig, networkConfig],
    }),
  ],
})
```

### 9.7 Pattern G — With custom validate function (Zod / valibot / hand-rolled)

```typescript
// apps/dashboard/src/config/env.validation.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
});

export function validate(raw: Record<string, unknown>) {
  return EnvSchema.parse(raw);
}

// apps/dashboard/src/app.module.ts
import { validate } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,   // any function; no framework commitment to Joi
      load: [cacheConfig],
    }),
  ],
})
```

---

## 10. Task breakdown

Sequenced. Each task is independently verifiable — build + typecheck + test must
pass before moving on.

### Task 0 — Steering prerequisite

- Update `.kiro/steering/package-conventions.md`:
  - Replace the "Config trio" section with a "Config factory" section for
    `@stackra/config`-adopting packages
  - Preserve the legacy trio note for packages that haven't migrated yet
  - Reference `.kiro/specs/stackra-config-package/PLAN.md`
- Skipping changesets install per user's earlier signal (deferred; separate
  concern)
- No new workspace deps required

### Task 1 — Contracts additions

Add every interface + type + token from §7 to `@stackra/contracts`:

- `interfaces/config/*.interface.ts` (7 files)
- `types/config/*.type.ts` (5 files)
- `tokens/config.tokens.ts` (5 exports)
- Barrel through the parent `index.ts` at each level
- **Do NOT yet delete** the per-package `<X>_CONFIG` tokens — Task 3 handles
  that as a coordinated sweep with the module refactor
- Unit tests: token uniqueness, `Path<T>` type spec (`.d.ts` type-test file)

Verify: `pnpm --filter @stackra/contracts typecheck / build / test`

### Task 2 — Build `@stackra/config` v0.1.0

Delegate to `framework-core-builder` with absolute paths under
`/Users/akouta/Projects/academorix-frontend/` (the agent is hardcoded to
`/Users/akouta/Projects/academorix-frontend/` — always pass absolute paths).

Scope:

- Fork `.ref/config-master/lib/*` into `packages/config/src/core/*`
- Import-path swaps:
  - `@nestjs/common` → `@stackra/container` (`@Injectable`, `@Inject`,
    `@Optional`, `@Module`, `DynamicModule`, `Type`)
  - `@nestjs/common/interfaces` → `@stackra/contracts`
  - `@nestjs/common/utils/shared.utils` → inline the tiny helpers
    (`isUndefined`, `isObject` are 3 lines each)
  - `es-toolkit/compat/{get,set,has}` → our nested-value utils
  - `rxjs.Subject` → drop; remove `changes$` from ConfigService
- Split multi-export nestjs files into one-export-per-file per our
  `code-standards.md`
- Add our extensions (§3.2):
  - `env.util.ts` with 6 method attachments
  - `ConfigService.describe()` method
  - Base `ConfigError` + 5 subclass files
- Follow every steering rule:
  - Top-of-file docblock on every file (`@file` / `@module` / `@description` /
    `@derived` for forked files)
  - JSDoc on every export with `@param` / `@returns` / `@throws` / `@example` as
    applicable
  - Inline comments on non-obvious flow, fail-soft paths, ordering constraints
  - `createSeedLoader` for the `CONFIGURATION_LOADER` provider
  - `env()` wraps `Env` from `@stackra/support`
- `NOTICE` file at package root crediting Kamil Myśliwiec + NestJS team
- `LICENSE` (MIT) with combined copyright
- `README.md` with full API table + migration examples + credit block

Verify:

- `pnpm --filter @stackra/config typecheck / build / test`
- Runtime smoke test in the integration spec: bootstrap a TestModule that
  imports `ConfigModule.forRoot({ load: [testConfig], cache: true })`; assert
  `ConfigService.get('test.key')` returns the factory-produced value; assert
  `@Inject(testConfig.KEY)` in a downstream provider returns the same instance;
  assert `testConfig.asProvider()` returns an object with the expected
  `imports`/`useFactory`/`inject` shape

### Task 3 — Refactor 7 packages (kill DEFAULT_X_CONFIG + mergeConfig + `<X>_CONFIG` token)

For each of `cache`, `logger`, `network`, `queue`, `events`, `container`, `ssr`:

1. **Delete**
   `packages/<pkg>/src/core/constants/default-<pkg>-config.constant.ts`
2. **Delete or rename** `packages/<pkg>/src/core/utils/merge-config.util.ts`:
   - If the merge was purely `{ ...DEFAULT, ...user }`: **delete**
   - If normalization work exists (prune `enabled: false`, filter `stack`): move
     into the manager as a private `normalizeConfig(input)` method, called from
     the manager's constructor
3. **Delete** the `<PKG>_CONFIG` token from
   `packages/contracts/src/tokens/<pkg>.tokens.ts`
4. **Refactor** `<X>Module.forRoot(config)`:
   - Remove `mergeConfig` call
   - Remove `DEFAULT_<X>_CONFIG` fallback (if `config` is undefined, error out
     with a clear "@stackra/<pkg>: pass a config object or a `.asProvider()`
     result" message)
   - Store the config in a **private internal symbol**
     (`Symbol('cache-config-internal')`) — not exported, only the manager reads
     it
5. **Add** `<X>Module.forRootAsync(options: IConfigModuleAsyncOptions)`:
   - Accepts either the traditional `{ useFactory, inject, imports }` form OR
     the `.asProvider()` output shape (identical)
6. **Update** package `README.md` migration section

Verify (per package):

- Package tests pass
- `pnpm --filter @stackra/<pkg> typecheck / build / test`

Cross-package smoke test (new spec file):

- Bootstrap `AppModule` with 2 modules
  (`CacheModule.forRootAsync(cacheConfig.asProvider())`
  - `NetworkModule.forRootAsync(networkConfig.asProvider())`)
- Assert both configs land in `ConfigService.get('cache')` /
  `ConfigService.get('network')` respectively
- Assert the manager's private token is not enumerable via `Reflect.ownKeys`
  from outside the package

### Task 4 — Deprecation shims

Per package (`cache`, `logger`, `network`, `queue`, `events`, `container`,
`ssr`):

- Rewrite `packages/<pkg>/src/core/utils/define-config.util.ts` (or
  `src/core/server/utils/define-config.util.ts` for ssr) to a deprecation shim:
  ```typescript
  /**
   * @file define-config.util.ts
   * @module @stackra/<pkg>/core/utils
   * @description DEPRECATED — use `registerAs` from `@stackra/config` instead.
   *   This alias re-exports registerAs for one deprecation cycle and will be
   *   removed in v0.2.
   */

  import { registerAs } from "@stackra/config";

  let warned = false;

  /**
   * @deprecated Use `registerAs` from `@stackra/config` instead. Will be removed in v0.2.
   */
  export function defineConfig<T>(config: T): T {
    if (!warned) {
      console.warn(
        "[@stackra/<pkg>] defineConfig is deprecated; import registerAs from @stackra/config instead.",
      );
      warned = true;
    }
    return config;
  }

  export { registerAs };
  ```
- `@stackra/support`: same treatment for `define-config.util.ts` +
  `create-define-config.util.ts`

Verify: each package's tests still pass; snapshot test asserts `console.warn`
fires once per module load.

### Task 5 — Migrate `apps/dashboard/src/config/*.config.ts` + `app.module.ts`

Per config file (`application`, `container`, `cache`, `events`, `network`,
`queue`, `ssr`):

- Import from `@stackra/config` instead of the per-package alias
- Wrap the factory in `registerAs('<name>', () => ({...}))`
- Replace env access:
  - `process.env.X ?? default` → `env('X', default)`
  - `parseInt(process.env.PORT, 10) || 3000` → `env.number('PORT', 3000)`
  - `process.env.DEBUG === 'true'` → `env.bool('DEBUG', false)`
  - `process.env.NODE_ENV === 'production'` (build-time constant) — flag with
    `// FIXME` comment; `env.bool` at runtime prevents tree-shaking of dev
    branches. Keep `import.meta.env.DEV` for dev-only guards; use `env()` for
    genuinely dynamic values

`apps/dashboard/src/app.module.ts`:

- Add
  `ConfigModule.forRoot({ isGlobal: true, load: [applicationConfig, ...], cache: true })`
  as first import
- Convert each `<X>Module.forRoot(xConfig)` →
  `<X>Module.forRootAsync(xConfig.asProvider())`

`apps/dashboard/package.json`:

- Add `"@stackra/config": "workspace:*"` to dependencies

Verify:

- `pnpm --filter @academorix/dashboard typecheck` clean
- `pnpm --filter @academorix/dashboard build` succeeds
- Runtime smoke: Vite dev server boots; `ApplicationFactory.create(AppModule)`
  succeeds; `ConfigService.get('cache.prefix')` returns the overridden value

### Task 6 — Steering + docs

- Update `.kiro/steering/package-conventions.md`:
  - "Config trio" section → "Config factory" section (see §6.2 above)
  - Reference this PLAN.md
- Add `README.md` for `@stackra/config`:
  - Full API surface table (mirrors `@stackra/vite`'s README shape)
  - Migration examples (before/after)
  - Consumer patterns A–G
  - Nestjs attribution + credit block
- Update each of the 7 packages' `README.md`:
  - Add migration note: "Config handling has moved to `@stackra/config`. See
    `.kiro/specs/stackra-config-package/PLAN.md` §9 for patterns."
  - Remove the "config trio" reference from the docs

### Task 7 — Final verification + report

- `pnpm -r typecheck` (all packages)
- `pnpm -r build` (all packages)
- `pnpm -r test` (all packages)
- Cross-package integration spec passes
- Report every file touched by every task
- List pre-existing failures unrelated to the sweep:
  - `container/cache/queue` devtools-panel specs (pending `@stackra/devtools`
    promotion — reference removed code)
  - `packages/old/notifications` + `packages/old/realtime` missing
    `@types/react`
  - Workspace-wide `pnpm install` blocked by pre-existing dangling refs
- Publish plan for `@stackra/config@0.1.0` if release is desired (deferred
  pending changesets infrastructure decision)

---

## 11. Testing strategy

**Per-file unit specs in `packages/config/__tests__/unit/`:**

| Spec                               | Covers                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register-as.spec.ts`              | factory registration, `.KEY` set + non-enumerable, `.asProvider()` shape, namespace token uniqueness across bundle boundaries (`Symbol.for` semantics)              |
| `config-service.spec.ts`           | 4 `get()` overloads, 4 `getOrThrow()` overloads, `set()` writes to internal config + process.env (Node) / internal only (browser), dotted paths, cache behavior     |
| `config-service-describe.spec.ts`  | full snapshot, redaction with regex patterns                                                                                                                        |
| `config-module.spec.ts`            | `forRoot` provider tree, `forRoot` with `load: [...]`, `forRoot({ cache: true })`, `forFeature` registration, `envVariablesLoaded` promise resolves after `forRoot` |
| `config-module-validation.spec.ts` | `forRoot({ validate })` with Zod, `forRoot({ validationSchema })` with Joi, both success + failure paths                                                            |
| `conditional-module.spec.ts`       | env-string form, function-predicate form, timeout behavior, both loaded + skipped branches                                                                          |
| `env.spec.ts`                      | three-source resolution, `env.number` NaN handling, `env.bool` truthy list, `env.orFail` throws with descriptive message                                            |
| `env-enum.spec.ts`                 | valid value passes, invalid value throws `ConfigEnvInvalidError`, default fallback                                                                                  |
| `env-url.spec.ts`                  | valid URL parses, invalid URL throws `ConfigEnvInvalidError`                                                                                                        |
| `nested-value.spec.ts`             | get/set/has with dotted paths, array indexes, missing intermediates, `null` prototype safety                                                                        |
| `deprecation-shim.spec.ts`         | old `defineConfig` from `@stackra/cache` (and 6 others) re-exports registerAs, emits `console.warn` once                                                            |
| `errors.spec.ts`                   | Every error class extends `ConfigError`; `code` property matches expected values; `instanceof ConfigError` catches all                                              |

**Cross-package integration** in
`packages/config/__tests__/integration/full-bootstrap.spec.ts`:

- Bootstraps `AppModule` with
  `ConfigModule.forRoot({ load: [testConfig1, testConfig2] })`
  - `CacheModule.forRootAsync(testConfig1.asProvider())` +
    `NetworkModule.forRootAsync(testConfig2.asProvider())`
- Asserts `ConfigService.get('test1')` and `ConfigService.get('test2')` both
  return factory-produced values
- Asserts `@Inject(testConfig1.KEY)` resolves to the same instance in a
  downstream provider
- Asserts `<X>Module`'s internal binding is a `Symbol` that is not enumerable
  via `Reflect.ownKeys` from outside the package boundary

**Per-consumer smoke** — after Task 5:

- `apps/dashboard` boots via Vite dev server
- `apps/dashboard` browser bundle builds without `fs` / `dotenv` errors
- `ApplicationFactory.create(AppModule)` completes; every downstream module
  resolves

---

## 12. Migration guide (consumer-facing)

**Before (per-package `defineConfig`):**

```typescript
// apps/dashboard/src/config/cache.config.ts
import { defineConfig } from '@stackra/cache';

export default defineConfig({
  default: 'memory',
  stores: { memory: { driver: 'memory' } },
  prefix: 'app:',
  ttl: 3600,
});

// apps/dashboard/src/app.module.ts
import cacheConfig from '@/config/cache.config';

@Module({
  imports: [CacheModule.forRoot(cacheConfig)],
})
```

**After (`@stackra/config`):**

```typescript
// apps/dashboard/src/config/cache.config.ts
import { registerAs, env } from '@stackra/config';
import type { ICacheModuleConfig } from '@stackra/cache';

export const cacheConfig = registerAs<ICacheModuleConfig>('cache', () => ({
  default: env('CACHE_STORE', 'memory'),
  ttl: env.number('CACHE_TTL', 3600),
  prefix: env('CACHE_PREFIX', 'app:'),
  stores: {
    memory: { driver: 'memory' },
  },
}));

// apps/dashboard/src/app.module.ts
import { ConfigModule } from '@stackra/config';
import { cacheConfig } from '@/config/cache.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [cacheConfig], cache: true }),
    CacheModule.forRootAsync(cacheConfig.asProvider()),
  ],
})
```

**Env-var access:**

```typescript
// Before                                    // After
process.env.APP_NAME ?? 'Stackra'          → env('APP_NAME', 'Stackra')
parseInt(process.env.PORT, 10) || 3000     → env.number('PORT', 3000)
process.env.TRUST_PROXY === 'true'         → env.bool('TRUST_PROXY', false)
process.env.NODE_ENV                        → env.enum('NODE_ENV', ['development','production','test'], 'development')
```

**Consuming inside a service:**

```typescript
// Before
@Inject(CACHE_CONFIG) private readonly cfg: ICacheModuleConfig

// After
@Inject(cacheConfig.KEY) private readonly cfg: ConfigType<typeof cacheConfig>
```

---

## 13. Rollout risks + mitigations

| Risk                                                                               | Likelihood        | Mitigation                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Downstream apps still on the old `defineConfig` import                             | High              | Deprecation shim keeps old import path working for one release cycle; `console.warn` tells devs to migrate                                                                                                 |
| Vite browser build fails because forked code references `fs`                       | Medium            | `isNode()` guard on file-load path; dynamic imports; `fs` / `dotenv` marked as external in `tsup.config.ts` and only imported inside the guarded branch                                                    |
| Bundle size increase from `@stackra/config` in every app                           | Low               | Tree-shakable; ConfigService + registerAs alone are ~5KB gz; validation deps (Joi) are optional peer                                                                                                       |
| Consumers pass a plain object to `forRoot` and lose `ConfigService.get` visibility | Medium            | Document Pattern A (registerAs + load) as canonical; Pattern B (`asProvider()`) links `<X>Module.forRootAsync` to ConfigService; plain-object form for `<X>Module.forRoot` still works but is second-class |
| `.asProvider()` output shape drifts from nestjs                                    | Low               | Snapshot test on exact object shape; documented as MIT-derived API                                                                                                                                         |
| MIT attribution missing                                                            | Low               | `NOTICE` file at package root + per-file `@derived` JSDoc tag on every forked source file + README credit block                                                                                            |
| Managers that relied on `mergeConfig` pre-filtering break in Task 3                | Medium            | Move pruning logic into each affected manager's constructor as private `normalizeConfig`; add regression tests before deleting the util                                                                    |
| Contracts breaking: `<X>_CONFIG` tokens deleted                                    | High (major bump) | Coordinated release; Task 3 is atomic across contracts + 7 packages; consumer migration guide covers every affected token                                                                                  |
| Node-only deps (`dotenv`, `dotenv-expand`) leak into browser bundle                | Medium            | External in `tsup.config.ts`; `import('dotenv')` inside `isNode()` guard uses dynamic import so bundler doesn't statically include                                                                         |
| Overload resolution ambiguity in `registerAs`                                      | None              | Only one signature: `registerAs<T>(token, factory)`. No overload landmine (nestjs's cleaner design).                                                                                                       |
| `rxjs` peer required transitively                                                  | None              | Dropped `changes$` for v0.1; no rxjs import anywhere in `@stackra/config`                                                                                                                                  |

---

## 14. Open questions

Resolve before / during Task 2:

1. **`skipProcessEnv` default** — nestjs defaults `false`. We keep same for
   compat.

2. **`envFilePath` default** — nestjs defaults `resolve(process.cwd(), '.env')`.
   In browser this is undefined behavior; in Node it's fine. Guard behind
   `isNode()` and skip in browser.

3. **`override` default** — nestjs defaults `false` (env-file values do NOT
   override `process.env`). We keep same.

4. **`validatePredefined` default** — nestjs defaults `true` (validates
   pre-existing `process.env` variables). We keep same.

5. **`ConfigType<typeof cfg>` inference edge case** — when the factory returns a
   `Promise<T>`, `ReturnType` gives `Promise<T>`. nestjs handles this by having
   `.asProvider()`'s inject signature expect the awaited value. Confirm during
   implementation.

6. **`ConfigService<K, WasValidated>` full generics — worth the type complexity
   in v0.1?** Yes — this IS the DX win from nestjs. Ship it.

7. **Joi as devDep vs optional peer?** nestjs peers Joi at runtime. We do the
   same: consumer installs `joi` if they use `validationSchema`, otherwise
   `validate` function form works with any library (Zod, valibot,
   class-validator, hand-rolled). Zero framework commitment.

---

## 15. Future work (v0.2+)

Ordered by likely priority:

1. **Vite plugin** — build-time namespace autocomplete (scan
   `registerAs('X', ...)` calls, emit typed union of registered namespaces);
   compile-time collision detection; auto-load `src/config/**/*.config.ts` and
   inject as `virtual:@stackra/config/registry`.
2. **`changes$` observable stream** — either `rxjs.Subject` (adds rxjs peer) or
   lightweight EventEmitter (matches `@stackra/events`). Decision deferred.
3. **Doppler secrets driver** — first-class Doppler integration with lazy
   revelation + audit logging + `Doppler`-specific caching.
4. **HTTP config driver** — remote config over `fetch`. Pair with
   `forRootAsync`.
5. **React hooks subpath** — `useConfig()` / `useConfigValue(key)` /
   `useConfigAsync(factory)`.
6. **NestJS-compat subpath** — for consumers who bring their NestJS app into the
   workspace and want full API parity (drop-in swap of `@nestjs/config`).
7. **Native subpath** — React Native drivers (AsyncStorage, ExpoConstants,
   BundledConfig).
8. **CLI init** — `pnpm dlx @stackra/config init` scaffolds
   `src/config/*.config.ts` files from workspace templates.
9. **Config schema JSON export** — build-time helper emitting every registered
   namespace's shape as JSON Schema for IDE hints + GitOps + Doppler tooling.
10. **`ConditionalModule` timeout customization** — currently 5s default; expose
    via `ConfigModule.forRoot({ conditionalTimeout: 10_000 })`.

Each future item lands as a subpath (`@stackra/config/vite`,
`@stackra/config/react`, `@stackra/config/nestjs`, ...) with its own peer deps —
never bloating the core surface.

---

## Verdict

Ready to build. Task 0 (steering update) proceeds in parallel with Task 1
(contracts). Task 2 (fork-and-adapt build) via `framework-core-builder` waits
for user approval since it's the biggest work item.

---

## Appendix A — Why the earlier custom-design v1 plan is discarded

The v1 plan (custom `defineConfig` with symbol tagging + `<X>Module.forRoot`
auto-registration) was reviewed by two agents and returned 7 P0 issues + 10 P1
issues. Every P0 the reviewers flagged is solved by adopting `@nestjs/config`'s
design:

| P0 in v1 plan                                                           | How v2 (fork-and-adapt) solves it                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Overload ambiguity (`T extends object` matches functions)               | `registerAs(token, factory)` is factory-only — one signature                                                                        |
| `mergeConfig` split-brain (merged vs. tagged raw)                       | Killed `mergeConfig` entirely; factory IS the config; `ConfigService.get` and `@Inject(cfg.KEY)` return the same value              |
| Unspreadable proxy from `injectConfig(cfg)`                             | `ConfigService.get()` returns a real value; `@Inject(cfg.KEY)` returns a real value; spread/`Object.keys`/`JSON.stringify` all work |
| `<X>Module.forFeature` sentinel `useFactory` violates lifecycle         | `createSeedLoader` + `seedLoaderToken` from `@stackra/support` used for the `CONFIGURATION_LOADER` provider                         |
| Auto-registration coupling forces every module to import `getConfigKey` | Killed auto-registration; `.asProvider()` is explicit per module                                                                    |
| Missing `DEFAULT_CONFIG_MODULE_OPTIONS` per package-conventions         | Config trio replaced by config factory pattern; steering doc updates in Task 6                                                      |
| `@stackra/config` re-exports contracts                                  | Zero re-exports; consumers import types from `@stackra/contracts` directly                                                          |

The four load-bearing decisions from v1 (single unified helper, symbol-based
tag, no Zod as framework peer, kill per-package `defineConfig`) all survive in
v2 — but the implementation is battle-tested rather than custom.
