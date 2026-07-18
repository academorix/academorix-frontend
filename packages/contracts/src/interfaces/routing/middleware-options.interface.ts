/**
 * @file middleware-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Options accepted by the `@Middleware(...)` decorator.
 */

/**
 * Options for a `@Middleware`-decorated class.
 */
export interface IMiddlewareOptions {
  /**
   * Unique middleware name used to reference the middleware by name in
   * a route's `middleware: [...]` list.
   */
  readonly name: string;

  /**
   * Execution priority. Higher priorities run FIRST. Defaults to `100`.
   *
   * @default 100
   */
  readonly priority?: number;

  /**
   * When `true`, the discovery loader registers this middleware in the
   * global pipeline (fires on every route).
   *
   * @default false
   */
  readonly global?: boolean;

  /**
   * Middleware group(s) to bundle under. A group is referenced from a
   * route via its name (`middleware: ['@web']`), and every member of
   * the group runs when the group is matched.
   */
  readonly group?: string | readonly string[];
}
