/**
 * Type-safe HTTP module configuration helper.
 *
 * Identity function that gives consumers full IDE autocomplete and
 * type checking for `IHttpModuleOptions` without explicit type
 * annotations on every config file.
 *
 * @module @stackra/http/utils/define-config
 */

import type { IHttpModuleOptions } from "@stackra/contracts";

/**
 * Build a typed HTTP module configuration.
 *
 * @param config - Module options.
 * @returns The same options object (identity function).
 */
export function defineConfig(config: IHttpModuleOptions): IHttpModuleOptions {
  return config;
}
