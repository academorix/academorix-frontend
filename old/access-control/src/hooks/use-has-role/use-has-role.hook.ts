/**
 * @file use-has-role.hook.ts
 * @module @academorix/access-control/hooks/use-has-role
 */

"use client";

import { useAccessControlContext } from "../use-access-control-context";

/**
 * Check whether the current user holds a named role.
 *
 * @param name - Role name.
 */
export function useHasRole(name: string): boolean {
  const { roles } = useAccessControlContext();
  return roles.includes(name);
}
