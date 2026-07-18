/**
 * @file query.module.ts
 * @module @stackra/query/core
 * @description DI module for the TanStack Query-backed query layer.
 *
 *   Binds four things:
 *
 *   1. **`QUERY_CONFIG`** — the merged `QueryModuleOptions` (stale
 *      time, mutation mode, live mode, undoable timeout).
 *   2. **`QueryClient`** — a `@tanstack/query-core` `QueryClient`
 *      instance configured with the module's defaults. Injected by
 *      class token; the React provider (`StackraQueryProvider`)
 *      also reads this and hands it to `<QueryClientProvider>`.
 *   3. **`QueryService`** — DI-native facade over `QueryClient` +
 *      Stackra add-ons (mutation modes, realtime). Implements
 *      `IQueryClient`. Bound under both the class token and the
 *      `QUERY_CLIENT` contract token.
 *   4. **`UndoableQueueService`** — the shared queue that backs
 *      `mutationMode: 'undoable'`. Bound under both the class token
 *      and the `UNDOABLE_QUEUE` contract token.
 *
 *   Requires no other module to be imported first — `QueryClient`
 *   is fully self-contained.
 */

import { Module } from '@stackra/container';
import type { DynamicModule } from '@stackra/container';
import { DevtoolsModule } from '@stackra/devtools';
import { QueryClient } from '@tanstack/query-core';
import { QUERY_CLIENT, UNDOABLE_QUEUE, type IAsyncModuleOptions } from '@stackra/contracts';

import { QUERY_CONFIG } from './tokens/query.tokens';
import type { QueryModuleOptions } from './interfaces/query-module-options.interface';
import { mergeConfig } from './utils/merge-config.util';
import { UndoableQueueService } from './services/undoable-queue.service';
import { QueryService } from './services/query.service';
import { QueryDevtoolsPanel } from '../react/devtools/query.devtools-panel';

/**
 * Build a `QueryClient` from the merged module config. Extracted to
 * a helper so `forRoot` and `forRootAsync` stay aligned.
 */
function buildQueryClient(config: Required<QueryModuleOptions>): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: config.defaultStaleTime,
        // TanStack Query v5: `refetchInterval` can be false or ms.
        // Our config's `0` semantically means "disabled" — normalize.
        refetchInterval: config.defaultRefetchInterval > 0 ? config.defaultRefetchInterval : false,
        refetchOnWindowFocus: config.refetchOnWindowFocus,
      },
    },
  });
}

/**
 * QueryModule — TanStack Query-backed data fetching + Stackra
 * mutation modes.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     QueryModule.forRoot({
 *       defaultStaleTime: 5 * 60 * 1000,
 *       defaultMutationMode: 'optimistic',
 *       defaultLiveMode: 'auto',
 *       undoableTimeout: 5000,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class QueryModule {
  /**
   * Register the query-layer defaults and shared services.
   *
   * When the app renders React, wrap the root with
   * `<StackraQueryProvider>` from `@stackra/query/react` — that
   * component pulls the DI-bound `QueryClient` and hands it to
   * TanStack Query's `<QueryClientProvider>`.
   */
  public static forRoot(options?: QueryModuleOptions): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: QueryModule,
      global: true,
      // Contribute the devtools query panel. `DevtoolsModule.forFeature`
      // is fail-soft — when the consumer app hasn't wired
      // `DevtoolsModule.forRoot()` the seed loader becomes a no-op
      // and the panel doesn't appear anywhere.
      imports: [DevtoolsModule.forFeature([QueryDevtoolsPanel])],
      providers: [
        { provide: QUERY_CONFIG, useValue: config },
        {
          provide: QueryClient,
          useFactory: (): QueryClient => buildQueryClient(config),
        },
        UndoableQueueService,
        { provide: UNDOABLE_QUEUE, useExisting: UndoableQueueService },
        QueryService,
        { provide: QUERY_CLIENT, useExisting: QueryService },
      ],
      exports: [
        QUERY_CONFIG,
        QueryClient,
        UndoableQueueService,
        UNDOABLE_QUEUE,
        QueryService,
        QUERY_CLIENT,
      ],
    };
  }

  /**
   * Async variant — resolve the options via a factory.
   */
  public static forRootAsync(options: IAsyncModuleOptions<QueryModuleOptions>): DynamicModule {
    return {
      module: QueryModule,
      global: true,
      imports: [
        // Devtools query panel — see forRoot for the fail-soft rationale.
        DevtoolsModule.forFeature([QueryDevtoolsPanel]),
      ],
      providers: [
        {
          provide: QUERY_CONFIG,
          useFactory: async (...args: unknown[]) => {
            const resolved = await options.useFactory(...args);
            return mergeConfig(resolved);
          },
          inject: options.inject ?? [],
        },
        {
          provide: QueryClient,
          useFactory: (config: Required<QueryModuleOptions>): QueryClient =>
            buildQueryClient(config),
          inject: [QUERY_CONFIG],
        },
        UndoableQueueService,
        { provide: UNDOABLE_QUEUE, useExisting: UndoableQueueService },
        QueryService,
        { provide: QUERY_CLIENT, useExisting: QueryService },
      ],
      exports: [
        QUERY_CONFIG,
        QueryClient,
        UndoableQueueService,
        UNDOABLE_QUEUE,
        QueryService,
        QUERY_CLIENT,
      ],
    };
  }
}
