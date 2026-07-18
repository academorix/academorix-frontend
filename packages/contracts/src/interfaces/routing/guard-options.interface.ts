/**
 * @file guard-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Options accepted by the `@Guard(...)` decorator.
 */

/**
 * Options for a `@Guard`-decorated class.
 *
 * NOTE: `group` is intentionally NOT included — guards bundle at the
 * middleware-group level (a middleware group may reference guard
 * names in its `middleware` list). See PLAN v3.7.
 */
export interface IGuardOptions {
  /**
   * Unique guard name used to reference the guard by name in a route's
   * `guards: [...]` list.
   */
  readonly name: string;

  /**
   * Execution priority. Higher priorities run FIRST. Defaults to
   * `1000` — higher than a normal middleware default so guards get
   * an early say on request/routes.
   *
   * @default 1000
   */
  readonly priority?: number;

  /**
   * When `true`, the discovery loader registers this guard in the
   * global pipeline (equivalent to listing it in every route's
   * `guards` array).
   *
   * @default false
   */
  readonly global?: boolean;
}
