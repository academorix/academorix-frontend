/**
 * @file merge-config.util.ts
 * @module @stackra/actions/core/utils
 * @description Merge caller-supplied options over the package defaults.
 *
 *   `ActionsModule.forRoot` and `ActionsModule.forRootAsync` both route
 *   through this function — no service merges defaults inline.
 */

import type { IActionsConfig, IActionsModuleOptions } from '@stackra/contracts';
import { DEFAULT_ACTIONS_CONFIG } from '../constants/default-actions-config.constant';

/**
 * Merge caller-supplied action options over {@link DEFAULT_ACTIONS_CONFIG}.
 */
export function mergeConfig(options: IActionsModuleOptions = {}): IActionsConfig {
  return {
    permissionResolver: options.permissionResolver,
    middleware: options.middleware ?? DEFAULT_ACTIONS_CONFIG.middleware,
    logger: {
      level: options.logger?.level ?? DEFAULT_ACTIONS_CONFIG.logger.level,
    },
  };
}
