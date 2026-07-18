/**
 * @file route-not-found.error.ts
 * @module @stackra/routing/core/errors
 * @description Raised when a navigation target does not resolve to a
 *   route in the registry (per PLAN v3.12.3).
 *
 *   Thrown by `useNavigate(...)` (F.2) and by any adapter that
 *   converts a path into a route entry. Consumers catch this at the
 *   nearest error boundary; the message names the target so the fix
 *   is one `grep` away.
 */

/**
 * Error raised when a navigation target has no matching route.
 */
export class RouteNotFoundError extends Error {
  /** The target path or route id that was not found. */
  public readonly target: string;

  /**
   * @param target - Path or route id that was not found in the registry.
   */
  public constructor(target: string) {
    // Include the target verbatim so log scans + IDE search catch
    // the offending call-site quickly.
    super(
      `Route not found: '${target}'. The path is not registered — check the routes tree passed to \`RoutingModule.forRoot(...)\` or contributed via \`RoutingModule.forFeature(...)\`.`,
    );
    this.name = "RouteNotFoundError";
    this.target = target;
  }
}
