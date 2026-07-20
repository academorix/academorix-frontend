# @stackra/container

Client-side dependency-injection container for the Stackra framework —
Nest-style decorators (`@Injectable`, `@Module`, `@Inject`, `@Optional`) with
async factories, dynamic modules, lifecycle hooks, discovery, and React
bindings. Zero server runtime.

## Install

```bash
pnpm add @stackra/container @stackra/contracts reflect-metadata
```

Import `reflect-metadata` once at the top of your entry file:

```typescript
import "reflect-metadata";
```

## Quick start

```typescript
// user.service.ts
import { Injectable } from "@stackra/container";

@Injectable()
export class UserService {
  greet(name: string) {
    return `Hello ${name}`;
  }
}

// app.module.ts
import { Module } from "@stackra/container";
import { UserService } from "./user.service";

@Module({
  providers: [UserService],
  exports: [UserService],
})
export class AppModule {}

// main.ts
import "reflect-metadata";
import { ApplicationFactory } from "@stackra/container";
import { AppModule } from "./app.module";

const app = await ApplicationFactory.create(AppModule);
const user = app.get(UserService);
console.log(user.greet("World"));
```

## Public API

### Decorators

| Decorator                                  | Purpose                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `@Injectable()`                            | Marks a class as resolvable by the container.                       |
| `@Injectable({ scope })`                   | Sets scope: `DEFAULT` (singleton), `TRANSIENT`, or `REQUEST`.       |
| `@Module({ imports, providers, exports })` | Declares a DI module.                                               |
| `@Global()`                                | Marks a module as globally visible (skip re-importing).             |
| `@Inject(token)`                           | Overrides the parameter type for injection.                         |
| `@Optional()`                              | Marks a parameter as optional (resolves to `undefined` if missing). |
| `@InjectProperty(token)`                   | Property injection.                                                 |

### Providers (declarative)

Every provider shape supported by NestJS is here:

```typescript
@Module({
  providers: [
    // ClassProvider
    UserService,
    { provide: UserService, useClass: UserService },

    // ValueProvider
    { provide: "CONFIG", useValue: { debug: true } },

    // FactoryProvider (sync or async)
    {
      provide: "DATABASE",
      useFactory: async (config) => await connect(config),
      inject: ["CONFIG"],
    },

    // ExistingProvider (alias)
    { provide: "ALIAS", useExisting: UserService },
  ],
})
export class AppModule {}
```

### ApplicationFactory

```typescript
import { ApplicationFactory } from "@stackra/container";

// Minimal
const app = await ApplicationFactory.create(AppModule);

// With options
const app = await ApplicationFactory.create(AppModule, {
  debug: true, // exposes window[globalName] for devtools
  globalName: "__APP__",
  shutdownHooks: true, // registers beforeunload/SIGTERM handlers
  logging: {
    enabled: true,
    resolution: true,
    lifecycle: true,
    timing: true,
    graph: true,
    colors: true,
  },
});

// Resolve providers
const svc = app.get(UserService);
const cfg = app.get<AppConfig>("CONFIG");

// Close manually
await app.close();
```

### Lifecycle hooks

Implement any of the hook interfaces from `@stackra/contracts`:

```typescript
import { Injectable } from "@stackra/container";
import type { OnModuleInit, OnModuleDestroy } from "@stackra/contracts";

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    /* connect */
  }
  async onModuleDestroy() {
    /* disconnect */
  }
}
```

Available hooks: `OnModuleInit`, `OnModuleDestroy`, `OnApplicationBootstrap`,
`OnApplicationShutdown`.

### Dynamic modules

```typescript
@Module({})
export class MyModule {
  static forRoot(config: MyConfig): DynamicModule {
    return {
      module: MyModule,
      providers: [{ provide: "MY_CONFIG", useValue: config }],
      exports: ["MY_CONFIG"],
    };
  }

  static forRootAsync(options: IAsyncModuleOptions<MyConfig>): DynamicModule {
    return {
      module: MyModule,
      providers: [
        {
          provide: "MY_CONFIG",
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ],
      exports: ["MY_CONFIG"],
    };
  }
}
```

### Discovery

Any provider that imports `DiscoveryModule` (bundled) can scan all providers in
the graph for decorators and metadata:

```typescript
import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IDiscoveryService } from "@stackra/contracts";

@Injectable()
class MyLoader {
  constructor(
    @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();
    for (const wrapper of providers) {
      const metadata = Reflect.getMetadata(
        "my:key",
        wrapper.instance.constructor,
      );
      if (metadata) {
        /* … */
      }
    }
  }
}
```

### React bindings — `@stackra/container/react`

```tsx
import { ApplicationFactory } from "@stackra/container";
import {
  ContainerProvider,
  useInject,
  useOptionalInject,
} from "@stackra/container/react";

const app = await ApplicationFactory.create(AppModule);

ReactDOM.createRoot(root).render(
  <ContainerProvider>
    <App />
  </ContainerProvider>,
);

function UserProfile() {
  const users = useInject(UserService);
  const cache = useOptionalInject(CACHE_MANAGER); // returns undefined if not registered
  return <div>{users.greet("World")}</div>;
}
```

Hooks available: `useInject`, `useOptionalInject`, `useContainer`,
`useDiscovery`.

## Configuration

Copy the container config template into your app:

```bash
cp node_modules/@stackra/container/config/container.config.ts src/config/container.config.ts
```

Then pass it to the factory:

```typescript
import { containerConfig } from "@/config/container.config";
await ApplicationFactory.create(AppModule, containerConfig);
```

## Testing helper — `@stackra/container/testing`

Assertable `IApplication`-compatible mock for services that inject `APPLICATION`
or otherwise depend on a container:

```typescript
import { createMockApplication } from "@stackra/container/testing";
import { LOGGER_MANAGER } from "@stackra/contracts";
import { createMockLoggerManager } from "@stackra/logger/testing";

// Pre-populate the container with the tokens your service under test needs
const logger = createMockLoggerManager();
const app = createMockApplication([[LOGGER_MANAGER, logger]]);

service.setup(app);
app.$.assertCalled("get").with(LOGGER_MANAGER).once();

// Or use the classic API
expect(app.has(LOGGER_MANAGER)).toBe(true);
expect(app.get(LOGGER_MANAGER)).toBe(logger);
```

Implements the full public `IApplication` surface (`get`, `getOptional`, `has`,
`resolve`, `provide`, `close`) — no real DI graph, no module scanning, just a
`Map<InjectionToken, unknown>` you can seed and interrogate.

## Subpaths

| Import                       | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `@stackra/container`         | `Injectable`, `Module`, `Inject`, `ApplicationFactory`, hooks |
| `@stackra/container/react`   | `ContainerProvider`, `useInject`, `useOptionalInject`         |
| `@stackra/container/testing` | `createMockApplication()`, `MockApplication`                  |

## License

MIT
