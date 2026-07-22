/**
 * @file index.ts
 * Container Barrel Export
 *
 * Pure DI engine: injector, registries, scanner, instance loader, module internals.
 *
 * @module @stackra/container/container
 */

export { Injector } from "./injector.service";
export { InstanceLoader } from "./instance-loader.service";
export { DependenciesScanner } from "./scanner.service";
export { ModuleContainer } from "./container.registry";
export { DiscoverableMetaHostCollection } from "./discoverable-meta-host-collection.registry";
export { Module } from "./module";
export { ModuleRef } from "./module-ref";
export type { IModuleRefGetOptions } from "./module-ref";
export { InstanceWrapper } from "./instance-wrapper";
