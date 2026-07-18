/**
 * @file use-has-any-permission.hook.ts
 * @module @academorix/access-control/hooks/use-has-any-permission
 * @description True when the user holds ANY of the named permissions.
 */

"use client";

import { useAccessControlContext } from "../use-access-control-context";

/**
 * Returns true when the current user holds at least one of the
 * named permissions. Reads from context — no HTTP.
 *
 * @param names - Permission names to check.
 */
export function useHasAnyPermission(names: readonly string[]): boolean {
  const { permissions } = useAccessControlContext();
  return names.some((name) => permissions.includes(name));
}
