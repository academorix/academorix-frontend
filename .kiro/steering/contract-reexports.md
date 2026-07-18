# Contract Re-export Rules

Rules for what a feature package (`@stackra/http`, `@stackra/network`, …) may
export from its public entry points.

## Rule — never re-export from `@stackra/contracts`

A feature package's public API exports **only what it owns**. It MUST NOT
re-export tokens, interfaces, enums, or event maps that live in
`@stackra/contracts`. Consumers import those directly from `@stackra/contracts`.

```ts
// ❌ WRONG — feature package re-exporting contracts
// network/src/core/index.ts
export {
  NETWORK_SERVICE,
  NETWORK_DETECTOR,
  NETWORK_EVENTS,
} from "@stackra/contracts";
export type { INetworkDetector, INetworkStatus } from "@stackra/contracts";
```

```ts
// ✅ CORRECT — export only package-owned symbols
export { NetworkModule } from "./network.module";
export { NetworkService } from "./services";
export { NodeNetworkDetector } from "./detectors";
export type {
  NetworkModuleOptions,
  UseNetworkStatusResult,
} from "./interfaces";
export { useNetworkStatus } from "./hooks";
```

```ts
// ✅ CORRECT — consumers import contracts from the one canonical path
import { NETWORK_SERVICE, type INetworkStatus } from "@stackra/contracts";
import { NetworkService } from "@stackra/network";
```

### Why

- **Preserves the zero-runtime-contract decoupling.** Re-exporting a contract
  **token** (a runtime `Symbol`) from a runtime package means a consumer who
  imports the token pulls in that whole package — defeating the reason the token
  lives in `@stackra/contracts`.
- **Single source of truth.** Every contract symbol has exactly one import path.
  No "which package do I import `INetworkStatus` from?" ambiguity.
- **No drift.** Re-export lists rot; deleting them removes a maintenance
  surface.
- **Smaller `.d.ts` / public API** per package.

## Rule — no contract pass-through files

Do not create local files whose only job is to re-export a contract:

```ts
// ❌ WRONG — network/src/core/interfaces/network-status.interface.ts
export type { INetworkStatus } from "@stackra/contracts";
```

Internal package code imports contract types/tokens **directly** from
`@stackra/contracts`. The package's local `interfaces/`, `constants/`, and
`tokens/` folders hold only **package-owned** symbols. If removing the
pass-throughs leaves a folder empty, delete the folder.

## Allowed — intentional 3rd-party convenience re-exports

A package MAY re-export a genuine third-party symbol when it deliberately wraps
that library and the re-export is an ergonomic convenience, e.g.:

```ts
// @stackra/state — the package IS the TanStack Store integration
export { Store } from "@tanstack/store";

// @stackra/http/rxjs — the subpath IS the RxJS bridge
export { Observable } from "rxjs";
```

Keep these minimal and intentional. When in doubt, don't re-export.

## Enforcement

- Search a feature package's `src/**/index.ts` for `from '@stackra/contracts'`
  in an `export` statement. Zero hits.
- Search for local `*.interface.ts` / `*.constant.ts` / `*.tokens.ts` files
  whose body is only `export … from '@stackra/contracts'`. Zero hits.
- Internal imports of contract symbols must import from `@stackra/contracts`
  directly, never through a local pass-through barrel.

## Retrofit note

Packages promoted before this rule (`logger`, `queue`, `cache`, `events`,
`realtime`, `scheduler`, `coordinator`, `collaboration`, `ssr`, `container`)
still re-export their contracts. Removing those is a **breaking** public-API
change (a minor bump + changeset) and should be done as a deliberate,
per-package sweep — not silently.

## Rule — never define a local `I*Like` structural shim for a missing contract

When a feature package needs to inject or consume a cross-package service whose
contract interface is missing from `@stackra/contracts`, the ONLY correct fix is
to **add the interface to `@stackra/contracts`** and import it from there.
Locally declaring a structural `I<Name>Like` interface that "type-narrows the
shape we actually consume" is forbidden.

```ts
// ❌ WRONG — local structural shim that shadows the real contract
//
// settings/src/core/services/settings-broadcast-listener.service.ts
/**
 * A "structural" realtime manager — the exact `IRealtimeManager`
 * interface isn't in contracts yet, so we type-narrow the shape we
 * actually consume.
 */
interface IRealtimeManagerLike {
  connection(name?: string): Promise<{
    channel(name: string): IRealtimeChannelLike;
    privateChannel(name: string): IRealtimeChannelLike;
  }>;
}

interface IRealtimeChannelLike {
  on(event: string, handler: (data: unknown) => void): unknown;
}

// then...
@Optional() @Inject(REALTIME_MANAGER) private readonly realtime?: IRealtimeManagerLike,
```

```ts
// ✅ CORRECT — add IRealtimeManager + IRealtimeChannel to
//   contracts/src/interfaces/realtime/, then import them here.
import type { IRealtimeManager } from '@stackra/contracts';

@Optional() @Inject(REALTIME_MANAGER) private readonly realtime?: IRealtimeManager,
```

### Why this pattern is banned

1. **Silent drift.** The real service inevitably grows a method the shim doesn't
   have, and the two shapes diverge without a compile error. The next consumer
   copy-pastes the shim, and now three packages have three subtly-different
   definitions of the same interface.
2. **Duplicated source of truth.** The whole point of `@stackra/contracts` is a
   single vocabulary of tokens + interfaces + enums shared across every package.
   A `*Like` shim defeats that immediately.
3. **Hides real work.** The correct action is to promote the interface to
   contracts. That surfaces the design question ("what's the public shape of
   this service?") to the framework layer where it belongs.

### When the runtime type ISN'T in contracts yet

If a piece of framework-level plumbing you consume doesn't have a contract shape
yet, do this in order:

1. **Add the interface to `contracts/src/interfaces/<domain>/`** (or the nearest
   existing folder for that domain).
2. **Wire the new interface into `contracts/src/interfaces/<domain>/index.ts`**
   and, if the domain is new, into `contracts/src/interfaces/index.ts`.
3. **Update the concrete class in the owning package** to declare
   `implements IX` so `tsc` catches drift at the source.
4. **Land contracts + concrete + consumer as one atomic changeset** (contracts
   bumps minor; consumer bumps minor).
5. THEN import from `@stackra/contracts` in the consumer.

`unknown` (with narrow runtime guards) is an acceptable stop-gap for a truly
opaque payload, but a `*Like` interface that mirrors an existing runtime type is
not.

### Enforcement

- Search `**/src/**/*.ts` (excluding `@stackra/contracts`) for
  `interface I\w+Like\b` — zero hits allowed.
- Search for `@Inject(...)` with a local structural type on the same line
  (`private readonly x?: IXLike`) — zero hits allowed.
- Reviewers reject PRs that add a new `*Like` interface with the reasoning "the
  real contract isn't in contracts yet"; the correct response is "promote the
  interface first, then land the consumer."

### Exemption

- **Tests** may use `IXLike` (or better, an `IX` re-declared as `Partial` or
  `Pick`) when the test file needs a lighter shape than the real contract.
  Prefer `Partial<IX>` / `Pick<IX, ...>` over a hand-rolled `*Like` even in
  tests.
