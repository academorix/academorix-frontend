/**
 * @file index.ts
 * @module @stackra/query/core/services
 * @description Barrel for query-layer services.
 */

export { UndoableQueueService } from "./undoable-queue.service";
export {
  QueryService,
  type QueryServiceMutation,
  type QueryServiceOptimistic,
  type QueryServicePublishEvent,
  type QueryServicePublishOptions,
  type QueryServiceQuery,
  type QueryServiceSubscribe,
} from "./query.service";
