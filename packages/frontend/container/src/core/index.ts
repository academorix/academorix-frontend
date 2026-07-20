/**
 * @stackra/container
 *
 * NestJS-compatible dependency injection for both client and server.
 * Structurally identical to NestJS's DI — same decorators, modules,
 * lifecycle hooks, and provider patterns.
 *
 * @module @stackra/container
 */

import "reflect-metadata";

// ============================================================================
// Decorators
// ============================================================================
export { Inject } from "./decorators/inject.decorator";
export { Module } from "./decorators/module.decorator";
export { Global } from "./decorators/global.decorator";
export { Optional } from "./decorators/optional.decorator";
export { Injectable } from "./decorators/injectable.decorator";

// ============================================================================
// DI foundation types & enums (re-exported from @stackra/contracts)
// ============================================================================
export type {
  Type,
  InjectionToken,
  OptionalFactoryDependency,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  ModuleMetadata,
  DynamicModule,
  ForwardReference,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  BeforeApplicationShutdown,
  ScopeOptions,
} from "@stackra/contracts";

export { Scope } from "@stackra/contracts";

// ============================================================================
// Utilities
// ============================================================================
export { forwardRef } from "./utils/forward-ref.util";
export { defineConfig } from "./utils/define-config.util";
export { registerWith } from "./utils/register-with.util";
export { hasOnModuleInit } from "./utils/has-on-module-init.util";
export { hasOnModuleDestroy } from "./utils/has-on-module-destroy.util";

// ============================================================================
// Application Bootstrap
// ============================================================================
export { ApplicationFactory } from "./application/application.factory";
export { ApplicationContext } from "./application/application-context.service";
export { ApplicationBuilder } from "./application/application-builder.service";
export {
  getGlobalApplicationContext,
  hasGlobalApplicationContext,
  clearGlobalApplicationContext,
} from "./utils/global-application.util";

// ============================================================================
// inject() — Lazy DI resolution for module-level constants
// ============================================================================
export { inject } from "./utils/inject.util";

// ============================================================================
// DI Engine (Container, Injector, Scanner, Module, etc.)
// ============================================================================
export { Injector } from "./container/injector.service";
export { ModuleContainer } from "./container/container.registry";
export { ModuleRef } from "./container/module-ref";
export type { IModuleRefGetOptions } from "./container/module-ref";
export { DependenciesScanner } from "./container/scanner.service";
export { InstanceWrapper } from "./container/instance-wrapper";

// ============================================================================
// Services
// ============================================================================
export { Reflector } from "./module/reflector.service";

// ============================================================================
// Discovery
// ============================================================================
export {
  DiscoveryService,
  ContainerDiscoveryService,
  DiscoveryModule,
  DiscoverableMetaHostCollection,
} from "./discovery";

// ============================================================================
// Constants
// ============================================================================
export {
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  INJECTABLE_WATERMARK,
  GLOBAL_MODULE_METADATA,
  SCOPE_OPTIONS_METADATA,
  OPTIONAL_DEPS_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  DISCOVERABLE_DECORATOR_KEY_PREFIX,
  DEFAULT_GLOBAL_NAME,
} from "./constants";

// ============================================================================
// Devtools
// ============================================================================
export { ContainerLogger } from "./devtools";

// ============================================================================
// Mixins
// ============================================================================
export { WithEnvironment } from "./mixins";
export type { IEnvironmentAware } from "./mixins";
