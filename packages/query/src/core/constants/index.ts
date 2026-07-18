/**
 * @file index.ts
 * @module @stackra/query/core/constants
 * @description Defaults for the query module.
 */

import type { QueryModuleOptions } from '../interfaces/query-module-options.interface';

/** Default query-layer configuration. */
export const DEFAULT_QUERY_CONFIG: Required<QueryModuleOptions> = {
  defaultStaleTime: 0,
  defaultRefetchInterval: 0,
  refetchOnWindowFocus: false,
  defaultMutationMode: 'pessimistic',
  undoableTimeout: 5000,
  defaultLiveMode: 'off',
};
