/**
 * @file index.ts
 * @module @stackra/query/actions
 * @description Framework action handlers shipped by `@stackra/query`.
 *
 *   `QUERY_CLIENT` is bound in `QueryModule.forRoot` (points at the
 *   shared `QueryService`) — this subpath ships only the handlers.
 */

export { QueryActionsModule } from "./query-actions.module";
export { QueryHandler } from "./handlers/query.handler";
export { MutateHandler } from "./handlers/mutate.handler";
export { RefreshHandler } from "./handlers/refresh.handler";
