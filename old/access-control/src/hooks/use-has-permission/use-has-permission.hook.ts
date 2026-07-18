/**
 * @file use-has-permission.hook.ts
 * @module @academorix/access-control/hooks/use-has-permission
 * @description Hot-path context reader — no HTTP per check.
 */

"use client";

import { useAccessControlContext } from "../use-access-control-context";

/**
 * Check whether the current user holds a named permission.
 * Reads from `AccessControlContext` — no HTTP per check.
 *
 * @param name - Dot-separated permission identifier.
 * @returns True when the user holds the permission.
 */
export function useHasPermission(name: string): boolean {
  const { permissions } = useAccessControlContext();
  return permissions.includes(name);
}
