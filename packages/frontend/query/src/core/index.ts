/**
 * @file index.ts
 * @module @stackra/query
 * @description Root barrel — the primary import surface for the
 *   store-backed query layer.
 *
 *   Owns the query DI module (`QueryModule`), its configuration
 *   token, and the shared services (`QueryService`,
 *   `UndoableQueueService`). The query hooks themselves
 *   (`useQuery`, `useMutation`, `usePublish`, `useLiveSubscription`)
 *   ship through the `./react` subpath.
 */

export { QueryModule } from "./query.module";
export { QUERY_CONFIG } from "./tokens";
export { defineConfig } from "./utils";
export {
  QueryService,
  UndoableQueueService,
  type QueryServiceMutation,
  type QueryServiceOptimistic,
  type QueryServicePublishEvent,
  type QueryServicePublishOptions,
  type QueryServiceQuery,
  type QueryServiceSubscribe,
} from "./services";
export type { QueryModuleOptions } from "./interfaces";
