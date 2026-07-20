# @stackra/config

Configuration + DI namespace registry for the Stackra framework.

Derived from [`@nestjs/config@4.0.4`](https://github.com/nestjs/config) by Kamil
Myśliwiec (MIT); forked and adapted for browser + Vite runtimes so the same
package boots cleanly in a Node.js server AND a Vite / browser SPA — a single
import for both surfaces.

## Installation

```bash
pnpm add @stackra/config @stackra/container @stackra/contracts @stackra/support reflect-metadata
```

Optional peer:

```bash
pnpm add joi   # only needed if you use `validationSchema`
```

## API surface

| Export                  | Kind     | Purpose                                                                            |
| ----------------------- | -------- | ---------------------------------------------------------------------------------- |
| `ConfigModule`          | class    | Primary entry — `.forRoot(options)` / `.forFeature(cfg)` / `.envVariablesLoaded`.  |
| `ConditionalModule`     | class    | `.registerWhen(module, condition, opts?)` — env-driven conditional module loading. |
| `ConfigService`         | class    | Injectable runtime service — `.get`/`.getOrThrow`/`.set`/`.describe`.              |
| `registerAs`            | function | Registers a namespaced config factory; returns factory + `.KEY` + `.asProvider()`. |
| `getConfigToken`        | function | Derives the `'CONFIGURATION(<namespace>)'` DI token from a namespace.              |
| `env`                   | function | `env(key, default?)` + `.number` / `.bool` / `.orFail` / `.enum` / `.url` methods. |
| `defineConfig`          | function | DEPRECATED alias for `registerAs`; emits a runtime warning; removed in v0.2.       |
| `ConfigType<F>`         | type     | Resolves the awaited return type of a `registerAs` factory.                        |
| `ConfigError`           | class    | Base error class for the family.                                                   |
| `ConfigMissingKeyError` | class    | Thrown by `getOrThrow(path)` when the path is unresolved.                          |
| `ConfigReadonlyError`   | class    | Reserved for v0.2 read-only source protection.                                     |
| `ConfigValidationError` | class    | Thrown when `validate` / `validationSchema` rejects the env record.                |
| `ConfigEnvMissingError` | class    | Thrown by `env.orFail(key)` when the variable is unset.                            |
| `ConfigEnvInvalidError` | class    | Thrown by `env.enum` / `env.url` on invalid input.                                 |

Every DI token (`CONFIGURATION_TOKEN`, `CONFIGURATION_SERVICE_TOKEN`,
`CONFIGURATION_LOADER`, `VALIDATED_ENV_LOADER`) and every interface / type
(`IConfigService`, `IConfigFactory`, `IConfigModuleOptions`, `ConfigObject`,
`NoInferType`, `Path`, `PathValue`, `Parser`, …) lives in `@stackra/contracts` —
import them directly from there.

## Consumer patterns

### Pattern A — `registerAs` + `forRoot` load (canonical)

```typescript
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

### Pattern B — AppModule wires everything

```typescript
// apps/dashboard/src/app.module.ts
import { Module } from "@stackra/container";
import { ConfigModule } from "@stackra/config";
import { CacheModule } from "@stackra/cache";

import { cacheConfig } from "@/config/cache.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cacheConfig],
      cache: true,
    }),
    CacheModule.forRootAsync(cacheConfig.asProvider()),
  ],
})
export class AppModule {}
```

### Pattern C — consuming inside a service (typed inject)

```typescript
import { Inject, Injectable } from "@stackra/container";
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

### Pattern D — dynamic lookup via `ConfigService`

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
    return this.config.getOrThrow<number>("PORT");
  }
}
```

### Pattern E — conditional module loading

```typescript
import { ConditionalModule, ConfigModule } from "@stackra/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConditionalModule.registerWhen(RedisCacheModule, "USE_REDIS"),
    ConditionalModule.registerWhen(SentryModule, (env) => !!env["SENTRY_DSN"]),
  ],
})
export class AppModule {}
```

### Pattern F — Joi validation (opt-in)

```typescript
import * as Joi from "joi";

const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [cacheConfig],
    }),
  ],
})
export class AppModule {}
```

### Pattern G — custom `validate` (Zod / valibot / hand-rolled)

```typescript
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

function validate(raw: Record<string, unknown>) {
  return EnvSchema.parse(raw);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [cacheConfig],
    }),
  ],
})
export class AppModule {}
```

## `env()` — typed environment access

Wraps `@stackra/support`'s `Env` class. Three-source resolution (`process.env` →
`import.meta.env` → `globalThis.__ENV__`), so the same call works in Node and in
a Vite build.

```typescript
env("APP_NAME", "stackra-app"); // string, default 'stackra-app'
env.number("PORT", 3000); // number, NaN-safe
env.bool("DEBUG", false); // boolean; 'true'|'1'|'yes'|'on' → true
env.orFail("JWT_SECRET"); // throws ConfigEnvMissingError if unset
env.enum("NODE_ENV", ["development", "production", "test"], "development");
env.url("API_URL", "http://localhost:3000"); // returns URL; throws on invalid input
```

## `ConfigService.describe()` — snapshot API

**Stackra addition** — not in `@nestjs/config`. Returns a flat record keyed by
dotted property path, with value + source provenance + a redaction sentinel for
sensitive keys.

```typescript
const snapshot = configService.describe({
  redactedKeys: [/_SECRET$/, /_KEY$/, /_TOKEN$/],
});
// {
//   'cache.prefix': { value: 'dashboard:', source: 'load', isDefault: false, path: 'cache.prefix' },
//   'auth.jwt_secret': { value: '***REDACTED***', source: 'validated', isDefault: false, path: 'auth.jwt_secret' },
//   ...
// }
```

## Migration guide

### Before (per-package `defineConfig`)

```typescript
import { defineConfig } from "@stackra/cache";

export default defineConfig({
  default: "memory",
  stores: { memory: { driver: "memory" } },
  prefix: "app:",
  ttl: 3600,
});
```

```typescript
import cacheConfig from "@/config/cache.config";

@Module({
  imports: [CacheModule.forRoot(cacheConfig)],
})
export class AppModule {}
```

### After (`@stackra/config`)

```typescript
import { registerAs, env } from "@stackra/config";
import type { ICacheModuleConfig } from "@stackra/cache";

export const cacheConfig = registerAs<ICacheModuleConfig>("cache", () => ({
  default: env("CACHE_STORE", "memory"),
  ttl: env.number("CACHE_TTL", 3600),
  prefix: env("CACHE_PREFIX", "app:"),
  stores: { memory: { driver: "memory" } },
}));
```

```typescript
import { ConfigModule } from "@stackra/config";
import { cacheConfig } from "@/config/cache.config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [cacheConfig], cache: true }),
    CacheModule.forRootAsync(cacheConfig.asProvider()),
  ],
})
export class AppModule {}
```

### Env-var access

| Before                                     | After                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `process.env.APP_NAME ?? 'stackra'`        | `env('APP_NAME', 'stackra')`                                               |
| `parseInt(process.env.PORT, 10) \|\| 3000` | `env.number('PORT', 3000)`                                                 |
| `process.env.TRUST_PROXY === 'true'`       | `env.bool('TRUST_PROXY', false)`                                           |
| `process.env.NODE_ENV`                     | `env.enum('NODE_ENV', ['development','production','test'], 'development')` |

### Consuming inside a service

| Before                                                | After                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@Inject(CACHE_CONFIG) private readonly cfg: ICache…` | `@Inject(cacheConfig.KEY) private readonly cfg: ConfigType<typeof cacheConfig>` |

## Scope of v0.1

**Adopted verbatim from `@nestjs/config`:** `registerAs` / `.KEY` /
`.asProvider()`, `ConfigModule.forRoot` (every option in
`IConfigModuleOptions`), `ConfigModule.forFeature`,
`ConfigModule.envVariablesLoaded`, `ConfigService` (get / getOrThrow / set — all
4 overloads each), `ConditionalModule.registerWhen`, and
`ConfigType<typeof cfg>`.

**Stackra additions:** the six-method `env(...)` façade,
`ConfigService.describe()`, the `ConfigError` family with stable `code` fields,
browser-safe `isNode()` guards, and the `createSeedLoader` lifecycle wiring per
`.kiro/steering/module-lifecycle.md`.

**Deferred to v0.2:** the `changes$` rxjs observable, the Vite plugin
(compile-time namespace autocomplete), Doppler / HTTP config drivers, React
hooks (`useConfig`, `useConfigValue`), NestJS-compat subpath.

## Development

From inside `packages/config/`:

```bash
pnpm typecheck   # tsc --noEmit
pnpm build       # tsup dual ESM/CJS + .d.ts
pnpm test        # vitest run
```

## Credit

`@stackra/config` is a derivative work of
[`@nestjs/config@4.0.4`](https://github.com/nestjs/config) by Kamil Myśliwiec,
licensed MIT. Every source file whose content was ported from upstream carries
`@derived @nestjs/config@4.0.4 — <original path>` in its top-of-file docblock.
The `NOTICE` file at the package root records the divergences from upstream.

Copyright (c) 2018-present Kamil Myśliwiec. Copyright (c) 2025 Stackra L.L.C.
