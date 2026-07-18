/**
 * @file index.ts
 * @module @academorix/access-control/services/access-control
 * @description Barrel exposing the concrete service classes only. Public interfaces + tokens live in `@academorix/contracts`.
 */

export {
  AccessControlService,
  PlatformAccessControlService,
  TenantAccessControlService,
} from "./access-control.service";
