/**
 * @file config-module-async-options.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Async-options tuple accepted by `<X>Module.forRootAsync`
 *   and returned by `IConfigFactoryKeyHost.asProvider()`.
 *
 * @derived @nestjs/config@4.0.4 — factory-provider shape used across
 *   `forRootAsync` / `forFeature` / `registerAs.asProvider()` (MIT, © Kamil Myśliwiec)
 */

import type { InjectionToken } from "@/types/injection-token.type";
import type { OptionalFactoryDependency } from "@/types/optional-factory-dependency.type";
import type { ModuleMetadata } from "../modules/module-metadata.interface";

/**
 * Canonical async-options shape for `<X>Module.forRootAsync`.
 *
 * Two producers write into this shape:
 *
 * 1. Hand-written `{ imports, useFactory, inject }` — the traditional
 *    NestJS async factory form.
 * 2. `registerAs(...).asProvider()` — a registered config factory's
 *    self-descriptor; produces this shape verbatim so the two paths
 *    are interchangeable.
 *
 * ## Why `useFactory` args are typed `any[]`
 *
 * The factory's positional arguments derive from the runtime `inject`
 * array and cannot be inferred precisely without unsafe variadic-tuple
 * gymnastics. Matches the existing `IAsyncModuleOptions` convention
 * used elsewhere in the workspace.
 *
 * @typeParam T - Shape of the resolved options the factory produces.
 * @publicApi
 *
 * @example
 * ```typescript
 * // Hand-written form:
 * CacheModule.forRootAsync({
 *   useFactory: (env: EnvService) => ({ ttl: env.get('CACHE_TTL') }),
 *   inject: [EnvService],
 * });
 *
 * // Or via a registered config factory:
 * CacheModule.forRootAsync(cacheConfig.asProvider());
 * ```
 */
export interface IConfigModuleAsyncOptions<T = unknown> {
  /** Modules to import before the factory resolves. */
  imports?: ModuleMetadata["imports"];

  /** Async factory producing the resolved options. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory: (...args: any[]) => T | Promise<T>;

  /** Providers injected as positional arguments into `useFactory`. */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
