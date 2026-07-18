# Code Standards & File Separation

Rules for **how source files are organised** inside every `@stackra/*` package's
`src/`. Match against the canonical layout of `network/src/` and
`contracts/src/` — those are the ground truth. Read alongside
`package-conventions.md` (module + config trio), `ui-components.md` (React
subpath layout), and `documentation.md` (docblocks + inline comments — every
file created by these rules gets documented per that steering).

## Rule — one export per file, with a suffix that names the kind

Every source file exports **one** symbol. The filename's suffix names the
export's _kind_; the parent folder names the export's _category_. The two agree
— a `.interface.ts` lives in an `interfaces/` folder, a `.service.ts` lives in a
`services/` folder, etc.

| Export                                                                                                                                       | File suffix            | Home folder                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| `export interface Foo`                                                                                                                       | `foo.interface.ts`     | `interfaces/`                                                       |
| `export type Foo`                                                                                                                            | `foo.type.ts`          | `types/`                                                            |
| `export enum Foo`                                                                                                                            | `foo.enum.ts`          | `enums/`                                                            |
| `export const FOO = …`                                                                                                                       | `foo.constants.ts`     | `constants/`                                                        |
| DI `Symbol()` token (single)                                                                                                                 | `foo.token.ts`         | `tokens/`                                                           |
| Event-map record (many event names per feature)                                                                                              | `foo.events.ts`        | `events/`                                                           |
| `export function foo(...)`                                                                                                                   | `foo.util.ts`          | `utils/`                                                            |
| `export class FooService`                                                                                                                    | `foo.service.ts`       | `services/`                                                         |
| `export class FooRegistry`                                                                                                                   | `foo.registry.ts`      | `registries/`                                                       |
| `export class FooManager`                                                                                                                    | `foo.manager.ts`       | `managers/` or subpath root                                         |
| `export class FooError`                                                                                                                      | `foo.error.ts`         | `errors/`                                                           |
| `export class FooModule`                                                                                                                     | `foo.module.ts`        | subpath root                                                        |
| `export function @Decorator()`                                                                                                               | `foo.decorator.ts`     | `decorators/`                                                       |
| `export function fooMixin(...)`                                                                                                              | `foo.mixin.ts`         | `mixins/`                                                           |
| `export class FooDetector` / `Adapter` / `Driver` / `Handler` / `Processor` / `Reporter` / `Strategy` / `Transport` / `Middleware` / `Store` | `foo.<role>.ts`        | `<role>s/` (pluralised)                                             |
| React component                                                                                                                              | `<name>.component.tsx` | `react/components/<name>/`                                          |
| React provider                                                                                                                               | `<name>.provider.tsx`  | `react/providers/<name>/`                                           |
| React context (`createContext`)                                                                                                              | `<name>.context.ts`    | `react/contexts/<name>/`                                            |
| React hook                                                                                                                                   | `<name>.hook.ts`       | `react/hooks/<name>/` (or `core/hooks/<name>/` when cross-platform) |

**Never invent a new suffix without adding it to this table.**

### Grouped exceptions

The only files that intentionally carry multiple related exports:

- **Event maps** — `*.events.ts` (plural). A feature's whole event catalogue
  lives in one file because the map IS the export
  (`contracts/src/events/network.events.ts`).
- **Token barrels** — legacy `*.tokens.ts` (plural). New code prefers one
  `Symbol()` per `*.token.ts` file (see
  `contracts/src/tokens/discovery-service.token.ts`). Only add to a
  `*.tokens.ts` file if it already exists for that domain — do not create new
  ones.
- **Component / hook / provider / context own-family interfaces** — see the
  "React entity" exception below. A `<name>.interface.ts` under a component
  folder may declare every interface belonging to the compound family (root
  props + subcomponent props + context value), because they are one conceptual
  "shape of this entity".
- **`index.ts` barrels** — re-exports only, never original declarations.

## Rule — one folder per export category

Every source file lives under the folder that names its category. If a folder
needs to exist to hold a file of a given kind, create it — do not tuck an
interface into `services/` next to its consumer.

Canonical top-level folders per subpath (only create the ones you use):

```
src/<subpath>/
  adapters/          # *.adapter.ts     — platform adapters
  application/       # framework core (container only)
  constants/         # *.constants.ts   — literal values, defaults
  container/         # framework core (container only)
  contexts/          # <name>/<name>.context.ts   (react subpath only)
  decorators/        # *.decorator.ts   — DI / metadata decorators
  detectors/         # *.detector.ts    — feature detectors (network, ai)
  discovery/         # discovery services
  drivers/           # *.driver.ts      — Manager-managed drivers
  enums/             # *.enum.ts        — one enum per file
  errors/            # *.error.ts       — custom Error classes
  events/            # *.events.ts      — event-name maps
  handlers/          # *.handler.ts     — command / event handlers
  hooks/             # <name>/<name>.hook.ts
  interfaces/        # *.interface.ts   — one interface per file
  managers/          # *.manager.ts     — or a single manager at subpath root
  metadata/          # metadata keys + reader helpers
  middlewares/       # *.middleware.ts
  mixins/            # *.mixin.ts       — class-factory mixins
  module/            # framework core (container only)
  pipeline/          # pipeline stages / builders
  processors/        # *.processor.ts
  providers/         # <name>/<name>.provider.tsx (react subpath only)
  registries/        # *.registry.ts
  reporters/         # *.reporter.ts    — analytics / monitoring reporters
  services/          # *.service.ts
  stores/            # *.store.ts       — state stores
  strategies/        # *.strategy.ts
  tokens/            # *.token.ts       — one Symbol() per file (grouped .tokens.ts is legacy)
  transports/        # *.transport.ts
  types/             # *.type.ts        — one type alias per file
  utils/             # *.util.ts        — pure functions
```

Interfaces and types **never share a folder**: `interfaces/` holds `interface`
declarations, `types/` holds `type` aliases. This is a hard rule — if a shape
can be written as an interface, prefer interface and put it in `interfaces/`;
use `type` (and `types/`) for unions, mapped types, tuples, and other things
`interface` cannot express.

## Rule — categories are **scoped to their sub-domain**, never flat

The `src/<subpath>/` prefix in the category table above is load-bearing:
category folders (`constants/`, `interfaces/`, `types/`, `utils/`, `services/`,
`errors/`, `registries/`, `decorators/`, ...) live **INSIDE** the sub-domain
that owns them — never as flat top-level buckets at `src/constants/`,
`src/interfaces/`, `src/utils/`.

### What counts as a "sub-domain"?

Any folder directly under `src/` that groups a coherent chunk of the package's
public surface. The canonical shapes:

- **Single-entry-point packages** (`contracts`, `support`, `pipeline`,
  `console`, ...) — packages whose `package.json` `exports` map has only one
  entry (`.` → `./src/index.ts`). For these, **the whole `src/` IS the
  sub-domain** — flat category folders directly under `src/` are permitted and
  preferred (`src/interfaces/`, `src/utils/`, `src/services/`, ...). No `core/`
  wrapper. Rationale: adding a mandatory `core/` for a package that will never
  grow a second entry point buys nothing and forces every relative import to
  gain a `../core/` prefix.
- **Multi-entry-point packages** (`cache`, `container`, `error`, `events`,
  `logger`, `network`, `queue`, `routing`, `testing`, `vite`, `config`, ...) —
  one sub-domain per publishable subpath (`core/`, `react/`, `native/`,
  `testing/`, `vite/`, ...). Each subpath owns its own category folders. `core/`
  is the conventional name for "the platform-agnostic default subpath" — every
  multi-entry-point package that ships a `.` entry should call it `core/`.
- **Multi-domain packages** (`routing`, `error`) — special case of
  multi-entry-point where a publishable subpath is itself a bounded context.
  `routing/` ships **10** sub-domains: `core/` (composite module + core
  services), `middleware/`, `guards/`, `seo/`, `analytics/`, `matchers/`,
  `react/`, `testing/`, `vite/`, `console/`. `error/` ships `core/`, `react/`,
  `router/`, `testing/`. Each sub-domain owns its own category folders + its own
  `package.json` `exports` subpath.
- **Sub-domain-organized decorator packages** (`decorators`) — `decorators/`
  uses each consumer-package name as its sub-domain (`decorators/cache/`,
  `decorators/queue/`, `decorators/routing/`, ...) so decorators tree-shake per
  consumer. This IS sub-domain scoping — the `<consumer>` name replaces `core/`
  — not an exception to it.

### Deciding flat vs nested — the two-question checklist

1. **Does the `package.json` `exports` map declare more than one entry?**
   - **Yes** → multi-entry-point. Category folders MUST be nested under each
     entry's sub-domain (`src/core/constants/`, never `src/constants/`).
   - **No** → single-entry-point. Flat category folders directly under `src/`
     are allowed.
2. **Does `tsup.config.ts` declare more than one entry?**
   - Check the entries map. If more than one, treat as multi-entry-point
     regardless of what `exports` currently ships (the intent is multi-entry and
     the tsup output will demand nested categories).

Answering these two questions gives the canonical layout for every new package.
Never mix flat and nested inside one package (e.g. `src/utils/` at root AND
`src/core/utils/` alongside is a bug — the package is one shape or the other,
not both).

### Workspace-wide compliance snapshot (2026-07-15)

| Package         | Entries | Layout                             | Compliant?          |
| --------------- | ------- | ---------------------------------- | ------------------- |
| `cache`         | 3       | nested (core/react/testing)        | ✓                   |
| `console`       | 3       | flat (`.` + `./testing` + `./bin`) | ✓ single-entry rule |
| `container`     | 3       | nested (core/react/testing)        | ✓                   |
| `contracts`     | 1       | flat                               | ✓                   |
| `decorators`    | 8       | nested (per consumer)              | ✓                   |
| `error`         | 4       | nested (core/react/router/testing) | ✓                   |
| `events`        | 3       | nested                             | ✓                   |
| `logger`        | 3       | nested                             | ✓                   |
| `network`       | 4       | nested (+ native)                  | ✓                   |
| `pipeline`      | 2       | flat + `testing/`                  | ✓ single-entry rule |
| `queue`         | 3       | nested                             | ✓                   |
| `routing`       | 10      | nested — canonical example         | ✓                   |
| `support`       | multi   | flat                               | ✓ single-entry rule |
| `testing`       | 3       | nested (core/matchers/preset)      | ✓                   |
| `vite`          | 1       | `core/`                            | ✓                   |
| `config`        | 1       | `core/`                            | ✓                   |
| `contracts-app` | 1       | flat                               | ✓                   |

### Why nested, not flat

- **Sub-domain cohesion.** `routing/console/constants/host-marker.constants.ts`
  reads at a glance as "constants owned by the console sub-domain of routing". A
  flat `routing/src/constants/host-marker.constants.ts` would sit alongside
  `default-routing-config.constants.ts` and `stackra-handle.constants.ts` from
  `core/` — three unrelated constants in one bucket, forcing every consumer to
  import through a shared barrel that crosses sub-domain boundaries.
- **Move-safety.** If we later decide to promote `console` from a routing
  sub-domain to its own `@stackra/routing-console` package, the folder move is
  one `git mv` on `routing/src/console/` — all the constants + interfaces +
  utils travel with it. Flat structure would require line-by-line surgery of
  every category folder.
- **Import clarity.** Consumers inside a sub-domain import via relative paths
  (`../constants`, `../interfaces`, `../utils`), so the reader immediately sees
  "this is within-domain". Cross-domain imports use the subpath alias
  (`@/core/...`), signalling a deliberate boundary crossing.
- **Barrels stay small.** Each sub-domain's `<subdomain>/index.ts` re-exports
  only what the sub-domain owns — no risk of accidentally leaking a cousin
  sub-domain's constants through a shared bucket.

### Worked example — routing/middleware

```
packages/routing/src/middleware/
  middleware.module.ts             ← module at the sub-domain root
  index.ts                         ← public API barrel for `./middleware`
  errors/
    middleware-cycle-detected.error.ts
    index.ts
  services/
    middleware-registry.service.ts
    middleware-resolver.service.ts
    middleware-loader.service.ts
    index.ts
  signals/
    redirect.signal.ts
    not-found.signal.ts
    abort.signal.ts
    index.ts
```

Every category folder is inside `middleware/`. Zero middleware symbols leak to
`packages/routing/src/errors/` — that path doesn't even exist.

### Worked example — routing/console

```
packages/routing/src/console/
  routing-console.module.ts        ← module at the sub-domain root
  index.ts                         ← public API barrel for `./console`
  commands/
    host.command.ts
    index.ts
  constants/
    host-marker.constants.ts       ← BEGIN/END/HOSTS_PATH markers
    index.ts
  interfaces/
    host-diff.interface.ts         ← IHostDiff
    host-options.interface.ts      ← IHostOptions
    index.ts
  utils/
    host-diff.util.ts              ← computeHostDiff
    host-render-block.util.ts      ← renderHostBlock
    parse-host-options.util.ts     ← parseHostOptions
    index.ts
```

Every `host-*` symbol lives inside `console/`. The host command imports its
constants via `../constants`, its interfaces via `../interfaces`, its utils via
`../utils` — all within-domain relative paths, no boundary crossing.

### What's **NOT** a sub-domain

- **Category folders** (`constants/`, `interfaces/`, `utils/`, ...) are NOT
  sub-domains — they never nest each other. `constants/interfaces/` is
  nonsensical (interfaces inside constants).
- **React entity folders** (`react/components/network-status/`,
  `react/hooks/use-inject/`) are NOT sub-domains — they're entity-scoping (see
  the React entity exception below).
- **A single utility file** does NOT justify a sub-domain. If a package has
  three utils and nothing else, they live under `core/utils/`, not under
  `some-random-name/utils/`.

### Enforcement

- Zero flat top-level category folders under `src/`. Grep for
  `packages/*/src/constants/` (excluding contracts + support + support- style
  packages where the whole thing IS `core`); every hit must be either under a
  sub-domain (`src/<subdomain>/constants/`) or explicitly documented as
  "single-sub-domain package, uses `core/` conceptually even without the `core/`
  folder wrapper".
- Every new sub-domain under `src/` has an `index.ts` at its root and a matching
  subpath entry in the package's `tsup.config.ts` + `package.json` `exports` map
  (see `package-conventions.md`).

## Rule — no anonymous, unexported, or file-private top-level declarations

At the top level of a source file:

- Every `interface` is `export interface`. **No file-scope private interfaces.**
  If the shape is only used by one function inside the file, hoist it to
  `interfaces/` (it will grow consumers) or make it function-scoped
  (`function f() { type Local = …; … }`).
- Every top-level `type` alias is `export type`.
- Every top-level `enum` is `export enum`. (Prefer `const` object literals + a
  `type` for closed unions when a real enum isn't needed, but if you declared
  `enum`, export it.)
- Every top-level `class` intended for reuse is `export class`; otherwise it's a
  local helper and should be a function/utility.
- Every top-level `const` that another file will import is `export const` and
  lives under `constants/`.

Non-exported declarations are permitted **only** as function-scoped locals
inside the file's one exported symbol (a private type inside a method body, a
helper function that is closed over by the exported class). File-scope
non-exported code is a smell — either export it (and move it to the correct
folder) or inline it into its single consumer.

## Rule — no `default` exports

Every export is a **named** export. `default` exports break tree-shaking, break
named-import IDE tooling, and disagree with the suffix-per-kind naming
convention above.

The one grandfathered exception is `tsup.config.ts` / `vitest.config.ts` at the
package root, where the toolchain requires `export default`.

## Rule — composite family grouping for non-React shapes

Non-React composite shapes (module options with nested config sub-shapes, event
payloads with sub-record types, orchestrator inputs with an inner
request/response pair) follow the **same family-grouping exception** as React
entities.

- **Split by default.** If any inner interface / type is imported by another
  file directly (bypassing the outer), each inner gets its own file in the
  correct home folder (`interfaces/`, `types/`).
- **Group only when the inner shape is a family member of the outer.** "Family
  member" means the inner is used _only_ in service of the outer — every
  consumer of the inner also consumes the outer.

When grouping, all inner interfaces live in the outer's `<outer>.interface.ts`
and share the outer's name prefix so the family is obvious at a glance:

```typescript
// http-module-options.interface.ts  ─ ALL below live here because
// HttpClientConfig / CircuitBreakerConfig are only used AS parts
// of HttpModuleOptions.

/** Root options for HttpModule.forRoot. */
export interface HttpModuleOptions {
  clients: Record<string, HttpClientConfig>;
  circuitBreaker: CircuitBreakerConfig;
}

/** Per-client configuration. */
export interface HttpClientConfig { … }

/** Circuit-breaker tuning. */
export interface CircuitBreakerConfig { … }
```

If someone else needs `HttpClientConfig` directly (a helper, a test fixture,
another module), the moment that happens **split** `HttpClientConfig` out to
`interfaces/http-client-config.interface.ts` and re-import it into the outer
file. The family exception is a private-composition affordance, not a permanent
home.

**Types stay separate even inside a grouped file.** A `type` alias belonging to
the family goes in a sibling `<outer>.type.ts`, never in `<outer>.interface.ts`.
This preserves the "interfaces and types don't share a file" rule.

## Rule — enums stay enums (no helper-method scaffolding)

An `export enum Foo` is just an enum. Do **not** ship a companion "helpers"
class or object alongside every enum with pre-canned `values()` / `keys()` /
`isValid()` / `parse()` / `asSelect()` methods. That is scaffolding no one asked
for and adds a second file, a second export, and a second name to remember for
every enum in the repo.

When you actually need something an enum can't do on its own:

- **List every value** — one-liner at the call site:
  `Object.values(HttpMethod)`.
- **Type-guard a value** — one-liner:
  `(Object.values(HttpMethod) as string[]).includes(v)` or a Zod
  `z.nativeEnum(HttpMethod)` when the input is untrusted (form, URL, config).
- **UI labels for a select** — the label map belongs **next to the consumer**
  (the form component, the chip that renders it), not next to the enum. Labels
  are i18n-adjacent — put them where they'll be translated, not where they'll be
  forgotten.
- **Long-form descriptions** — same rule; ship the map beside its consumer, or
  inside the package's i18n dictionary if there is one.

If the same label map is genuinely reused across three or more consumers,
promote it to `constants/<name>-labels.constants.ts` and export it as
`<NAME>_LABELS`. Still no companion class.

## Rule — React entities keep their scoped types in their own folder

React entities are the **exception** to "types go to `interfaces/`". Every
entity (component, hook, provider, context) gets its own **named folder** that
co-locates the entity with the interfaces, types, constants, and helpers it
OWNS.

```
react/
  components/<name>/
    <name>.component.tsx      # the component
    <name>.interface.ts       # props of the compound family (all in one file)
    <name>.type.ts            # any owned type alias (kept OUT of the .interface.ts)
    <name>.constants.ts       # any owned const
    index.ts                  # barrel: re-exports the component + interfaces
  hooks/<name>/
    <name>.hook.ts
    <name>.interface.ts       # input / return interfaces
    index.ts
  providers/<name>/
    <name>.provider.tsx
    <name>.interface.ts
    index.ts
  contexts/<name>/
    <name>.context.ts
    <name>.interface.ts       # context value interface (when non-trivial)
    index.ts
```

### What counts as "owned"

- **Owned = used ONLY by this entity.** Props interfaces of the compound family
  (`RootProps`, `TriggerProps`, `ContentProps`), the internal context value
  type, entity-local constants.
- **Not owned = anything referenced by another component OR by non-React code.**
  Promote it: move an interface to `react/interfaces/` (React-only) or
  `core/interfaces/` (cross-platform). Move a type to the matching `types/`
  folder. Move a constant to `constants/`.

### Naming inside an entity folder

- Folder name is the kebab-case entity name (`network-status-indicator`,
  `use-network-status`, `nonce`).
- All files inside the folder use the SAME kebab-case stem
  (`network-status-indicator.component.tsx`,
  `network-status-indicator.interface.ts`).
- **`<name>.interface.ts` may contain multiple related interfaces** belonging to
  the compound family — this is the family-grouping exception. All of them are
  `export interface`. Types are NOT allowed in this file; they live in
  `<name>.type.ts`.

## Rule — every folder has an `index.ts` barrel

- Each category folder (`interfaces/`, `services/`, `enums/`, …) exports its
  members through `index.ts`.
- Each entity subfolder (`components/<name>/`, `hooks/<name>/`, …) exports its
  entity + owned interfaces/types through `index.ts`.
- Barrels contain ONLY `export { ... } from '...'` /
  `export type { ... } from '...'` statements — no declarations, no side
  effects, no runtime code.
- The subpath's root `index.ts` (`core/index.ts`, `react/index.ts`,
  `native/index.ts`, `testing/index.ts`) is the package's public API — export
  only what consumers should see (see `contract-reexports.md` for what must NOT
  be re-exported).

## Rule — filename stem is kebab-case; symbol name is PascalCase / camelCase

- Filename: `network-status-indicator.component.tsx`,
  `use-copy-clipboard.hook.ts`, `merge-config.util.ts`.
- Class / interface / type / enum name: `PascalCase` (`NetworkStatusIndicator`,
  `INetworkStatus`, `HttpMethod`).
- Function / variable: `camelCase` (`mergeConfig`, `useCopyClipboard`).
- Constant: `SCREAMING_SNAKE_CASE` for real constants (`DEFAULT_HTTP_CONFIG`,
  `NETWORK_EVENTS`).
- Interfaces prefix with `I` **only** for framework contracts that need to
  disambiguate from a class of the same name (`INetworkDetector` vs. an
  implementation `NetworkDetector`). Component / hook / provider prop interfaces
  do NOT use the `I` prefix — they are named after the entity
  (`NetworkStatusIndicatorProps`).

## Enforcement

Zero-hit greps that must pass:

- **Unexported top-level `interface`** — every match of `^interface ` must have
  `export ` immediately before. `\bexport interface\b` count should match
  `\binterface\s+[A-Z]` count file-by-file.
- **Two `export interface` in one file outside a React entity folder** — split
  them.
- **Mixed `export type` + `export interface` in one file** — split. (Allowed
  only inside a React `<name>.interface.ts` for the compound family, and even
  there a `type` belongs in `<name>.type.ts`.)
- **Mismatched suffix vs folder**: `types/*.interface.ts`,
  `interfaces/*.type.ts`, `enums/*.type.ts`, `services/*.interface.ts`, etc.
  Move to the correct folder or rename.
- **`.interface.ts` file whose sole export is not an interface** (e.g. exports a
  `type` or `const`) — rename to the correct suffix.
- **`export default`** — none in `src/**` (config files at package root are the
  only grandfathered exception).
- **React entity at folder root** (`components/my-thing.component.tsx` — no
  `my-thing/` subfolder) — move into its own folder with a barrel.
- **Folder without `index.ts`** — every category or entity folder needs one.

## When you're tempted

- **"But this interface is only used inside this service."** Two options: (1) it
  stays as a function-scoped `type Local = …` (never a file-scope `interface`),
  or (2) promote it to `interfaces/` because "used only here" usually becomes
  "used by tests, mocks, and one more consumer" the next week. Pick (2) unless
  the shape is genuinely a private implementation detail.
- **"But splitting means five files instead of one."** That is the point — every
  export is discoverable by filename, tree-shaking is precise, and moving a
  symbol renames one file instead of touching a shared bag-of-declarations.
- **"But my component has five props interfaces."** Group them in the entity's
  `<name>.interface.ts`. That's the React exception, and it's the only place
  multiple interfaces share a file.
- **"But I need a helper type just for this one method."** Declare it
  function-scoped or method-scoped — never as a file-scope private `type`.
