/**
 * @file require-permission.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * `@RequirePermission(permission)` — stamps a permission requirement
 * on a route component / page module.
 */

import { REQUIRE_PERMISSION_METADATA_KEY } from "@stackra/contracts";

import { createMetadataClassDecorator, createMetadataReader } from "../core";

/** Options for `@RequirePermission(...)`. */
export interface IRequirePermissionOptions {
  /** The permission string the caller must have. */
  readonly permission: string;
}

/** Base decorator — stamps the metadata bag. */
const stamp = createMetadataClassDecorator<IRequirePermissionOptions>(
  REQUIRE_PERMISSION_METADATA_KEY,
);

/**
 * Stamp a permission requirement on the target class.
 *
 * @param permission - The required permission string.
 * @returns A `ClassDecorator` that stamps the requirement.
 *
 * @example
 * ```typescript
 * @RequirePermission('users.viewAll')
 * export class AdminUsersPage { ... }
 * ```
 */
export function RequirePermission(permission: string): ClassDecorator {
  return stamp({ permission });
}

/** Reader for `@RequirePermission(...)` metadata. */
export const requirePermissionMetadata = createMetadataReader<IRequirePermissionOptions>(
  REQUIRE_PERMISSION_METADATA_KEY,
);
