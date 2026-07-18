/**
 * @file can-access.interface.ts
 * @module @academorix/access-control/components/can-access
 */

import type { ReactNode } from "react";

/**
 * Props for the root `<CanAccess>` compound.
 */
export interface CanAccessProps {
  /** Permission name to check. Prefer this over `action` when the check is a static permission. */
  readonly permission?: string;
  /** Role name to check. */
  readonly role?: string;
  /** Action name for server-side `useCan` check. Fires only when `params` is supplied. */
  readonly action?: string;
  /** Optional resource for the server-side check. */
  readonly resource?: string;
  /** Optional params bag for the server-side check. Presence triggers the `useCan` call. */
  readonly params?: Record<string, unknown>;
  /** Fallback rendered when access is denied. */
  readonly fallback?: ReactNode;
  /** Direct-mode children. */
  readonly children?: ReactNode;
}

/**
 * Props for `<CanAccess.Show>`.
 */
export interface CanAccessShowProps {
  readonly children: ReactNode;
}

/**
 * Props for `<CanAccess.Fallback>`.
 */
export interface CanAccessFallbackProps {
  readonly children: ReactNode;
}
