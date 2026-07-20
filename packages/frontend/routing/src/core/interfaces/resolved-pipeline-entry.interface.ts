/**
 * @file resolved-pipeline-entry.interface.ts
 * @module @stackra/routing/core/interfaces
 * @description A single entry in the middleware / guard chain after
 *   the resolver has flattened groups, resolved references, and
 *   sorted by priority.
 *
 *   Used by `MiddlewareResolverService` to hand back an ordered
 *   pipeline. Downstream code (F.2 pipeline runner) iterates this
 *   list and instantiates each `ctor` through the container.
 */

/**
 * The kind of pipeline entry — a routing middleware or an adapted guard.
 */
export type IPipelineEntryKind = "middleware" | "guard";

/**
 * A resolved pipeline entry.
 */
export interface IResolvedPipelineEntry {
  /** Discriminator — `'middleware'` or `'guard'`. */
  readonly kind: IPipelineEntryKind;

  /** Name (or empty string for anonymous entries). */
  readonly name: string;

  /** Effective priority after defaults. Higher runs first. */
  readonly priority: number;

  /**
   * Class constructor to instantiate through the DI container at
   * execution time. Typed as `Function` because the resolver mixes
   * middleware + guard classes.
   */
  readonly ctor: Function;

  /**
   * Source label for debugging — `'global'`, `'group:@web'`,
   * `'route'`, `'guard:auth'`, etc.
   */
  readonly source: string;
}
