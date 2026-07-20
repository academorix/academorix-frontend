/**
 * @file use-breadcrumb.hook.ts
 * @module @stackra/routing/react/hooks/use-breadcrumb
 * @description Return the deepest (current) breadcrumb entry.
 */

import { useBreadcrumbs } from "../use-breadcrumbs";
import type { IBreadcrumbEntry } from "../use-breadcrumbs";

/**
 * Return the innermost breadcrumb entry — the one flagged
 * `isCurrent`. `null` when the current match chain contributes no
 * breadcrumbs.
 *
 * @returns The current breadcrumb entry or `null`.
 */
export function useBreadcrumb(): IBreadcrumbEntry | null {
  const crumbs = useBreadcrumbs();
  // The `useBreadcrumbs` implementation already flags the last entry
  // as `isCurrent`; short-circuit the lookup.
  return crumbs.length > 0 ? crumbs[crumbs.length - 1] : null;
}
