/**
 * @file walk-routes.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Walk a Stackra route tree and yield every route paired
 *   with its full path (joined from parent → child segments).
 *
 *   The walk is depth-first, parents before children. Each yielded
 *   entry knows:
 *
 *   - The full path with `:param` placeholders intact.
 *   - The route record itself.
 *   - Whether the route is scoped by any ancestor subdomain matcher.
 *
 *   PLAN v3.9.2 uses this shape to decide which routes to prerender
 *   + where to emit their outputs.
 */

import type { IRouteRecord } from "@stackra/contracts";

/**
 * A single flattened route entry.
 */
export interface IWalkedRoute {
  /**
   * Full path with `:param` placeholders. Always starts with `/`.
   * For index routes, the value is the parent's path.
   */
  readonly fullPath: string;

  /** The underlying route record. */
  readonly route: IRouteRecord;

  /**
   * `true` when this route (or any ancestor) declares
   * `match.subdomain`. Consumers use it to decide whether to emit
   * per-subdomain output directories.
   */
  readonly hasSubdomainMatch: boolean;

  /**
   * The chain of ancestors, root → parent. Empty for the top-level
   * routes. Useful for prerender resolution when a page needs to see
   * its layout chain.
   */
  readonly ancestors: readonly IRouteRecord[];
}

/**
 * Walk a route tree.
 *
 * @param routes - Top-level routes (from `defineRouterConfig({routes})`).
 * @returns Flat array of every walked route entry.
 */
export function walkRoutes(routes: readonly IRouteRecord[]): readonly IWalkedRoute[] {
  const walked: IWalkedRoute[] = [];
  for (const route of routes) {
    walkInto({
      route,
      parentPath: "",
      parentHasSubdomain: false,
      ancestors: [],
      out: walked,
    });
  }
  return walked;
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Recursive walker — appends to `out` in DFS order.
 */
function walkInto(args: {
  readonly route: IRouteRecord;
  readonly parentPath: string;
  readonly parentHasSubdomain: boolean;
  readonly ancestors: readonly IRouteRecord[];
  readonly out: IWalkedRoute[];
}): void {
  const { route, parentPath, parentHasSubdomain, ancestors, out } = args;

  // Compute this route's full path — inherit the parent's when the
  // route is an index route (no path of its own). RRv7's semantics
  // treat `{index: true}` as "matches the parent's exact path".
  const fullPath = route.index
    ? parentPath === ""
      ? "/"
      : parentPath
    : joinSegments(parentPath, route.path);

  const hasSubdomainMatch = parentHasSubdomain || Boolean(route.match?.subdomain);

  // Emit this route BEFORE recursing so callers see parents first —
  // matches the "root before leaf" processing order in the prerender
  // walk.
  out.push({
    fullPath,
    route,
    hasSubdomainMatch,
    ancestors,
  });

  // Recurse into children.
  if (route.children && route.children.length > 0) {
    const nextAncestors: readonly IRouteRecord[] = [...ancestors, route];
    for (const child of route.children) {
      walkInto({
        route: child,
        parentPath: fullPath,
        parentHasSubdomain: hasSubdomainMatch,
        ancestors: nextAncestors,
        out,
      });
    }
  }
}

/**
 * Join a parent path with a child segment, normalising slashes.
 *
 * - `('', '/')` → `'/'`
 * - `('/', 'foo')` → `'/foo'`
 * - `('/foo', '/bar')` → `'/foo/bar'`
 * - `('/foo', undefined)` → `'/foo'` (layout-only child, no path).
 */
function joinSegments(parent: string, child: string | undefined): string {
  if (!child) return parent === "" ? "/" : parent;

  // Strip leading + trailing slashes on the child, then re-attach
  // once to the parent. Parent's trailing slash is stripped only when
  // it's not the root `/`.
  const trimmedChild = child.replace(/^\/+/, "").replace(/\/+$/, "");
  if (trimmedChild === "") return parent === "" ? "/" : parent;

  const trimmedParent = parent === "/" || parent === "" ? "" : parent.replace(/\/+$/, "");
  return `${trimmedParent}/${trimmedChild}`;
}
