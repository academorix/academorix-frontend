/**
 * @file pipeline-resolution-input.interface.ts
 * @module @stackra/routing/core/interfaces
 * @description Input shape handed to `MiddlewareResolverService.resolve(...)`.
 *
 *   The resolver combines four sources of pipeline entries — global
 *   guards, global middleware, route-level guards, route-level
 *   middleware — and returns the merged, priority-sorted chain.
 */

/**
 * Input payload for the resolver's `resolve(...)` call.
 */
export interface IPipelineResolutionInput {
  /**
   * Guard references pulled from the route + its inherited chain.
   * Each entry is a class ref, a string name, or a descriptor
   * object (`{name, args}`). The resolver reifies string names
   * against `GuardRegistryService`.
   */
  readonly guards?: readonly unknown[];

  /**
   * Middleware references pulled from the route + its inherited
   * chain. Same shape as `guards` — string names / class refs /
   * descriptor objects. Group refs (starting with `@`) are expanded
   * into their member list at resolution time.
   */
  readonly middleware?: readonly unknown[];
}
