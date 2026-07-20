/**
 * @file middleware-cycle-detected.error.ts
 * @module @stackra/routing/middleware/errors
 * @description Raised at registration time when a middleware group has
 *   a transitive cycle (per PLAN v3.12.6).
 *
 *   Thrown by `MiddlewareResolverService` during a DFS over the group
 *   graph. The error names the participants so consumers can break
 *   the cycle in one edit.
 */

/**
 * Error raised when a middleware group references itself, either
 * directly or through a chain of other groups.
 *
 * @example
 * ```typescript
 * throw new MiddlewareCycleDetectedError('@authenticated', [
 *   '@authenticated',
 *   '@internal',
 *   '@authenticated',
 * ]);
 * ```
 */
export class MiddlewareCycleDetectedError extends Error {
  /** Name of the group whose resolution kicked off the cycle. */
  public readonly rootGroup: string;

  /** Ordered list of participants forming the cycle. */
  public readonly cycle: readonly string[];

  /**
   * @param rootGroup - Name of the group whose resolution triggered detection.
   * @param cycle     - Ordered list of participants (`[root, ..., root]`).
   */
  public constructor(rootGroup: string, cycle: readonly string[]) {
    // The message renders the cycle inline so a `throw` stack trace
    // gives the whole picture without needing to walk `error.cycle`.
    super(
      `Middleware group '${rootGroup}' has a circular reference:\n  ${cycle.join(" → ")}\n\nBreak the cycle by inlining one group into a plain middleware list.`,
    );
    this.name = "MiddlewareCycleDetectedError";
    this.rootGroup = rootGroup;
    this.cycle = cycle;
  }
}
