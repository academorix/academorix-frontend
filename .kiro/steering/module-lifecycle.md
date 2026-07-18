# Module Lifecycle & Bootstrap Rules

## Rule — no "bootstrap provider" classes

**Forbidden pattern:**

```typescript
// ❌ ANTI-PATTERN — do NOT copy this
@Injectable()
class SomethingBootstrap {
  public constructor(registry: SomeRegistry, config: SomeConfig) {
    // Work happening inside a constructor to force eager side effects.
    for (const entry of config.entries) registry.register(entry);
  }
}

@Module({})
export class SomeModule {
  static forRoot(options): DynamicModule {
    return {
      providers: [
        SomeRegistry,
        {
          provide: SOMETHING_BOOTSTRAP, // synthetic token that exists
          useFactory: (r) => new Bootstrap(r, options), // only to run this
          inject: [SomeRegistry], // side effect at container-init
        },
      ],
    };
  }
}
```

**Why this is wrong:**

- Conflates _construction_ with _activation_. A constructor should wire
  dependencies into fields, not perform work.
- Requires a synthetic marker token (`X_BOOTSTRAP`) whose only purpose is to
  force the container to instantiate the provider. That token adds API surface
  with no consumer value.
- Sidesteps the container's lifecycle contract — every other package uses
  `onModuleInit` / `onApplicationBootstrap` for post-wire setup, making one
  package a special case.
- Harder to test — you can't call `registry.populate()` in isolation because the
  population lives inside an unrelated class.

## Rule — use lifecycle hooks

The container provides two hooks. Pick the one that matches your intent and
implement it directly on the service that owns the state.

### `OnModuleInit` — module-local initialisation

Fires when the container instantiates the module's providers. Use this when a
service needs to seed its own state from its own config.

```typescript
// ✅ CORRECT — the registry owns its config and its population.
@Injectable()
class SomeRegistry implements OnModuleInit {
  public constructor(
    @Inject(SOME_CONFIG) private readonly config: SomeConfig,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly logger?: ILoggerManager,
  ) {}

  public onModuleInit(): void {
    for (const entry of this.config.entries ?? []) {
      this.register(entry);
    }
  }

  public register(entry: Entry): void {
    /* … */
  }
}
```

### `OnApplicationBootstrap` — cross-module coordination

Fires _after_ every module has finished `onModuleInit`. Use this when your work
depends on other modules already having initialised (e.g. discovery scanning a
fully-populated container).

```typescript
// ✅ CORRECT — discovery runs after all modules have wired their providers.
@Injectable()
class RouteDiscovery implements OnApplicationBootstrap {
  public constructor(
    private readonly routes: RouteRegistry,
    @Optional()
    @Inject(DISCOVERY_SERVICE)
    private readonly discovery?: IDiscoveryService,
  ) {}

  public onApplicationBootstrap(): void {
    if (!this.discovery) return;
    for (const provider of this.discovery.getProvidersByMetadata(
      ROUTE_METADATA_KEY,
    )) {
      // …
    }
  }
}
```

## Rule — module `forRoot(...)` returns providers only

`forRoot(...)` should list:

- The registry / service classes themselves.
- Their `useExisting` aliases against tokens.
- A `useValue` config provider (or `useFactory` for async).

Nothing else. **Do not add a marker class whose only job is to force eager side
effects.**

```typescript
// ✅ CORRECT — clean, standards-compliant module.
@Module({})
export class SomeModule {
  static forRoot(options?: SomeModuleOptions): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: SomeModule,
      global: true,
      providers: [
        { provide: SOME_CONFIG, useValue: config },
        SomeRegistry,
        { provide: SOME_REGISTRY, useExisting: SomeRegistry },
        SomeResolver,
        { provide: SOME_RESOLVER, useExisting: SomeResolver },
      ],
      exports: [
        SOME_CONFIG,
        SomeRegistry,
        SOME_REGISTRY,
        SomeResolver,
        SOME_RESOLVER,
      ],
    };
  }
}
```

## Rule — `forFeature(...)` uses lifecycle hooks too

Feature modules also avoid the bootstrap-class pattern. Each feature module
registers a small `@Injectable()` "seeder" that extends the existing registry
via `onModuleInit`:

```typescript
// ✅ CORRECT — a plain service that seeds extra entries on init.
@Injectable()
class SomeFeatureSeeder implements OnModuleInit {
  public constructor(
    private readonly registry: SomeRegistry,
    @Inject(SOME_FEATURE_CONFIG) private readonly options: SomeModuleOptions,
  ) {}
  public onModuleInit(): void {
    for (const entry of this.options.entries ?? []) {
      this.registry.register(entry, "feature");
    }
  }
}
```

### `forFeature(...)` seeding — use a lifecycle loader, not a marker

The **wrong** way to seed from `forFeature` is a `useFactory` that runs a side
effect and returns a sentinel:

```typescript
// ❌ ANTI-PATTERN — synthetic token whose only job is a side effect.
{
  provide: Symbol('SEED'),
  useFactory: (registry) => { seed(registry, options); return true; },
  inject: [Registry],
}
```

This is the same smell as the bootstrap class — the factory _does work_ and
returns a meaningless `true`. Instead, return an object that implements
`onApplicationBootstrap`. The container's instance loader duck-types every
resolved instance and calls the hook, so the seeding runs in the proper
lifecycle phase:

```typescript
// ✅ CORRECT — the factory returns a real lifecycle loader.
{
  provide: seedLoaderToken('route-seed'), // unique per call (last-wins container)
  useFactory: (registry: Registry) =>
    createSeedLoader(() => {
      for (const entry of options.entries ?? []) registry.register(entry, 'feature');
    }),
  inject: [Registry],
}
```

Where `createSeedLoader(fn)` returns `{ onApplicationBootstrap() { fn(); } }`.
Two properties matter:

1. **The token is unique per `forFeature` call.** The container is last-wins per
   token (no multi-providers), so a shared token would drop every contribution
   but the last.
2. **Seeding is a lifecycle hook, not a constructor / factory side effect.** It
   runs after all `onModuleInit` hooks, alongside discovery.

## Enforcement

- Search for `class *Bootstrap` inside package `src/`. Zero hits allowed.
- Search for `_BOOTSTRAP` symbol tokens whose only consumer is the same
  package's own module. Zero hits allowed.
- Search for `useFactory` bodies that end in `return true;` / `return null;`
  after a side effect. Zero hits allowed — use a `createSeedLoader(...)` that
  returns an `onApplicationBootstrap` object instead.
- Every `Registry` / `Manager` / `Service` that owns mutable state should
  implement `OnModuleInit` when it needs post-wire population.
- Every service that scans other modules (discovery, loaders) should implement
  `OnApplicationBootstrap`.

## When you're tempted

If you find yourself writing `class SomethingBootstrap`, stop. Ask:

1. **What state am I populating?** — Move the population into that state's own
   `onModuleInit`.
2. **What am I scanning?** — Move the scanning into a properly-named loader
   service (`XLoader`, `XDiscovery`) that implements `OnApplicationBootstrap`.
3. **Why can't I use the existing lifecycle hooks?** — If the answer is "the
   container doesn't call them for my provider," fix the wiring (the provider
   must be listed in `providers: [...]` — not `exports` only). Never work around
   it with a synthetic bootstrap class.
