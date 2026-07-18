/**
 * @file query-actions.module.ts
 * @module @stackra/query/actions
 * @description DI module wiring the query / refresh action handlers.
 *
 *   The `QUERY_CLIENT` binding lives in `QueryModule.forRoot`
 *   (from `@stackra/query`) — it points at the shared `QueryService`
 *   which implements `IQueryClient`. This module only registers the
 *   handlers that consume it.
 */

import { Global, Module, type DynamicModule } from '@stackra/container';

import { QueryHandler } from './handlers/query.handler';
import { RefreshHandler } from './handlers/refresh.handler';

/**
 * DI module registering the query / refresh action handlers.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     QueryModule.forRoot({ ... }),
 *     QueryActionsModule.forRoot(),
 *     ActionsModule.forFeature([QueryHandler, RefreshHandler]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class QueryActionsModule {
  public static forRoot(): DynamicModule {
    return {
      module: QueryActionsModule,
      global: true,
      providers: [QueryHandler, RefreshHandler],
      exports: [QueryHandler, RefreshHandler],
    };
  }
}
