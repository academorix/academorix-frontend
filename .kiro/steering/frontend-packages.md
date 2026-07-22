---
inclusion: fileMatch
fileMatchPattern: "packages/framework/**/{composer.json,README.md,src/**/*.php}"
---

# Frontend package mirror — backend → frontend one-to-one

> **ADR anchor.** This steering codifies
> [ADR-0023](../../docs/adr/0023-frontend-package-architecture.md) — Frontend
> package architecture: DI-first mirror of backend, no refine.dev. Every rule
> below is enforceable; change the rule means amending the ADR.

Every backend framework package under `packages/framework/*` gets a matching
TypeScript + React package at `packages/frontend/<name>/`. The frontend package
is created **after** the backend package is diagnostics-clean and its SDK
sibling ships stable wire-visible DTOs. Never colocate a `/react` folder inside
a backend package.

Reference implementation: `stackra/feature-flags` (backend) ↔
`@stackra/feature-flags` (frontend).

## 1. Naming and location

| Backend                            | Frontend                                    |
| ---------------------------------- | ------------------------------------------- |
| Composer: `stackra/<name>`         | npm: `@stackra/<name>`                      |
| Path: `packages/framework/<name>/` | Path: `packages/frontend/<name>/`           |
| PHP namespace: `Stackra\<Name>`    | TS exports: `@stackra/<name>` barrel        |
| SDK sibling: `sdk/` (Saloon)       | Consumer of that SDK: this frontend package |

Directory name matches on both sides (kebab-case). Register the package in the
workspace root's `pnpm-workspace.yaml` under the
`packages: - "packages/frontend/*"` glob — no config change needed for a new
package as long as it lives at the top level of `packages/frontend/`.

## 2. Canonical file structure

```
packages/frontend/<name>/
├── package.json                  ← "@stackra/<name>"
├── tsconfig.json                 ← extends monorepo tsconfig.base.json
├── vitest.config.ts              ← extends @stackra/testing/preset
├── README.md
├── src/
│   ├── index.ts                  ← public API barrel
│   ├── types/                    ← TS mirrors of backend SDK Data classes
│   ├── enums/                    ← TS mirrors of backend enums
│   ├── api/                      ← HTTP client per bounded context
│   ├── hooks/                    ← React Query hooks (queries + mutations)
│   ├── components/               ← HeroUI-native, compound where multi-facet
│   ├── context/                  ← Provider for the hot-path (boot-payload) reads
│   ├── utils/                    ← Pure functions, algorithm parity with backend
│   └── testing/                  ← TestProvider + mock API for downstream tests
└── __tests__/
    ├── utils/                    ← Property tests for algorithm parity
    ├── components/               ← Component tests
    └── hooks/                    ← Hook tests
```

## 3. Wire contract — types and enums

TypeScript types are direct mirrors of the backend SDK's Spatie Data classes at
`packages/framework/<name>/sdk/src/Data/*Data.php`. Field names are camelCase on
the TS side (matches the wire's `MapOutputName(SnakeCaseMapper::class)` output).

Hand-author on the first frontend package for a domain. Migrate to OpenAPI
generation (Scramble emits the schema from the routing attributes) once the
frontend consumes 3+ backend packages — the cost of hand-syncing crosses the
break-even at that point.

Enums use TypeScript const objects + literal-union types (never `enum {}` — poor
tree-shaking, poor union inference):

```typescript
export const FlagKind = {
  KillSwitch: "kill_switch",
  Override: "override",
  Rollout: "rollout",
  PlanGate: "plan_gate",
} as const;
export type FlagKind = (typeof FlagKind)[keyof typeof FlagKind];
```

Backing values match the PHP enum exactly. A change in one side breaks the
parity test in the frontend `__tests__/enums/` folder.

## 4. API client — HTTP surface

One file per bounded context under `src/api/`. Each file:

- imports a shared `client.ts` (ky or Axios wrapper — check
  `packages/foundation/container/` for the existing HTTP client before adding a
  new dependency)
- exports one function per backend endpoint
- typed by the DTOs in `src/types/`

Example:

```typescript
// src/api/overrides.ts
import type { FeatureOverrideData } from "../types";
import { client } from "./client";

export const listOverrides = () =>
  client.get<FeatureOverrideData[]>("/api/v1/feature-flags/overrides");
```

Naming mirrors the backend Saloon requests
(`sdk/src/Saloon/Overrides/CreateOverrideRequest.php` ↔
`api/overrides.ts:createOverride()`).

## 5. React Query hooks

`@tanstack/react-query` for every server-state call. Queries use `use<Noun>`,
mutations use `useCreate<Noun>` / `useUpdate<Noun>` / `useDelete<Noun>`. Every
mutation invalidates the matching query key on success.

Query keys follow the pattern `[<package-name>, <resource>, ...args]`:

```typescript
export const featureFlagsKeys = {
  all: ["feature-flags"] as const,
  overrides: () => [...featureFlagsKeys.all, "overrides"] as const,
  override: (id: string) => [...featureFlagsKeys.overrides(), id] as const,
} as const;
```

## 6. Hot-path consumer hook + context provider

Every consumer package that ships a "check this thing" hook follows the same
shape:

- A `<Provider>` component reads the boot payload once from `GET /api/v1/me` and
  populates a React context.
- A `useFeature(name)` (or equivalent) hook reads from that context — **no HTTP
  per check**. That's the whole point of the boot payload contract on the
  backend.
- A fallback `useFeatureResolution(name)` hook makes a live
  `GET /api/v1/me/features` call for diagnostic paths.

Never make the fast path do HTTP. The backend `BootPayloadContributor` exists
precisely to eliminate per-check requests.

## 7. Compound components — HeroUI-native

Consumer-facing components use the HeroUI compound-component pattern when the
component has multiple children slots:

```tsx
<FeatureGate flag="billing.new_flow">
  <FeatureGate.Show>
    <NewBillingCheckout />
  </FeatureGate.Show>
  <FeatureGate.Fallback>
    <LegacyCheckout />
  </FeatureGate.Fallback>
</FeatureGate>
```

Single-file when the component has one visual output (`<FlagBadge>`,
`<RolloutSlider>`, `<KillSwitchToggle>`).

Never ship your own design system — compose HeroUI primitives (`Button`, `Chip`,
`Card`, `Table`, `Slider`, `Switch`) from `@heroui/react`.

## 8. Algorithm parity

When the backend ships a pure algorithm (`RolloutHasher::bucket`,
`ScopePath::deepestLevel`, `FeatureResolution` value semantics), the frontend
ships a byte-for-byte-identical implementation.

Every parity implementation has a property test in `__tests__/utils/` that:

- snapshots a set of `(input, output)` pairs generated by the backend
- runs the frontend implementation on the same inputs
- asserts strict equality

If backend and frontend ever diverge on a pure algorithm, the resolver decision
diverges and every downstream cache is poisoned. Property tests are the only
defence.

## 9. Testing surface

Every consumer-facing package ships a `testing/` module:

- `Test<Name>Provider` — replaces the real provider with an in-memory
  implementation for consumer tests
- `mockApi.ts` — MSW handlers or a plain object mock

Downstream apps import from `@stackra/<name>/testing`:

```typescript
// consumer app test
import { TestFeatureFlagsProvider } from '@stackra/feature-flags/testing';

render(
  <TestFeatureFlagsProvider flags={{ 'billing.new_flow': true }}>
    <CheckoutPage />
  </TestFeatureFlagsProvider>
);
```

The testing entry point is exported from `package.json` under `./testing` so it
tree-shakes out of production bundles.

## 10. Order of operations

1. **Backend package is diagnostics-clean and the SDK sibling ships stable Data
   classes.** No frontend work before this.
2. **Author the frontend package's types + enums first.** Import nothing from
   the backend repo. TS mirrors are the wire contract.
3. **Ship the API client second.** Just typed HTTP wrappers.
4. **Provider + hot-path hook third.** Context reads boot payload.
5. **Compound components fourth.** Consumer-facing UI on top of HeroUI
   primitives.
6. **Admin surface last** (list / create / update / delete tables
   - forms). Admin consumes React Query hooks defined earlier.
7. **Testing utilities as you go.** Every new hook / component ships with a
   corresponding testing helper.

## 11. Anti-patterns

| Anti-pattern                                             | Correct                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/react` folder inside a backend package                 | Frontend package at `packages/frontend/<name>/`                        |
| TypeScript `enum {}`                                     | `const {} as const` + literal-union type                               |
| `fetch()` per `useFeature()` call                        | Read from context populated by boot payload                            |
| Custom design system components                          | Compose `@heroui/react` primitives                                     |
| Duplicating validation rules from Spatie Data attributes | Trust the server; surface server errors in the UI                      |
| Hand-syncing types across 3+ packages                    | OpenAPI generation via Scramble                                        |
| Query key strings                                        | Typed query-key factories (`featureFlagsKeys.override(id)`)            |
| Mutation without invalidation                            | Every mutation invalidates its matching query key                      |
| Ad-hoc mocks in downstream tests                         | Import `Test<Name>Provider` + `mockApi` from `@stackra/<name>/testing` |
| Frontend algorithm without a parity test                 | Property test that snapshots backend outputs                           |

## 12. Package.json conventions

Match `packages/foundation/container/package.json` shape:

- `"main"` + `"types"` point to `./src/<barrel>/index.ts` (JIT mode — no `build`
  step; Vite / tsup compiles on demand from the consumer app)
- `"exports"` map every published entry (default barrel, `./testing`, `./utils`
  where relevant)
- `"sideEffects": false` for tree-shakeability
- Peer-dependencies for React, `@heroui/react`, `@tanstack/react-query` — never
  bundle them
- `"scripts"`: `build` (no-op / JIT), `typecheck` (`tsc --noEmit`), `test`
  (`vitest run`), `test:watch`, `test:coverage`

## 13. README shape

Every frontend package ships a README with:

- One-paragraph purpose statement
- Installation (in the monorepo it's already wired via `workspace:*`)
- Basic usage — one runnable example
- Hooks / components reference (auto-generatable from JSDoc)
- Testing section (how to mount `TestProvider` in downstream tests)
- Cross-reference to the backend package README

Keep prose tight — the same docblock discipline as the backend (minimal per-file
docblocks + focused prose in class docblocks).

## 14. File naming and layout conventions

Verified against `packages/frontend/ui/src/react/**`. Every new frontend package
must match this convention exactly. Reference files:

- Component:
  `packages/frontend/ui/src/react/components/pin-lock/pin-lock.component.tsx`
- Hook: `packages/frontend/ui/src/core/hooks/use-debounce/use-debounce.hook.ts`
- Provider:
  `packages/frontend/ui/src/react/providers/page-progress/page-progress.provider.tsx`
- Context:
  `packages/frontend/ui/src/react/contexts/page-progress/page-progress.context.ts`
- Interface:
  `packages/frontend/ui/src/react/components/pin-lock/pin-lock.interface.ts`

### 14.1 File-name shape — kebab-case with role suffix

Every source file's name is `<kebab-noun>.<role>.<ext>`:

| Role                       | Suffix       | Extension    |
| -------------------------- | ------------ | ------------ |
| React component            | `.component` | `.tsx`       |
| React hook                 | `.hook`      | `.ts`        |
| Context provider           | `.provider`  | `.tsx`       |
| React context              | `.context`   | `.ts`        |
| TypeScript interface       | `.interface` | `.ts`        |
| TypeScript type alias file | `.type`      | `.ts`        |
| Enum / literal-union table | `.enum`      | `.ts`        |
| Pure utility function      | `.util`      | `.ts`        |
| API client per domain      | `.api`       | `.ts`        |
| Test file                  | `.test`      | `.ts`/`.tsx` |

No `PascalCase.ts` files. No `camelCase.ts` files. All lowercase, words
separated by `-`.

### 14.2 Folder-per-thing — every named export lives in its own folder

Every component, hook, provider, context, and utility gets its own folder named
after the export. The folder contains the file(s) for that export plus an
`index.ts` barrel:

```
components/feature-gate/
├── feature-gate.component.tsx
├── feature-gate.interface.ts
└── index.ts                       ← barrel — exports the component + its props type

hooks/use-feature/
├── use-feature.hook.ts
├── use-feature.interface.ts       ← only when the hook has non-trivial types
└── index.ts

providers/feature-flags/
├── feature-flags.provider.tsx
├── feature-flags.interface.ts
└── index.ts

contexts/feature-flags/
├── feature-flags.context.ts
└── index.ts

utilities/rollout-hasher/
├── rollout-hasher.util.ts
└── index.ts
```

Single-file exports still get their own folder — the `index.ts` barrel is the
public boundary. That keeps consumer imports insulated from filename changes
(`import { useFeature } from '@stackra/feature-flags'`).

### 14.3 Folder names (plural at the collection level)

- `components/` — never `component/`
- `hooks/` — never `hook/`
- `providers/` — never `provider/`
- `contexts/` — never `context/`
- `utilities/` — never `utils/` or `util/`
- `types/` — never `type/`
- `enums/` — never `enum/`
- `api/` — never `apis/` (semantically singular — one API domain per file)
- `testing/` — the testing utilities barrel

Enums are the one exception to §14.2 — they stay **flat** under
`src/enums/<name>.enum.ts` because enums rarely grow interface siblings. Same
for types when the file is a pure interface/type declaration without a matching
runtime export (`src/types/<name>.interface.ts`).

### 14.4 Interface-name prefix rule

Data-shape interfaces get an `I` prefix (`IFeatureFlagData`,
`IPageProgressContextValue`). React component prop interfaces use a `Props`
suffix without the prefix (`FeatureGateProps`, `PinLockProps`).

### 14.5 Barrel discipline

- Every folder has an `index.ts` that re-exports every public symbol from the
  files in that folder.
- The `src/index.ts` root barrel re-exports every public folder.
- Never import from a file path — always import from the folder (which routes
  through the barrel):

  ```typescript
  // ❌ deep import
  import { FeatureGate } from "@/components/feature-gate/feature-gate.component";

  // ✅ folder import (routes through index.ts)
  import { FeatureGate } from "@/components/feature-gate";

  // ✅ package import (top-level barrel)
  import { FeatureGate } from "@stackra/feature-flags";
  ```

### 14.6 Anti-patterns

| Anti-pattern                                                           | Correct                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `FeatureGate.tsx` at the top level of `components/`                    | `components/feature-gate/feature-gate.component.tsx` + `index.ts`     |
| `useFeature.ts` at the top level of `hooks/`                           | `hooks/use-feature/use-feature.hook.ts` + `index.ts`                  |
| `FeatureFlagsProvider.tsx` under `providers/`                          | `providers/feature-flags/feature-flags.provider.tsx` + `index.ts`     |
| `types.ts` catch-all                                                   | One file per interface — `types/feature-flag-data.interface.ts`       |
| `context/` (singular)                                                  | `contexts/` (plural)                                                  |
| `utils/`                                                               | `utilities/`                                                          |
| `FeatureGateProps` in a file called `FeatureGate.tsx`                  | Split into `feature-gate.component.tsx` + `feature-gate.interface.ts` |
| Importing from `../../../utilities/rollout-hasher/rollout-hasher.util` | Import from `@/utilities/rollout-hasher` (folder)                     |
| Two components in one folder                                           | One folder per component                                              |

## 15. Architecture doctrine — DI-first, no refine.dev

Every frontend package builds on `@stackra/container` (a NestJS-compatible DI
container living at `packages/foundation/container/`). Never adopt refine.dev,
Redux Toolkit Query, or another opinion layer on top — the container is the
answer for wiring services, and React Query is the answer for server-state
caching. Both compose together cleanly.

### 15.1 Why not refine.dev

- Two opinion systems fight — refine's `dataProvider` / `authProvider` /
  `liveProvider` / `resource` graph does not compose with `@Injectable()`
  service graphs.
- Our contracts (scope-path, plan-gate, tenancy hierarchy, feature-flags
  resolver, kill-switches) don't fit refine's flat REST-resource model — every
  custom hook is easier to type against our own DTOs.
- Peer-dep churn — refine couples us to its React, TanStack Query, and router
  versions.
- The Saloon SDK sibling already generates wire-visible contracts. Refine would
  ignore that.

### 15.2 The 8-layer stack

Every package mirrors the same folder shape:

```
src/
├── types/                        ← TS mirrors of Saloon Data classes
├── enums/                        ← TS mirrors of backend enums
├── services/
│   ├── http/                     ← @Injectable HttpService for THIS domain
│   │   ├── <name>-http.service.ts
│   │   └── index.ts
│   └── <name>/                   ← @Injectable domain service
│       ├── <name>.service.ts
│       ├── <name>.service.interface.ts    ← public contract
│       ├── <name>.service.token.ts        ← InjectionToken<IService>
│       └── index.ts
├── module/                       ← @Module + forRoot()
│   ├── <name>.module.ts
│   ├── <name>.module.interface.ts        ← forRoot() options
│   └── index.ts
├── query-keys/
│   ├── <name>-keys.ts
│   └── index.ts
├── contexts/                     ← React contexts for hot-path reads
├── providers/                    ← React providers hydrating contexts
├── hooks/                        ← React Query wrappers using useInject
├── components/                   ← HeroUI-native, compound where multi-facet
├── utilities/                    ← Pure algorithms (RolloutHasher, etc.)
└── testing/                      ← InMemoryService + TestProvider
```

### 15.3 Service class shape

Every domain service is:

- `@Injectable()`-decorated class
- Constructor-injects the HttpService and any cross-cutting concerns
  (`AuthService`, `TenancyService`) via `@Inject()`
- Exposes typed methods mirroring the Saloon Requests one-to-one
- Publishes a matching `IFooService` interface + `FOO_SERVICE` InjectionToken so
  consumers can rebind to test doubles

```typescript
// services/feature-flags/feature-flags.service.token.ts
import type { InjectionToken } from "@stackra/container";
import type { IFeatureFlagsService } from "./feature-flags.service.interface";

export const FEATURE_FLAGS_SERVICE: InjectionToken<IFeatureFlagsService> =
  Symbol("FEATURE_FLAGS_SERVICE");
```

```typescript
// services/feature-flags/feature-flags.service.ts
import { Injectable, Inject } from "@stackra/container";

import type { IFeatureFlagsService } from "./feature-flags.service.interface";
import { FeatureFlagsHttpService } from "../http/feature-flags-http.service";

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {
  public constructor(
    @Inject(FeatureFlagsHttpService)
    private readonly http: FeatureFlagsHttpService,
  ) {}

  public listFlags(): Promise<IFeatureFlagData[]> {
    return this.http.get<IFeatureFlagData[]>("/api/v1/feature-flags");
  }

  // ... one method per Saloon Request
}
```

### 15.4 Module shape

Each package ships a `<Name>Module` with a `forRoot(options)` static factory:

```typescript
// module/feature-flags.module.ts
import { Module, type DynamicModule } from "@stackra/container";

import { FeatureFlagsHttpService } from "../services/http/feature-flags-http.service";
import { FeatureFlagsService } from "../services/feature-flags/feature-flags.service";
import { FEATURE_FLAGS_SERVICE } from "../services/feature-flags/feature-flags.service.token";
import type { IFeatureFlagsModuleOptions } from "./feature-flags.module.interface";

@Module({})
export class FeatureFlagsModule {
  public static forRoot(options: IFeatureFlagsModuleOptions): DynamicModule {
    return {
      module: FeatureFlagsModule,
      providers: [
        { provide: "FEATURE_FLAGS_OPTIONS", useValue: options },
        FeatureFlagsHttpService,
        FeatureFlagsService,
        { provide: FEATURE_FLAGS_SERVICE, useExisting: FeatureFlagsService },
      ],
      exports: [FEATURE_FLAGS_SERVICE, FeatureFlagsService],
    };
  }
}
```

App-level `AppModule` imports `FeatureFlagsModule.forRoot({...})`.

### 15.5 Hook shape — inject then wrap

Every hook uses `useInject(TOKEN)` to resolve the service, then wraps it in
React Query for caching:

```typescript
// hooks/use-flags/use-flags.hook.ts
"use client";

import { useInject } from "@stackra/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { FEATURE_FLAGS_SERVICE } from "../../services/feature-flags/feature-flags.service.token";
import type { IFeatureFlagData } from "../../types/feature-flag-data.interface";
import { featureFlagsKeys } from "../../query-keys";

export function useFlags(): UseQueryResult<IFeatureFlagData[]> {
  const service = useInject(FEATURE_FLAGS_SERVICE);

  return useQuery({
    queryKey: featureFlagsKeys.flags.all(),
    queryFn: () => service.listFlags(),
  });
}
```

Never call `fetch` inside a hook — always go through the injected service.
That's the seam for testing (rebind the token to `InMemoryFeatureFlagsService`).

### 15.6 Testing — rebind the token, not the endpoint

Test provider swaps the service binding:

```typescript
// testing/test-feature-flags-provider/test-feature-flags-provider.provider.tsx
import { Module, ApplicationFactory } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";

import { FEATURE_FLAGS_SERVICE } from "../../services/feature-flags/feature-flags.service.token";
import { InMemoryFeatureFlagsService } from "../in-memory-feature-flags.service";

@Module({
  providers: [
    { provide: FEATURE_FLAGS_SERVICE, useClass: InMemoryFeatureFlagsService },
  ],
  exports: [FEATURE_FLAGS_SERVICE],
})
class TestModule {}

export async function createTestApp() {
  return ApplicationFactory.create(TestModule);
}
```

Downstream test hits `useFlags()` — resolves to the in-memory service via DI, no
HTTP, no MSW handlers needed. Faster than mocking `fetch`, correct by
construction.

### 15.7 The 15 generic hooks — build once, reuse everywhere

Ship a shared `@stackra/data` package with 15 resource-shape hooks so every
domain package composes them instead of reinventing:

| Hook                  | Purpose                             |
| --------------------- | ----------------------------------- |
| `useResourceList`     | Paginated list query                |
| `useResource`         | Single record by id                 |
| `useResourceMany`     | Batch fetch by id array             |
| `useResourceInfinite` | Infinite scroll list                |
| `useResourceCreate`   | Create mutation + optimistic update |
| `useResourceUpdate`   | Update mutation + cache patch       |
| `useResourceDelete`   | Delete mutation + cache eviction    |
| `useResourceForm`     | Form controller (create OR update)  |
| `useResourceCustom`   | Ad-hoc typed request                |
| `useResourceSearch`   | Full-text / filter query            |
| `useResourceExport`   | CSV / xlsx export                   |
| `useResourceImport`   | Bulk import                         |
| `useResourceMeta`     | Column metadata / schema            |
| `useResourceAudit`    | Audit log stream                    |
| `useResourceCache`    | Direct cache read/write             |

Each accepts a `ResourceToken<T>` (an `InjectionToken<IResourceProvider<T>>`).
The app resolves the concrete provider via DI — same pattern as Angular
services. Domain packages implement `IResourceProvider<T>` inside their
`@Injectable()` service and expose a token that downstream consumers use.

### 15.8 Migration path

Order of operations for each backend package's frontend mirror:

1. Contracts — hand-mirror the Saloon Data classes to TS interfaces.
2. HTTP service — `<Name>HttpService @Injectable()`.
3. Domain service — `<Name>Service @Injectable()` implementing `I<Name>Service`,
   exposing the token.
4. Module — `<Name>Module.forRoot(options)`.
5. Query keys — typed factories.
6. Hooks — React Query wrappers over injected services.
7. Provider + hot-path hook — reads boot payload.
8. Components — HeroUI compound where multi-facet.
9. Testing — in-memory service class + `Test<Name>Provider`.

Feature-flags is the reference implementation. Every subsequent package
(settings, tenancy, auth, hierarchy, permissions, audit) follows this template
exactly.

### 15.9 What refine.dev-style consumers get without refine.dev

- Uniform hook naming across all packages (`useResourceList` / `useCreate<Noun>`
  / `useUpdate<Noun>` / `useDelete<Noun>`).
- Every mutation invalidates its matching query key.
- Every service call goes through the injected token — swap for a mock at test
  time without touching the network layer.
- Cross-cutting concerns (tenancy, auth, retry, rate-limit) live on the
  HttpService, injected once, applied everywhere.
- Consumer components stay pure UI — they call hooks; hooks call services via
  DI.

This is the same layering Angular ships. React inherits it via
`@stackra/container`.

## 16. Interface file placement — colocated vs central

Two categories, two rules — no mixing.

### 16.1 Colocated `.interface.ts` (per-concern)

Interface files that describe the **surface of a single artifact** live in the
same folder as that artifact:

| Artifact  | Interface file lives                                             |
| --------- | ---------------------------------------------------------------- |
| Component | `components/<name>/<name>.interface.ts`                          |
| Hook      | `hooks/<name>/<name>.interface.ts` (only when non-trivial types) |
| Provider  | `providers/<name>/<name>.interface.ts`                           |
| Context   | Owned by the writer (usually the provider folder)                |
| Service   | `services/<name>/<name>.service.interface.ts`                    |
| Module    | `<name>.module.interface.ts` (flat, next to the module file)     |

Rationale — these interfaces change together with the runtime file. Splitting
them creates indirection that hides the coupling.

### 16.2 Central `src/types/` (wire-visible domain shapes)

Domain-model interfaces that mirror the backend's Saloon Data classes live in a
central `src/types/` folder:

```
types/
├── feature-flag-data.interface.ts       ← IFeatureFlagData
├── feature-override-data.interface.ts   ← IFeatureOverrideData
├── feature-rollout-data.interface.ts    ← IFeatureRolloutData
├── feature-kill-switch-data.interface.ts
├── feature-resolution.interface.ts
├── scope-path.interface.ts
└── index.ts
```

Rationale — these shapes are the wire contract. Many consumers reference them;
centralizing keeps them findable and lets a single import ripple across every
service, hook, component, and schema.

### 16.3 Anti-patterns

| Anti-pattern                                    | Correct                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `types/` catch-all with component props inside  | Component props stay in `components/<name>/<name>.interface.ts`         |
| `interfaces/` folder duplicating `types/`       | One folder — call it `types/`                                           |
| Central `types/service-contracts.ts`            | Service contracts live in `services/<name>/<name>.service.interface.ts` |
| Inlining a data interface into the service file | Extract to `types/<name>.interface.ts` — it's a wire shape              |

## 17. Module file — flat in `src/`

Every package has exactly one module file, and it lives at the top level of
`src/`:

```
src/
├── feature-flags.module.ts             ← @Module + forRoot()
├── feature-flags.module.interface.ts   ← options bag
```

No `src/module/` folder — one file per concern, folder-per-thing only applies
when the concern has multiple files. Options bag sits next to the module file
with `.module.interface.ts` suffix.

### 17.1 Options bag scope

The module's `IXxxModuleOptions` interface should carry only package-scoped
concerns:

- ✅ Feature toggles specific to this package
- ✅ URL path overrides for this domain
- ✅ Per-package cache TTLs
- ❌ HTTP concerns (baseUrl, tokenProvider, headers) — those go on
  `IHttpModuleOptions` in `@stackra/http`
- ❌ Tenancy concerns — those go on `TenancyModule.forRoot()`
- ❌ Auth concerns — those go on `AuthModule.forRoot()`

## 18. Constants folder — query keys + module tokens

Move query keys and module-scoped tokens to `src/constants/`:

```
src/constants/
├── query-keys.constant.ts    ← featureFlagsKeys (typed factories)
├── tokens.constant.ts        ← module-option InjectionTokens
└── index.ts
```

- No `src/query-keys/` folder — a whole folder for one file is over-structured.
- Service-scoped InjectionTokens still live next to their service
  (`services/<name>/<name>.service.token.ts`) — those are per-concern.
- File names use the `.constant.ts` suffix to grep cleanly.

## 19. Zod schemas — boundary validation

Every package that accepts user input (admin forms, config, wire ingress) ships
a `src/schemas/` folder with Zod schemas mirroring the backend's `*RequestData`
classes:

```
src/schemas/
├── create-override-input.schema.ts
├── update-override-input.schema.ts
├── create-rollout-input.schema.ts
├── update-rollout-input.schema.ts
├── create-kill-switch-input.schema.ts
├── update-kill-switch-input.schema.ts
└── index.ts
```

### 19.1 Schema shape

Each file exports:

- The Zod schema itself — `xxxInputSchema`
- The inferred TS type — `type XxxInputSchema = z.infer<typeof schema>`

The inferred type is the single source of truth — hand-declaring a matching
interface duplicates work and drifts. When a service interface needs the same
shape, import the type from `schemas/` rather than duplicating.

### 19.2 Where to use Zod vs plain interfaces

| Use case                                         | Choice                       |
| ------------------------------------------------ | ---------------------------- |
| Admin form validation (React Hook Form resolver) | Zod schema in `src/schemas/` |
| Wire ingress from user-controlled endpoints      | Zod schema                   |
| Config file parsing (env vars, JSON)             | Zod schema                   |
| Internal domain models (e.g. `IFeatureFlagData`) | Plain TS interface           |
| Runtime query cache lookups                      | Plain TS interface           |
| Function return types                            | Plain TS interface           |

Rule: **Zod at boundaries, TS interfaces everywhere else.** Runtime validation
costs cycles — pay only where the data is untrusted (form input, wire ingress,
config).

### 19.3 Consumer usage

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createOverrideInputSchema,
  type CreateOverrideInputSchema,
} from "@stackra/feature-flags/schemas";

function OverrideForm() {
  const form = useForm<CreateOverrideInputSchema>({
    resolver: zodResolver(createOverrideInputSchema),
  });
  // ...
}
```

The `./schemas` entry point is exported from `package.json` so consumers can
import directly without pulling the full package barrel.

## 20. Shared HTTP package — @stackra/http

Every domain package's `@Injectable()` service **injects `HTTP_SERVICE`** from
`@stackra/http`. Never ship a per-domain HTTP wrapper.

### 20.1 Wiring order in the root AppModule

```typescript
@Module({
  imports: [
    // 1. HttpModule.forRoot() FIRST — every downstream module depends on it
    HttpModule.forRoot({
      baseUrl: import.meta.env.VITE_API_URL,
      tokenProvider: () => authStore.getState().token,
      requestInterceptors: [attachTenantHeader],
      responseInterceptors: [handleUnauthorized],
    }),

    // 2. Domain modules — each injects HTTP_SERVICE
    AuthModule.forRoot(),
    TenancyModule.forRoot(),
    FeatureFlagsModule.forRoot(),
    SettingsModule.forRoot(),
  ],
})
class AppModule {}
```

### 20.2 Domain service shape

```typescript
import { Injectable, Inject } from "@stackra/container";
import { HTTP_SERVICE, type IHttpService } from "@stackra/http";

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {
  public constructor(
    @Inject(HTTP_SERVICE) private readonly http: IHttpService,
  ) {}

  public listFlags() {
    return this.http.get<IFeatureFlagData[]>("/api/v1/feature-flags");
  }
}
```

### 20.3 Test seam

Rebind `HTTP_SERVICE` in the test module to a fake — every downstream domain
service picks it up transparently:

```typescript
@Module({
  providers: [{ provide: HTTP_SERVICE, useClass: FakeHttpService }],
  exports: [HTTP_SERVICE],
})
class TestAppModule {}
```

### 20.4 Cross-cutting concerns

Auth, tenancy, retry, telemetry — implement each as a request / response
interceptor pair on `HttpModule.forRoot()`. Never re-implement them per domain
package.

## 21. Final layout — reference

Verified against `packages/frontend/feature-flags/` (planned reference
implementation):

```
src/
├── index.ts                                 ← root barrel
├── feature-flags.module.ts                  ← @Module + forRoot()
├── feature-flags.module.interface.ts        ← IFeatureFlagsModuleOptions
├── types/                                   ← wire-visible DTOs
│   └── <name>.interface.ts
├── enums/                                   ← const-object + literal-union
│   └── <name>.enum.ts
├── schemas/                                 ← Zod for boundary validation
│   └── <name>.schema.ts
├── constants/                               ← query keys + module tokens
│   ├── query-keys.constant.ts
│   ├── tokens.constant.ts
│   └── index.ts
├── services/                                ← @Injectable domain services
│   └── <name>/
│       ├── <name>.service.ts
│       ├── <name>.service.interface.ts
│       ├── <name>.service.token.ts
│       └── index.ts
├── contexts/                                ← React contexts (readers)
│   └── <name>/
│       ├── <name>.context.ts
│       └── index.ts
├── providers/                               ← React providers (writers)
│   └── <name>/
│       ├── <name>.provider.tsx
│       ├── <name>.interface.ts              ← owns context-value shape
│       └── index.ts
├── hooks/                                   ← React Query + hot-path readers
│   └── use-<name>/
│       ├── use-<name>.hook.ts
│       ├── use-<name>.interface.ts          ← only when non-trivial
│       └── index.ts
├── components/                              ← HeroUI-native compound
│   └── <name>/
│       ├── <name>.component.tsx
│       ├── <name>.interface.ts
│       └── index.ts
├── utilities/                               ← pure algorithms
│   └── <name>/
│       ├── <name>.util.ts
│       └── index.ts
└── testing/                                 ← test doubles + TestProvider
    ├── in-memory-<name>-service/
    │   ├── in-memory-<name>.service.ts
    │   └── index.ts
    ├── test-<name>-provider/
    │   ├── test-<name>-provider.provider.tsx
    │   ├── test-<name>-provider.interface.ts
    │   └── index.ts
    └── index.ts
```

Anti-patterns collected in one place:

| Anti-pattern                                        | Correct                                       |
| --------------------------------------------------- | --------------------------------------------- |
| `src/module/` folder for one file                   | `src/<name>.module.ts` flat                   |
| `src/query-keys/` folder for one file               | `src/constants/query-keys.constant.ts`        |
| Per-domain HTTP wrapper                             | Inject `HTTP_SERVICE` from `@stackra/http`    |
| Inline `IContextValue` in the context file          | Colocated in the provider's `.interface.ts`   |
| Central `types/service-contracts.ts`                | `services/<name>/<name>.service.interface.ts` |
| Hand-declared TS interface duplicating a Zod schema | `type X = z.infer<typeof xSchema>`            |
| Zod schema for internal domain models               | Plain TS interface — Zod at boundaries only   |

## 22. Shared data hooks — @stackra/data

Every domain package with an admin surface (list / one / create / update /
delete) **consumes `@stackra/data`** instead of shipping bespoke React Query
hooks per resource.

### 22.1 The seam — `IResourceProvider<T>` + `ResourceToken<T>`

Each resource in a domain package has:

1. A concrete `@Injectable()` class implementing `IResourceProvider<T>`
   (delegates to the domain service).
2. A `ResourceToken<T>` bound to that class.
3. Registration in the module's `forRoot()` `providers`.

```typescript
// src/resources/overrides/overrides-resource.provider.ts
import { Injectable, Inject } from "@stackra/container";
import type {
  IResourceProvider,
  IResourceListParams,
  IResourceListResult,
} from "@stackra/data";

@Injectable()
export class OverridesResourceProvider implements IResourceProvider<IFeatureOverrideData> {
  public constructor(
    @Inject(FEATURE_FLAGS_SERVICE) private readonly svc: IFeatureFlagsService,
  ) {}

  public async list(
    _params?: IResourceListParams,
  ): Promise<IResourceListResult<IFeatureOverrideData>> {
    const data = await this.svc.listOverrides();
    return { data, meta: { total: data.length } };
  }

  public one(id: string) {
    return this.svc.showOverride(id);
  }
  public create(input: unknown) {
    return this.svc.createOverride(input as never);
  }
  public update(id: string, input: unknown) {
    return this.svc.updateOverride(id, input as never);
  }
  public delete(id: string) {
    return this.svc.deleteOverride(id);
  }
}
```

```typescript
// src/resources/overrides/overrides-resource.token.ts
import type { ResourceToken } from "@stackra/data";

export const OVERRIDES_RESOURCE: ResourceToken<IFeatureOverrideData> = Symbol(
  "@stackra/feature-flags:OVERRIDES_RESOURCE",
);
```

### 22.2 The 6 essential hooks (v0.1)

| Hook                  | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `useResourceList`     | Paginated list — filters, sorts, pagination |
| `useResource`         | Single record by id                         |
| `useResourceInfinite` | Cursor-based infinite scroll                |
| `useResourceCreate`   | Create mutation + cache invalidation        |
| `useResourceUpdate`   | Update mutation + record + list invalidate  |
| `useResourceDelete`   | Delete mutation + cache eviction            |

Each accepts a `ResourceToken<T>` as its first argument.

### 22.3 Additional hooks (added incrementally)

`useResourceMany`, `useResourceSearch`, `useResourceForm`, `useResourceCustom`,
`useResourceExport`, `useResourceImport`, `useResourceMeta`, `useResourceAudit`,
`useResourceCache`.

Ship them as consumers actually need them — don't build spec-only hooks.

### 22.4 Filter + sort + pagination contract

Consumer code speaks `IResourceListParams`:

```typescript
useResourceList(OVERRIDES_RESOURCE, {
  filters: [
    { field: "flag", operator: FilterOperator.Eq, value: "billing.new_flow" },
    { field: "expiresAt", operator: FilterOperator.IsNull },
  ],
  sorts: [{ field: "createdAt", direction: SortDirection.Desc }],
  pagination: { page: 1, pageSize: 20 },
  search: "alice@example.com",
});
```

The provider translates the shape to the concrete backend's query convention.
Common shapes ship with the package (`FilterOperator`, `SortDirection` enums) —
providers throw at query time if they can't express a given operator.

### 22.5 Anti-patterns

| Anti-pattern                                               | Correct                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Per-resource `useOverrides` / `useCreateOverride` hooks    | `useResourceList(OVERRIDES_RESOURCE)` / `useResourceCreate(OVERRIDES_RESOURCE)` |
| Inlining filter/sort DSL in the domain service             | Speak `IResourceListParams`; the provider translates                            |
| Hardcoded query keys per hook                              | `resourceKeys(TOKEN)` factory                                                   |
| MSW handlers to mock CRUD in tests                         | Rebind `ResourceToken` to `InMemoryResourceProvider<T>`                         |
| Custom pagination shape per package                        | `IResourcePagination` + `IResourcePaginationMeta`                               |
| Ad-hoc filter operators per domain                         | `FilterOperator` enum — extend the enum, not the domain                         |
| Two hooks with the same query key from different resources | Every `resourceKeys()` factory namespaces by `ResourceToken`                    |

### 22.6 Migration checklist for existing packages

For each admin resource in the package:

1. Create `src/resources/<name>/<name>-resource.provider.ts` implementing
   `IResourceProvider<T>` — delegate to the existing domain service.
2. Create `src/resources/<name>/<name>-resource.token.ts` with the
   `ResourceToken<T>` symbol.
3. Register the provider + token in the module's `forRoot()`.
4. Delete the per-resource hooks (`useOverrides`, `useOverride`,
   `useCreateOverride`, ...) — consumers call
   `useResourceList(OVERRIDES_RESOURCE)` etc. instead.
5. Update the package README with the new consumption pattern.

The hot-path context hooks (`useFeature`, `useFeatureResolution`, etc.) do NOT
go through `@stackra/data` — they read from a React context populated by the
boot payload, not through a `ResourceToken`. Keep them separate.

## 23. Laravel-style config docblocks

Every `config/<name>.config.ts` file uses Laravel's bordered section-header
convention for readability + parity with the backend config style:

```typescript
export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Section Title
  |--------------------------------------------------------------------------
  |
  | Prose explaining what the section controls, when to override,
  | and where the value flows to at runtime. Keep sentences short.
  |
  */

  fieldName: "value", // inline comment for the specific field
});
```

Rules:

- Section header goes ABOVE the field it documents, inside the object literal.
- Two dash borders (72 dashes each) frame the title.
- Prose block explains **what**, **why**, and **how to override**.
- Inline `//` comment on the field value only when the prose needs a per-value
  note.

Anti-patterns:

- JSDoc `/** */` blocks inside the object literal — that's for exported types,
  not runtime config values.
- Inline prose without the header box — harder to scan.
- Multiple sections merged into one block — one section per top-level field.

## 24. Hook return shape — extend, never replace

Every hook built on `@tanstack/react-query` returns the raw `UseQueryResult<T>`,
`UseInfiniteQueryResult<...>`, or `UseMutationResult<...>` directly. Never
invent a normalized `{ data, isLoading, ... }` wrapper that hides TanStack's
surface.

### 24.1 Rationale

TanStack's result types carry fields consumers legitimately need:

- `promise` — React 19 `use()` integration
- `isPlaceholderData` — placeholder-vs-fresh UI branching
- `dataUpdatedAt` — staleness indicators ("updated 3s ago")
- `fetchStatus` (`fetching` / `paused` / `idle`) — offline-aware UI
- `isPending` vs `isLoading` — Suspense boundary semantics
- `isRefetching` / `isFetchingNextPage` — spinners without hiding current data
- Type narrowing (`data: T` when `isSuccess: true`)

A hand-written wrapper has to enumerate every field. Every TanStack minor
version adds more. Ownership drift is guaranteed.

### 24.2 Extending with domain fields — intersection types

When a hook genuinely ships domain-specific fields, attach them via intersection
on the return type:

```typescript
export function useResourceList<T>(
  token: ResourceToken<T>,
  params?: IResourceListParams,
): UseQueryResult<IResourceListResult<T>> & {
  /** Total page count derived from meta.total + meta.pageSize. */
  readonly totalPages: number;
  /** True when the page contains no records. */
  readonly isEmpty: boolean;
} {
  const query = useQuery({ /* ... */ });
  const totalPages = /* compute from query.data?.meta */;
  const isEmpty = (query.data?.data.length ?? 0) === 0;
  return Object.assign(query, { totalPages, isEmpty });
}
```

Rules:

- **Add an extension only when 3+ consumers compute the same thing.** Below that
  threshold, callers compute inline.
- **Never remove TanStack fields.** Intersection adds, never hides.
- **Document each extension** with a `@description` on the return-type field.

### 24.3 Domain-shape returns belong at the domain layer

If a package needs a bespoke return shape (`{ allow, deny, undecided }` from a
feature-flag query), build a **wrapper hook inside the domain package** that
reads the generic hook and transforms:

```typescript
// packages/feature-flags/src/hooks/use-overrides-summary/use-overrides-summary.hook.ts
export function useOverridesSummary() {
  const query = useResourceList(OVERRIDES_RESOURCE);
  const summary = React.useMemo(
    () => ({
      allow: (query.data?.data ?? []).filter((o) => o.decision === "allow")
        .length,
      deny: (query.data?.data ?? []).filter((o) => o.decision === "deny")
        .length,
      ...query,
    }),
    [query],
  );
  return summary;
}
```

Never bake domain semantics into `@stackra/data` — the generic hooks stay
generic.

### 24.4 Anti-patterns

| Anti-pattern                                                             | Correct                                            |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| `return { data, isLoading, error, refetch }` — replaces `UseQueryResult` | Return `UseQueryResult<T>` unchanged               |
| Wrapping `data.data` to hide the envelope shape                          | Consumers destructure `{ data: { data, meta } }`   |
| Adding one field per package                                             | Ship intersection extensions with 3+ consumer rule |
| Domain-shape return from generic hooks                                   | Wrapper hook in the domain package                 |
| Copying TanStack fields into a custom interface                          | Intersection: `UseQueryResult<T> & { extra }`      |
