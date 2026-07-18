/**
 * @file default-actions-config.constant.ts
 * @module @stackra/actions/core/constants
 * @description Defaults applied by `mergeConfig` when the caller omits
 *   a field from {@link IActionsModuleOptions}.
 */

import type { IActionsConfig } from '@stackra/contracts';

/**
 * Package-wide defaults for the actions module.
 */
export const DEFAULT_ACTIONS_CONFIG: IActionsConfig = {
  middleware: [],
  logger: { level: 'info' },
};
