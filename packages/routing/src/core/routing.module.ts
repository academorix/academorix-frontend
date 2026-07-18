/**
 * @file routing.module.ts
 * @module @stackra/routing/core
 * @description The composite `RoutingModule` — the DI module every
 *   consumer imports.
 *
 *   `forRoot(...)` wires the core services + sub-modules (middleware,
 *   guard, seo, analytics). `forRootAsync(...)` mirrors the same shape
 *   for factory-based config. `forFeature(...)` accepts a batch of
 *   route records and seeds them into the registry via
 *   `createSeedLoader` — never via a side-effecting factory (per
 *   `module-lifecycle.md`).
 *
 *   NOTE: F.1 does not include `@stackra/actions` peer wiring — the
 *   `useAction`-backed `useNavigate` lands in F.2.
 */

import { Module, type DynamicModule } from "@stackra/container";
import {
  AI_ROUTE_CONTEXT,
  ROUTE_MATCHER,
  ROUTE_REGISTRY,
  ROUTING_CONFIG,
} from "@stackra/contracts";
import { createSeedLoader, Path, seedLoaderToken } from "@stackra/support";

import { AiRouteContextService } from "./services/ai-route-context.service";
import { RouteMatcherService } from "./services/route-matcher.service";
import { RouteRegistryService } from "./services/route-registry.service";
import { mergeConfig } from "./utils/merge-config.util";

import type {
  IAsyncModuleOptions,
  IPublishableConsumer,
  IRoutingFeatureOptions,
  IRoutingModuleOptions,
} from "@stackra/contracts";

import { AnalyticsModule } from "@/analytics/analytics.module";
import { GuardModule } from "@/guards/guard.module";
import { MiddlewareModule } from "@/middleware/middleware.module";
import { SeoModule } from "@/seo/seo.module";

/**
 * The composite routing module.
 *
 * Implements `IHasPublishables` so `stackra vendor:publish` can expose
 * the reference `config/routing.config.ts` template. Consumers publish
 * it to their app via `stackra vendor:publish --tag=routing-config`.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     RoutingModule.forRoot({
 *       basename: '/',
 *       rootDomain: 'academorix.app',
 *       ai: false,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RoutingModule {
  /**
   * Absolute path to the `@stackra/routing` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it and
   * fill in `packageRoot` on every `.publish(entry)` call.
   *
   * `../../..` walks from `packages/routing/src/core/` to
   * `packages/routing/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  // ══════════════════════════════════════════════════════════════════════
  // forRoot
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Register the routing module globally with static config.
   *
   * @param options - Partial config; unset fields fall back to
   *   `DEFAULT_ROUTING_CONFIG`.
   * @returns Dynamic module definition.
   */
  public static forRoot(options?: Partial<IRoutingModuleOptions>): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: RoutingModule,
      global: true,
      imports: [
        // Order matters — middleware + guard must be loaded before
        // the router evaluates guards/middleware from the resolver.
        MiddlewareModule.forRoot(),
        GuardModule.forRoot(),
        SeoModule.forRoot(),
        AnalyticsModule.forRoot(),
      ],
      providers: [
        // Config is registered under both the class and the token so
        // downstream services can inject either.
        { provide: ROUTING_CONFIG, useValue: config },

        RouteRegistryService,
        { provide: ROUTE_REGISTRY, useExisting: RouteRegistryService },

        RouteMatcherService,
        { provide: ROUTE_MATCHER, useExisting: RouteMatcherService },

        // AI route context is wired CONDITIONALLY — off by default,
        // the class ships as a stub in F.1 and connects to `@stackra/ai`
        // in F.2/G.
        ...(config.ai
          ? [
              AiRouteContextService,
              { provide: AI_ROUTE_CONTEXT, useExisting: AiRouteContextService },
            ]
          : []),
      ],
      exports: [
        ROUTING_CONFIG,
        ROUTE_REGISTRY,
        RouteRegistryService,
        ROUTE_MATCHER,
        RouteMatcherService,
        MiddlewareModule,
        GuardModule,
        SeoModule,
        AnalyticsModule,
        ...(config.ai ? [AI_ROUTE_CONTEXT, AiRouteContextService] : []),
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // forRootAsync
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Register the routing module with an async factory for config.
   *
   * @param options - Async options — `useFactory` + optional `inject`.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(options: IAsyncModuleOptions<IRoutingModuleOptions>): DynamicModule {
    return {
      module: RoutingModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        MiddlewareModule.forRoot(),
        GuardModule.forRoot(),
        SeoModule.forRoot(),
        AnalyticsModule.forRoot(),
      ],
      providers: [
        {
          provide: ROUTING_CONFIG,
          // The factory result is merged through `mergeConfig` so
          // defaults + normalisation happen in one place.
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },

        RouteRegistryService,
        { provide: ROUTE_REGISTRY, useExisting: RouteRegistryService },

        RouteMatcherService,
        { provide: ROUTE_MATCHER, useExisting: RouteMatcherService },

        // AI service is always registered in the async form because we
        // can't inspect the resolved config at module-declaration
        // time; the service itself reads the flag from `ROUTING_CONFIG`.
        AiRouteContextService,
        { provide: AI_ROUTE_CONTEXT, useExisting: AiRouteContextService },
      ],
      exports: [
        ROUTING_CONFIG,
        ROUTE_REGISTRY,
        RouteRegistryService,
        ROUTE_MATCHER,
        RouteMatcherService,
        AI_ROUTE_CONTEXT,
        AiRouteContextService,
        MiddlewareModule,
        GuardModule,
        SeoModule,
        AnalyticsModule,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // forFeature
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Contribute routes from a feature module.
   *
   * Seeding runs through `createSeedLoader(...)` — an
   * `onApplicationBootstrap` loader — so we honour the module
   * lifecycle rule ("never a return-`true` side-effecting factory").
   *
   * @param options - Feature name + route list.
   * @returns Dynamic module definition.
   */
  public static forFeature(options: IRoutingFeatureOptions): DynamicModule {
    return {
      module: RoutingModule,
      providers: [
        {
          // `seedLoaderToken` returns a fresh `Symbol()` per call so
          // contributions from multiple features never collide under
          // the container's last-wins token semantics.
          provide: seedLoaderToken(`routing-feature:${options.name}`),
          useFactory: (registry: RouteRegistryService) =>
            createSeedLoader(() => {
              registry.registerBatch(options.routes, `feature:${options.name}`);
            }),
          inject: [RouteRegistryService],
        },
      ],
      exports: [],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/routing` owns.
   *
   * Discovered at CLI boot by `@stackra/console`'s `PublishableLoader`.
   * The SPA never reaches this method — `PublishableLoader` only runs
   * inside the CLI kernel.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above.
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "routing-config",
      description: "Reference @stackra/routing config file for the app.",
      files: ["config/routing.config.ts"],
    });
  }
}
