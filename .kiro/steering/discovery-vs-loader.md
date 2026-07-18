# Discovery vs Loader

Naming convention for the two-layer auto-registration pattern used across every
`@stackra/*` module that participates in metadata-driven contribution (cache
stores, event subscribers, queue processors, logger reporters, routing guards +
middleware, console commands, ...).

The words `discovery` and `loader` are **not** synonyms — each refers to a
distinct role. This file locks the naming so that looking at any file called
`*-discovery.service.ts` vs `*-loader.service.ts` tells you which layer it
belongs to.

## The two layers

### Layer 1 — Discovery (framework primitive)

**Owner**: `@stackra/container` **Purpose**: scan the DI graph for providers
carrying a given metadata key and hand them back as an array. Domain-agnostic.
Has no idea what a "command", "reporter", or "middleware" is.

**Canonical files**:

```
packages/contracts/src/tokens/discovery-service.token.ts
packages/contracts/src/interfaces/discovery/discovery-service.interface.ts
packages/contracts/src/interfaces/discovery/discovery-provider.interface.ts
packages/container/src/core/discovery/discovery.service.ts
packages/container/src/core/discovery/container-discovery.service.ts
packages/container/src/core/discovery/discovery.module.ts
packages/container/src/react/hooks/use-discovery/use-discovery.hook.ts
```

**API shape**:

```ts
interface IDiscoveryService {
  getProviders(): IDiscoveryProvider[];
  getProvidersByMetadata(key: symbol | string): IDiscoveryProvider[];
}
```

Every consumer package injects `IDiscoveryService` via the `DISCOVERY_SERVICE`
token — never the concrete `ContainerDiscovery` class.

### Layer 2 — Loader (domain adapter)

**Owner**: the feature package that owns the artifact being loaded (cache,
events, queue, logger, routing/guards, routing/middleware, console, ...).
**Purpose**: use `IDiscoveryService` to find every provider decorated with THIS
domain's metadata key, validate the provider, extract its metadata, and register
it in THIS domain's registry.

**Canonical filename**: `<name>-loader.service.ts` where `<name>` describes the
artifact being loaded (singular unless the domain phrase is naturally plural
like "event-subscribers").

**Canonical class name**: `<Name>Loader` (matching the filename stem).

**Canonical location**: `packages/<pkg>/src/core/services/` for non-subdomain
packages, `packages/<pkg>/src/<subdomain>/services/` for packages with
sub-domains (routing/guards, routing/middleware, routing/analytics,
routing/seo).

**Canonical files**:

```
packages/cache/src/core/services/cache-store-loader.service.ts
packages/console/src/services/command-loader.service.ts
packages/events/src/core/services/event-subscribers-loader.service.ts
packages/logger/src/core/services/reporter-loader.service.ts
packages/queue/src/core/services/processor-subscribers-loader.service.ts
packages/routing/src/guards/services/guard-loader.service.ts
packages/routing/src/middleware/services/middleware-loader.service.ts
```

**Canonical lifecycle hook**: `OnApplicationBootstrap` — loaders scan OTHER
modules' providers, so they must run AFTER every module's `OnModuleInit` has
settled. `OnModuleInit` on a loader is a bug: the module graph is only
guaranteed complete at `OnApplicationBootstrap`.

**Canonical body shape**:

```ts
@Injectable()
export class XLoader implements OnApplicationBootstrap {
  public constructor(
    @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
    private readonly registry: XRegistry,
  ) {}

  public onApplicationBootstrap(): void {
    const providers = this.discovery.getProvidersByMetadata(X_METADATA_KEY);
    for (const p of providers) {
      // validate + extract metadata + registry.register(...)
    }
  }
}
```

## Naming rules (enforceable)

1. **Never call a domain adapter "discovery"**. `CommandDiscovery`,
   `ReporterDiscovery`, `MiddlewareDiscovery` — all wrong. The word `discovery`
   is reserved for the framework primitive in `@stackra/container`.
2. **Never call the framework primitive a "loader"**. There is no
   `DiscoveryLoader` — it's `DiscoveryService`.
3. **File suffix is always `.service.ts`** for both layers (per
   `code-standards.md`).
4. **Class name suffix is `Loader` (never `LoaderService`)**. The `Service` word
   is implied by the folder + filename suffix.
5. **The loader's constructor MUST inject `DISCOVERY_SERVICE` directly** — never
   the concrete `ContainerDiscovery`. This preserves the platform-agnostic
   contract.
6. **A loader is per-metadata-key, not per-package**. If a package discovers two
   disjoint metadata keys (e.g. events discovers `@EventSubscriber` AND
   `@EventTransport`), it ships two loaders — one per key.

## Why this matters

- **Reads well.** A newcomer sees `command-loader.service.ts` under
  `packages/console/src/services/` and immediately knows "this is the console's
  adapter that USES discovery — the discovery itself lives in
  `@stackra/container`".
- **Reviewable.** A PR that adds
  `packages/foo/src/core/services/ foo-discovery.service.ts` is instantly
  wrong-shaped — the reviewer can flag it without reading a single line of the
  code.
- **Refactor-safe.** If we swap the underlying discovery implementation (e.g.,
  from reflection to a build-time manifest), every loader adapts automatically
  because they all depend on the `IDiscoveryService` contract, not the concrete
  class.

## Enforcement

- Grep: `find packages -name '*-discovery.service.ts'` outside
  `packages/container/src/core/discovery/` — zero hits allowed.
- Grep: `find packages -name '*-loader.service.ts'` inside `packages/container/`
  — zero hits allowed (container owns discovery, not loading).
- Every loader's constructor: match `@Inject(DISCOVERY_SERVICE)` — one hit per
  loader file.
- Every loader class: match `implements OnApplicationBootstrap` (NOT
  `OnModuleInit`).
- Every loader class name: match `\bXxxxLoader\b` (no `LoaderService`, no
  `Discovery`).

## Retrofit backlog

None as of the console-package landing (2026-07-15). Every existing loader
across cache, console, events, logger, queue, routing/guards, routing/middleware
already conforms.

**When new discovery-consuming packages land** (analytics reporters, monitoring
reporters, sync backends, storage drivers, tenancy hooks, …), they inherit this
naming from day one.
