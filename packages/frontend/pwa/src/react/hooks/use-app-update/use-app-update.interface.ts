/**
 * @file use-app-update.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the {@link useAppUpdate} hook.
 */

import type { IAppUpdateState } from "@/core/interfaces";

/**
 * Value returned by {@link useAppUpdate}.
 *
 * Extends the reactive {@link IAppUpdateState} with imperative
 * actions callers wire to their UI affordances.
 */
export interface IUseAppUpdateResult extends IAppUpdateState {
  /**
   * Trigger a manual version check. Useful for a "check for
   * updates" button in an admin screen.
   */
  readonly check: () => Promise<void>;

  /**
   * Open the platform download URL in a new tab and emit the
   * `accepted` event. Pass `{ openWindow: false }` to skip the
   * navigation and handle it yourself.
   */
  readonly accept: (options?: { readonly openWindow?: boolean }) => void;

  /**
   * Dismiss the update prompt for the current session. No-ops when
   * the update is marked mandatory.
   */
  readonly dismiss: () => void;
}
