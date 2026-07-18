/**
 * @file use-access-control-context.hook.ts
 * @module @academorix/access-control/hooks/use-access-control-context
 * @description Low-level context reader — every hot-path hook builds on this.
 */

"use client";

import { useContext } from "react";

import { AccessControlContext } from "../../contexts/access-control/access-control.context";
import type { IAccessControlContextValue } from "@academorix/contracts";

/**
 * Read the AccessControlContext. Returns the default zeroed
 * value when no provider is mounted so consumer hooks stay safe.
 */
export function useAccessControlContext(): IAccessControlContextValue {
  return useContext(AccessControlContext);
}
