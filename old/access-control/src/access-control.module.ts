/**
 * @file access-control.module.ts
 * @module @academorix/access-control
 *
 * @description
 * DI module wiring the access-control service graph. Consumer
 * apps import `AccessControlModule.forRoot()` into their root
 * `AppModule` AFTER `HttpModule.forRoot()`.
 *
 * Registers all three tokens:
 *
 *   - `PLATFORM_ACCESS_CONTROL_SERVICE` → `PlatformAccessControlService`
 *   - `TENANT_ACCESS_CONTROL_SERVICE`   → `TenantAccessControlService`
 *   - `ACCESS_CONTROL_SERVICE`          → aliased to whichever
 *                                          matches `config.defaultGuard`
 */

import { Module, type DynamicModule } from "@academorix/container";

import defaultConfig from "../config/access-control.config";
import {
  ACCESS_CONTROL_OPTIONS_TOKEN,
  type IAccessControlConfig,
  type IAccessControlModuleOptions,
} from "@academorix/contracts";
import { Guard } from "@academorix/contracts";
import {
  PlatformAccessControlService,
  TenantAccessControlService,
} from "./services/access-control/access-control.service";
import {
  ACCESS_CONTROL_SERVICE,
  PLATFORM_ACCESS_CONTROL_SERVICE,
  TENANT_ACCESS_CONTROL_SERVICE,
} from "@academorix/contracts";
import { mergeAccessControlConfig } from "./utilities/merge-config";

/**
 * Fully-populated package default.
 */
const DEFAULT_CONFIG: IAccessControlConfig = {
  ...(defaultConfig as IAccessControlConfig),
  defaultGuard: (defaultConfig as IAccessControlConfig).defaultGuard ?? Guard.Tenant,
};

/**
 * AccessControlModule — wires the access-control service graph.
 *
 * @category Module
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     HttpModule.forRoot({ baseUrl, tokenProvider }),
 *     AccessControlModule.forRoot({ defaultGuard: 'tenant' }),
 *   ],
 * })
 * class AppModule {}
 * ```
 */
@Module({})
export class AccessControlModule {
  /**
   * Root binding — call once at the app entry.
   *
   * @param options - Optional partial override merged into the
   *   package default.
   */
  public static forRoot(options?: IAccessControlModuleOptions): DynamicModule {
    const merged = mergeAccessControlConfig(DEFAULT_CONFIG, options);

    const DefaultConcrete =
      merged.defaultGuard === Guard.Platform
        ? PlatformAccessControlService
        : TenantAccessControlService;

    return {
      module: AccessControlModule,
      global: true,
      providers: [
        { provide: ACCESS_CONTROL_OPTIONS_TOKEN, useValue: merged },
        PlatformAccessControlService,
        TenantAccessControlService,
        {
          provide: PLATFORM_ACCESS_CONTROL_SERVICE,
          useExisting: PlatformAccessControlService,
        },
        {
          provide: TENANT_ACCESS_CONTROL_SERVICE,
          useExisting: TenantAccessControlService,
        },
        { provide: ACCESS_CONTROL_SERVICE, useExisting: DefaultConcrete },
      ],
      exports: [
        ACCESS_CONTROL_OPTIONS_TOKEN,
        PlatformAccessControlService,
        TenantAccessControlService,
        PLATFORM_ACCESS_CONTROL_SERVICE,
        TENANT_ACCESS_CONTROL_SERVICE,
        ACCESS_CONTROL_SERVICE,
      ],
    };
  }
}
