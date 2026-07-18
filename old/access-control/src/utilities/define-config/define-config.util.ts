/**
 * @file define-config.util.ts
 * @module @academorix/access-control/utilities/define-config
 * @description Type-safe identity function for the config file.
 */

import type { IAccessControlModuleOptions } from "@academorix/contracts";

export function defineConfig(config: IAccessControlModuleOptions): IAccessControlModuleOptions {
  return config;
}
