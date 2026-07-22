/**
 * @file guard.module.ts
 * @module @stackra/routing/guards
 * @description DI module for the routing guard subsystem.
 *
 *   `forRoot()` wires the registry, adapter, and discovery loader.
 *   Guard classes register themselves via `@Guard(...)` + discovery —
 *   no explicit configuration required at the module level.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { GuardAdapterService } from "./services/guard-adapter.service";
import { GuardLoader } from "./services/guard-loader.service";
import { GuardRegistryService } from "./services/guard-registry.service";

/**
 * The routing guard DI module.
 */
@Module({})
export class GuardModule {
  /**
   * Global registration — wires the registry, adapter, and discovery
   * loader.
   */
  public static forRoot(): DynamicModule {
    return {
      module: GuardModule,
      global: true,
      providers: [GuardRegistryService, GuardAdapterService, GuardLoader],
      exports: [GuardRegistryService, GuardAdapterService],
    };
  }
}
