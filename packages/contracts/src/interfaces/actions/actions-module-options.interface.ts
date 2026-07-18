/**
 * @file actions-module-options.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Consumer-supplied configuration for `ActionsModule.forRoot`.
 */

import type { Type } from "../type.interface";
import type { IPermissionResolver } from "./permission-resolver.interface";

/**
 * Consumer-supplied configuration for `ActionsModule.forRoot()`.
 */
export interface IActionsModuleOptions {
  /**
   * Permission resolver — checked by the authorize middleware for every
   * descriptor carrying a `permission` field.
   */
  permissionResolver?: IPermissionResolver;

  /**
   * Extra middleware appended after the built-in
   * `Authorize → Log → Trace` trio.
   */
  middleware?: ReadonlyArray<Type<unknown> | string | object>;

  /**
   * Logger configuration for the action pipeline.
   */
  logger?: {
    level?: "debug" | "info" | "warn" | "error" | "silent";
  };
}

/**
 * Fully-resolved actions configuration after `mergeConfig` runs.
 */
export interface IActionsConfig {
  permissionResolver?: IPermissionResolver;
  middleware: ReadonlyArray<Type<unknown> | string | object>;
  logger: { level: "debug" | "info" | "warn" | "error" | "silent" };
}
