import type { InjectionToken } from "@/types/injection-token.type";
import type { ModuleMetadata } from "./module-metadata.interface";
import type { OptionalFactoryDependency } from "@/types/optional-factory-dependency.type";

/**
 * @file async-module-options.interface.ts
 * Canonical async-options shape for NestJS dynamic modules that register
 * a single resolved configuration via `forRootAsync()` / `forFeatureAsync()`.
 *
 * The factory function produces the module's configuration object;
 * `inject` lists the providers passed as positional arguments to the
 * factory; `imports` brings their owning modules into scope.
 *
 * ## Why `useFactory` args are `any[]`
 *
 * NestJS's own `FactoryProvider.useFactory` is typed `(...args: any[])`
 * because the factory arguments derive from the runtime `inject` array
 * and cannot be inferred precisely at the interface level without
 * unsafe variadic-tuple gymnastics. Adopting `any[]` here matches NestJS
 * first-party modules and is the canonical pattern.
 *
 * @typeParam T - Shape of the resolved options the factory produces.
 *
 * @example
 * ```typescript
 * public static forRootAsync(
 *   options: IAsyncModuleOptions<ISlackModuleOptions>,
 * ): DynamicModule {
 *   return {
 *     module: NestSlackModule,
 *     imports: options.imports ?? [],
 *     providers: [
 *       {
 *         provide: SLACK_CONFIG,
 *         useFactory: options.useFactory,
 *         inject: options.inject ?? [],
 *       },
 *     ],
 *   };
 * }
 * ```
 */
export interface IAsyncModuleOptions<T> {
  /** Modules to import before the factory resolves. */
  imports?: ModuleMetadata["imports"];

  /** Async factory producing the resolved options. */
  useFactory: (...args: any[]) => T | Promise<T>;

  /** Providers injected as positional arguments into `useFactory`. */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
