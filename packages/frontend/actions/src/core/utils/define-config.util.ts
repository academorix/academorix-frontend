/**
 * @file define-config.util.ts
 * @module @stackra/actions/core/utils
 * @description Typed identity function for authoring action config in a
 *   `config/actions.config.ts` file.
 */

import type { IActionsModuleOptions } from "@stackra/contracts";

/**
 * Authoring helper for the actions module config.
 *
 * ```ts
 * // config/actions.config.ts
 * import { defineConfig } from '@stackra/actions';
 *
 * export default defineConfig({
 *   permissionResolver: (perm, ctx) => user.hasPermission(perm),
 * });
 * ```
 */
export function defineConfig(config: IActionsModuleOptions): IActionsModuleOptions {
  return config;
}
