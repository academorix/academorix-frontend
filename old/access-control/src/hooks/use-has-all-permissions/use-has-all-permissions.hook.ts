/**
 * @file use-has-all-permissions.hook.ts
 * @module @academorix/access-control/hooks/use-has-all-permissions
 * @description True when the user holds EVERY named permission.
 */

"use client";

import { useAccessControlContext } from "../use-access-control-context";

/**
 * Returns true when the current user holds every named permission.
 * Reads from context — no HTTP.
 *
 * @param names - Permission names to check.
 */
export function useHasAllPermissions(names: readonly string[]): boolean {
  const { permissions } = useAccessControlContext();
  return names.every((name) => permissions.includes(name));
}
