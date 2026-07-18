/**
 * @file defaults.constant.ts
 * @module @stackra/scope/core/constants
 * @description Default configuration values for the client scope module.
 */

import type { IScopeModuleOptions } from '../interfaces';

/** Default scope module options applied when not explicitly configured. */
export const DEFAULT_SCOPE_OPTIONS: IScopeModuleOptions = {
  initialScope: null,
  initialTree: [],
  cache: { enabled: true, ttl: 300, memorySize: 1000 },
  events: { enabled: true, channelPrefix: 'scope' },
  resolution: { maxDepth: 10, timeoutMs: 2000 },
  seeds: { strategy: 'skip_existing', definitions: [] },
};
