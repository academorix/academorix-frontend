/**
 * @file middleware.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the middleware runtime shipped by `@stackra/ssr/middleware`.
 *
 *   These tokens are declared in contracts (not in `@stackra/ssr`) so that
 *   cross-cutting consumers — inspectors, dev-tools panels, telemetry
 *   collectors, feature modules — can resolve the middleware registry and
 *   resolver without taking a direct dependency on the `ssr` package.
 *
 *   @see `@stackra/ssr/middleware` for the runtime implementation.
 */

/**
 * Token for the `MiddlewareRegistry` singleton.
 *
 * Resolving this token returns the runtime registry populated at bootstrap
 * time by `MiddlewareModule.forRoot(...)`. Use it for introspection, testing,
 * and dev-tools integration.
 *
 * @example
 * ```typescript
 * import { MIDDLEWARE_REGISTRY } from '@stackra/contracts';
 *
 * const registry = container.get(MIDDLEWARE_REGISTRY);
 * console.log(registry.list().map((m) => m.name));
 * ```
 */
export const MIDDLEWARE_REGISTRY = Symbol.for("MIDDLEWARE_REGISTRY");

/**
 * Token for the `MiddlewareResolver` singleton.
 *
 * The resolver takes a route-resolution input (global + group + route
 * middleware references, environment, stage) and produces the ordered
 * `ResolvedMiddleware[]` array ready for pipeline execution.
 *
 * @example
 * ```typescript
 * import { MIDDLEWARE_RESOLVER } from '@stackra/contracts';
 *
 * const resolver = container.get(MIDDLEWARE_RESOLVER);
 * const chain = resolver.resolve({
 *   global: [],
 *   groups: ['@web'],
 *   route: [requireAuth],
 *   environment: 'client',
 *   stage: 'ui',
 * });
 * ```
 */
export const MIDDLEWARE_RESOLVER = Symbol.for("MIDDLEWARE_RESOLVER");

/**
 * Token for the merged middleware module configuration.
 *
 * Produced by `mergeConfig(DEFAULT_MIDDLEWARE_CONFIG, options)` inside
 * `MiddlewareModule.forRoot(...)` / `forRootAsync(...)`. Consumers rarely
 * inject this directly — prefer resolving the registry or resolver — but
 * it is exposed for advanced use cases (custom bootstrap providers, tests).
 */
export const MIDDLEWARE_CONFIG = Symbol.for("MIDDLEWARE_CONFIG");
