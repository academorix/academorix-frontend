/**
 * @file actions.module.ts
 * @module @stackra/actions/core
 * @description Actions DI module.
 *
 *   `forRoot` returns providers + `useExisting` aliases + a `useValue`
 *   config only. The two built-in handlers (`Composite`, `Dispatch`) are
 *   registered via `createSeedLoader` — no bootstrap class, no
 *   sentinel-returning `useFactory`.
 */

import { Global, Module, type DynamicModule, type Type } from '@stackra/container';
import { PipelineModule } from '@stackra/pipeline';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';
import type {
  IActionDispatcher,
  IActionHandler,
  IActionsConfig,
  IActionsModuleOptions,
  IAsyncModuleOptions,
} from '@stackra/contracts';
import {
  ACTION_CONFIG,
  ACTION_DISPATCHER,
  ACTION_REGISTRY,
  PERMISSION_RESOLVER,
} from '@stackra/contracts';

import { ActionRegistry } from './registries/action.registry';
import { ActionDispatcherService } from './services/action-dispatcher.service';
import { HandlerLoader } from './services/handler-loader.service';
import { AuthorizeMiddleware } from './pipeline/authorize.middleware';
import { LogMiddleware } from './pipeline/log.middleware';
import { TraceMiddleware } from './pipeline/trace.middleware';
import { CompositeHandler } from './handlers/composite.handler';
import { DispatchHandler } from './handlers/dispatch.handler';
import { mergeConfig } from './utils/merge-config.util';

/**
 * The Actions module.
 */
@Global()
@Module({})
export class ActionsModule {
  /**
   * Register the actions module globally.
   */
  public static forRoot(options: IActionsModuleOptions = {}): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: ActionsModule,
      global: true,
      imports: [PipelineModule.forRoot()],
      providers: [
        { provide: ACTION_CONFIG, useValue: config },
        // Always bind PERMISSION_RESOLVER — `undefined` when the caller
        // didn't configure a resolver. AuthorizeMiddleware injects it
        // with `@Optional()` so the undefined case is handled cleanly,
        // AND the module's `exports` claim (below) is honest — the
        // token has a real provider on both paths.
        { provide: PERMISSION_RESOLVER, useValue: config.permissionResolver },
        ActionRegistry,
        { provide: ACTION_REGISTRY, useExisting: ActionRegistry },
        AuthorizeMiddleware,
        LogMiddleware,
        TraceMiddleware,
        ActionDispatcherService,
        { provide: ACTION_DISPATCHER, useExisting: ActionDispatcherService },
        HandlerLoader,
        // Built-in handlers — seeded on the dispatcher via createSeedLoader.
        CompositeHandler,
        DispatchHandler,
        {
          provide: seedLoaderToken('actions:built-in'),
          useFactory: (
            dispatcher: IActionDispatcher,
            composite: CompositeHandler,
            dispatch: DispatchHandler
          ) =>
            createSeedLoader(() => {
              dispatcher.register(composite as unknown as IActionHandler);
              dispatcher.register(dispatch as unknown as IActionHandler);
            }),
          inject: [ACTION_DISPATCHER, CompositeHandler, DispatchHandler],
        },
      ],
      exports: [ACTION_CONFIG, ACTION_REGISTRY, ACTION_DISPATCHER, PERMISSION_RESOLVER],
    };
  }

  /**
   * Register the actions module with async configuration.
   */
  public static forRootAsync(options: IAsyncModuleOptions<IActionsModuleOptions>): DynamicModule {
    return {
      module: ActionsModule,
      global: true,
      imports: [PipelineModule.forRoot(), ...(options.imports ?? [])],
      providers: [
        {
          provide: ACTION_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        // Resolve PERMISSION_RESOLVER off the already-merged ACTION_CONFIG
        // so the async binding matches the sync forRoot's contract —
        // always bound, undefined when unset, `@Optional()` at consume-time.
        {
          provide: PERMISSION_RESOLVER,
          useFactory: (cfg: IActionsConfig) => cfg.permissionResolver,
          inject: [ACTION_CONFIG],
        },
        ActionRegistry,
        { provide: ACTION_REGISTRY, useExisting: ActionRegistry },
        AuthorizeMiddleware,
        LogMiddleware,
        TraceMiddleware,
        ActionDispatcherService,
        { provide: ACTION_DISPATCHER, useExisting: ActionDispatcherService },
        HandlerLoader,
        CompositeHandler,
        DispatchHandler,
        {
          provide: seedLoaderToken('actions:built-in-async'),
          useFactory: (
            dispatcher: IActionDispatcher,
            composite: CompositeHandler,
            dispatch: DispatchHandler
          ) =>
            createSeedLoader(() => {
              dispatcher.register(composite as unknown as IActionHandler);
              dispatcher.register(dispatch as unknown as IActionHandler);
            }),
          inject: [ACTION_DISPATCHER, CompositeHandler, DispatchHandler],
        },
      ],
      exports: [ACTION_CONFIG, ACTION_REGISTRY, ACTION_DISPATCHER, PERMISSION_RESOLVER],
    };
  }

  /**
   * Register additional handlers — either class constructors (instantiated
   * by the container) or already-constructed instances.
   */
  public static forFeature(
    handlers: ReadonlyArray<Type<IActionHandler> | IActionHandler>
  ): DynamicModule {
    const classHandlers = handlers.filter(
      (h): h is Type<IActionHandler> => typeof h === 'function'
    );
    const instanceHandlers = handlers.filter((h): h is IActionHandler => typeof h !== 'function');

    return {
      module: ActionsModule,
      providers: [
        ...classHandlers,
        {
          provide: seedLoaderToken('actions:feature'),
          useFactory: (dispatcher: IActionDispatcher, ...instances: IActionHandler[]) =>
            createSeedLoader(() => {
              for (const instance of instances) dispatcher.register(instance);
              for (const instance of instanceHandlers) dispatcher.register(instance);
            }),
          inject: [ACTION_DISPATCHER, ...classHandlers],
        },
      ],
      exports: [],
    };
  }
}
