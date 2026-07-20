# @stackra/contracts

Zero-runtime vocabulary shared across every `@stackra/*` package — DI tokens,
interfaces, types, enums, and event-name maps. If a symbol needs to be
referenced by more than one runtime package, it lives here.

**Why this exists.** Cross-package consumers (metrics collectors, audit loggers,
dashboards, testing helpers) subscribe to event names, inject tokens, and
type-check against contract interfaces without pulling any runtime code. Every
`@stackra/*` runtime package depends on `contracts`; nothing else depends on any
runtime.

## Install

```bash
pnpm add @stackra/contracts
```

Peer dependencies: none. `contracts` compiles to types-only output.

## Layout

```
src/
  tokens/      # Symbol.for(…) DI tokens
  interfaces/  # interface declarations only
  types/       # standalone type aliases
  enums/       # enums (Scope, ShutdownSignal, LogLevel)
  events/      # event-constant maps + event-name unions
```

The rule is strict: enums live in `enums/`, interfaces live in `interfaces/`,
standalone type aliases live in `types/`. Nothing mixes.

## Public API

### DI Tokens

Every token is a `Symbol.for(…)` so it survives module duplication and
cross-realm inspection:

```typescript
import {
  APPLICATION,
  APP_CONFIG,
  CACHE_MANAGER,
  CACHE_CONFIG,
  CACHE_STORE_METADATA_KEY,
  COLLABORATION_ROOM_MANAGER,
  COLLABORATION_CONFIG,
  COORDINATOR_CONFIG,
  TAB_COORDINATOR,
  DISCOVERY_SERVICE,
  EVENT_EMITTER,
  EVENT_EMITTER_CONFIG,
  LOGGER_MANAGER,
  LOGGER_CONFIG,
  QUEUE_MANAGER,
  QUEUE_CONFIG,
  PROCESSOR_METADATA_KEY,
  ON_JOB_EVENT_METADATA_KEY,
  REALTIME_MANAGER,
  REALTIME_CONFIG,
  SCHEDULER_SERVICE,
  SCHEDULER_CONFIG,
  TASK_RUNNER,
  SCHEDULED_METADATA_KEY,
} from "@stackra/contracts";
```

### Event Name Constants

Every runtime package emits events on the shared `EVENT_EMITTER` bus using these
constants:

```typescript
import {
  CACHE_EVENTS, // cache.hit, cache.miss, cache.written, …
  COLLABORATION_EVENTS, // collaboration.cursor-move, collaboration.thread-create, …
  COORDINATOR_EVENTS, // coordinator.leader-elected, coordinator.tab-joined, …
  LOGGER_EVENTS, // logger.channel-registered, …
  QUEUE_EVENTS, // queue.job-queued, queue.job-completed, …
  REALTIME_EVENTS, // realtime.connected, realtime.message, …
  SCHEDULER_EVENTS, // scheduler.task-started, scheduler.task-failed, …
} from "@stackra/contracts";

// Union types for exhaustive listener maps
import type { CacheEventName, QueueEventName } from "@stackra/contracts";
```

### DI Foundation Interfaces

The DI vocabulary consumed by `@stackra/container` and expressed as contract
interfaces so any custom module can implement them:

```typescript
import type {
  IApplication,
  IApplicationContext,
  IContainerResolver,
  IDiscoveryService,
  IDiscoveryProvider,
  IProviderWrapper,
  DynamicModule,
  ModuleMetadata,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  IAsyncModuleOptions,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@stackra/contracts";
```

### Domain Interfaces

Cross-package contracts consumed by more than one runtime:

```typescript
import type {
  IEventEmitter,
  IEventEmitterSync,
  ICacheStore,
  ICacheModuleConfig,
  ILoggerModuleConfig,
  IHookRegistrar,
} from "@stackra/contracts";
```

### Types

```typescript
import type {
  InjectionToken,
  Provider,
  OptionalFactoryDependency,
  LogContext,
} from "@stackra/contracts";
```

### Enums

```typescript
import {
  Scope,
  ShutdownSignal,
  LogLevel,
  LOG_LEVEL_PRIORITY,
} from "@stackra/contracts";
```

## Versioning contract

- **Patch** (`0.1.x → 0.1.y`) — additions to token/event/interface exports.
- **Minor** (`0.1.x → 0.2.0`) — non-breaking additions or field additions to
  existing interfaces.
- **Major** — removals, renames, or breaking type changes.

Every runtime package pins `@stackra/contracts` with `^` so they auto-adopt
patch and minor bumps.

## License

MIT
