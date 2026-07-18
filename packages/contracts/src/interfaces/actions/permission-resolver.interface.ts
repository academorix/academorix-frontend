/**
 * @file permission-resolver.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Consumer-supplied permission resolver for the action
 *   authorization middleware.
 */

import type { IActionContext } from "./action-context.interface";

/**
 * Answer whether the current caller is permitted to execute an action
 * carrying a specific permission tag.
 *
 * Bound to the `PERMISSION_RESOLVER` token in `ActionsModule.forRoot`.
 * The authorize middleware calls this for every descriptor with a
 * `permission` field and short-circuits the dispatch when it returns
 * falsy.
 */
export type IPermissionResolver = (
  permission: string,
  context: IActionContext,
) => boolean | Promise<boolean>;
