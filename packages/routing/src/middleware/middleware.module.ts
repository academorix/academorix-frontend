/**
 * @file middleware.module.ts
 * @module @stackra/routing/middleware
 * @description DI module for the routing middleware subsystem.
 *
 *   `forRoot()` wires the registry, resolver, and discovery loader.
 *   Middleware classes register themselves via `@Middleware(...)` +
 *   discovery — no explicit configuration required at the module
 *   level.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { MiddlewareLoaderService } from "./services/middleware-loader.service";
import { MiddlewareRegistryService } from "./services/middleware-registry.service";
import { MiddlewareResolverService } from "./services/middleware-resolver.service";

/**
 * The routing middleware DI module.
 */
@Module({})
export class MiddlewareModule {
  /**
   * Global registration — wires the registry, resolver, and discovery
   * loader. Registers no middleware; use `@Middleware` classes.
   */
  public static forRoot(): DynamicModule {
    return {
      module: MiddlewareModule,
      global: true,
      providers: [MiddlewareRegistryService, MiddlewareResolverService, MiddlewareLoaderService],
      exports: [MiddlewareRegistryService, MiddlewareResolverService],
    };
  }
}
