/**
 * @file require-role.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * `@RequireRole(role)` — stamps a role requirement on a route
 * component / page module. Consumed by the framework's route adapter
 * when composing the effective `guards` list.
 */

import { REQUIRE_ROLE_METADATA_KEY } from "@stackra/contracts";

import { createMetadataClassDecorator, createMetadataReader } from "../core";

/**
 * Options for `@RequireRole(...)` — stamped as an object so future
 * fields (e.g. `redirect`) can extend the shape without breaking
 * the stamp reader.
 */
export interface IRequireRoleOptions {
  /** The role the caller must have. */
  readonly role: string;
}

/**
 * Base decorator — stamps the metadata bag under
 * `REQUIRE_ROLE_METADATA_KEY`.
 */
const stamp = createMetadataClassDecorator<IRequireRoleOptions>(REQUIRE_ROLE_METADATA_KEY);

/**
 * Stamp a role requirement on the target class.
 *
 * @param role - The required role name.
 * @returns A `ClassDecorator` that stamps the requirement.
 *
 * @example
 * ```typescript
 * @RequireRole('admin')
 * export class AdminUsersPage { ... }
 * ```
 */
export function RequireRole(role: string): ClassDecorator {
  return stamp({ role });
}

/** Reader for `@RequireRole(...)` metadata. */
export const requireRoleMetadata =
  createMetadataReader<IRequireRoleOptions>(REQUIRE_ROLE_METADATA_KEY);
