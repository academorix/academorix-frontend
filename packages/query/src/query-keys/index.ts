/**
 * @file index.ts
 * @module @academorix/query/query-keys
 *
 * @description
 * Public barrel for the canonical query-key helpers.
 */

export {
  buildQueryKey,
  DEFAULT_QUERY_KEY_PREFIX,
  listKey,
  manyKey,
  oneKey,
} from "./build-query-key.util";
export type { ResourceOperation } from "./build-query-key.util";
