/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/modules
 * @description DI module-related interfaces — providers, module metadata,
 *   async options. Standalone type aliases (Provider, InjectionToken,
 *   OptionalFactoryDependency) live in ../../types/.
 */

export type { ForwardReference } from "./forward-reference.interface";
export type { DynamicModule } from "./dynamic-module.interface";
export type { ModuleMetadata } from "./module-metadata.interface";
export type {
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
} from "./provider.interface";
export type { IAsyncModuleOptions } from "./async-module-options.interface";
