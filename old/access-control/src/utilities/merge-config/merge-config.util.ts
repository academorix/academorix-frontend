/**
 * @file merge-config.util.ts
 * @module @academorix/access-control/utilities/merge-config
 *
 * @description
 * Deep-merges consumer overrides into the package default.
 * Nested endpoint bags merge field-by-field; the URL builder
 * functions (`rolePermissions`, `userRoles`, `userRole`) are
 * inherited from the default unless the override supplies them.
 */

import type {
  IAccessControlConfig,
  IAccessControlEndpoints,
  IAccessControlModuleOptions,
} from "@academorix/contracts";
import { Guard } from "@academorix/contracts";

/**
 * Merge a partial endpoint override into a fully-populated
 * endpoint bag.
 */
function mergeEndpoints(
  defaults: IAccessControlEndpoints,
  override: Partial<IAccessControlEndpoints> | undefined,
): IAccessControlEndpoints {
  if (!override) return defaults;
  return {
    can: override.can ?? defaults.can,
    mine: override.mine ?? defaults.mine,
    permissions: override.permissions ?? defaults.permissions,
    roles: override.roles ?? defaults.roles,
    rolePermissions: override.rolePermissions ?? defaults.rolePermissions,
    userRoles: override.userRoles ?? defaults.userRoles,
    userRole: override.userRole ?? defaults.userRole,
  };
}

/**
 * Deep-merge two access-control configs.
 *
 * @param defaults - Package default from `config/access-control.config.ts`.
 * @param override - Consumer-supplied partial override.
 * @returns Fully-populated config.
 */
export function mergeAccessControlConfig(
  defaults: IAccessControlConfig,
  override: IAccessControlModuleOptions | undefined,
): IAccessControlConfig {
  if (!override) return defaults;
  return {
    platformEndpoints: mergeEndpoints(defaults.platformEndpoints, override.platformEndpoints),
    tenantEndpoints: mergeEndpoints(defaults.tenantEndpoints, override.tenantEndpoints),
    meEndpoint: override.meEndpoint ?? defaults.meEndpoint,
    defaultGuard: override.defaultGuard ?? defaults.defaultGuard ?? Guard.Tenant,
  };
}
