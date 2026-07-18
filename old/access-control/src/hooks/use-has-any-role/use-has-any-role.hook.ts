/**
 * @file use-has-any-role.hook.ts
 * @module @academorix/access-control/hooks/use-has-any-role
 */

"use client";

import { useAccessControlContext } from "../use-access-control-context";

/**
 * True when the user holds any of the named roles.
 *
 * @param names - Role names.
 */
export function useHasAnyRole(names: readonly string[]): boolean {
  const { roles } = useAccessControlContext();
  return names.some((name) => roles.includes(name));
}
