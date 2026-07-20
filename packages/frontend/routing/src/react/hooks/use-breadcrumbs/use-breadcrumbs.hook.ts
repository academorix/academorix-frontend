/**
 * @file use-breadcrumbs.hook.ts
 * @module @stackra/routing/react/hooks/use-breadcrumbs
 * @description Walk the match chain and produce the ordered breadcrumb
 *   trail.
 *
 *   For every match that carries a `handle.breadcrumb` (value or
 *   function), the hook resolves the function form via `resolveValue`
 *   against the match's page context (data + params + request +
 *   matches). The result is ordered outermost → innermost with
 *   `isCurrent` set on the leaf.
 */

import { useMemo } from "react";
import { useLocation, useMatches } from "react-router";

import { resolveValue } from "@/core/utils";
import type { IBreadcrumbEntry } from "./breadcrumb-entry.interface";

/**
 * Walk the current match chain and produce the ordered breadcrumb
 * trail.
 *
 * @returns Readonly array of breadcrumb entries.
 *
 * @example
 * ```typescript
 * const crumbs = useBreadcrumbs();
 * crumbs.map((c) => c.label);
 * ```
 */
export function useBreadcrumbs(): readonly IBreadcrumbEntry[] {
  const matches = useMatches();
  const location = useLocation();

  return useMemo(() => {
    const url = new URL(location.pathname + location.search, "http://placeholder/");
    // Not every match contributes — filter those whose handle sets a
    // breadcrumb.
    const contributions: IBreadcrumbEntry[] = [];
    matches.forEach((match, index) => {
      const handle = match.handle as { breadcrumb?: unknown } | undefined;
      if (!handle?.breadcrumb) return;
      // Resolve function form against a plausible page context. The
      // full context isn't required — breadcrumb factories typically
      // read `data` and `params` only. We ship the accurate `matches`
      // slice so nested factories can walk it if they need to.
      // The `handle.breadcrumb` field is loosely typed on the RRv7
      // match — narrow to the canonical value-OR-function shape via a
      // safe cast, then resolve.
      const label = resolveValue<string, unknown>(
        handle.breadcrumb as string | ((ctx: unknown) => string) | undefined,
        {
          data: match.data,
          params: match.params,
          matches,
          request: new Request(url.toString()),
          url,
        } as never,
      );
      // Fall through when the resolved value is `undefined`; a route
      // opting out at runtime shouldn't emit a blank crumb.
      if (typeof label !== "string" || label.length === 0) return;
      contributions.push({
        label,
        path: match.pathname,
        // We fill `isCurrent` in a second pass — the innermost
        // contribution wins.
        isCurrent: false,
        params: match.params as Readonly<Record<string, string>>,
      });
      void index;
    });

    // Mark the last contribution as current. Consumers rely on this
    // for HeroUI `<Breadcrumbs>` styling. Length-guarded above.
    if (contributions.length > 0) {
      const last = contributions[contributions.length - 1]!;
      contributions[contributions.length - 1] = { ...last, isCurrent: true };
    }

    return contributions;
  }, [matches, location.pathname, location.search]);
}
