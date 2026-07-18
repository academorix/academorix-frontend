/**
 * @file access-control.context.ts
 * @module @academorix/access-control/contexts/access-control
 * @description React context carrying the current user's authorization state.
 *   Context-value type + default live in `@academorix/contracts`.
 */

"use client";

import {
  defaultAccessControlContextValue,
  type IAccessControlContextValue,
} from "@academorix/contracts";
import { createContext } from "react";

export const AccessControlContext = createContext<IAccessControlContextValue>(
  defaultAccessControlContextValue,
);

AccessControlContext.displayName = "AccessControlContext";
