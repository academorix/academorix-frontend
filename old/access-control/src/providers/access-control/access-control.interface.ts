/**
 * @file access-control.interface.ts
 * @module @academorix/access-control/providers/access-control
 *
 * @description
 * React-specific prop shapes for `<AccessControlProvider>`.
 * Domain types (`IAbilityData`, `IAccessControlContextValue`)
 * live in `@academorix/contracts`.
 */

import type { IAbilityData } from "@academorix/contracts";
import type { ReactNode } from "react";

/**
 * Data source for the provider.
 */
export type AccessControlSource =
  | {
      readonly kind: "preloaded";
      readonly permissions: readonly string[];
      readonly roles: readonly string[];
      readonly abilities: readonly IAbilityData[];
    }
  | { readonly kind: "fetch-on-mount" };

/**
 * Provider props.
 */
export interface AccessControlProviderProps {
  readonly source: AccessControlSource;
  readonly children: ReactNode;
}
