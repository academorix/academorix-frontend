/**
 * @file analytics.module.ts
 * @module @stackra/routing/analytics
 * @description DI module for the routing analytics subsystem.
 *
 *   Registers `RouteAnalyticsService`. The service is a fan-in on top
 *   of `IAnalyticsManager` from `@stackra/contracts` and holds no
 *   state — so the module is a plain provider list.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { RouteAnalyticsService } from "./services/route-analytics.service";

/**
 * The routing analytics DI module.
 */
@Module({})
export class AnalyticsModule {
  /**
   * Global registration — wires `RouteAnalyticsService`.
   */
  public static forRoot(): DynamicModule {
    return {
      module: AnalyticsModule,
      global: true,
      providers: [RouteAnalyticsService],
      exports: [RouteAnalyticsService],
    };
  }
}
