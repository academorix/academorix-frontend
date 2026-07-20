/**
 * @file use-install-prompt.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the `useInstallPrompt()` hook.
 */

import type { IPwaInstallState } from "@/core/interfaces";

/**
 * Value returned by {@link useInstallPrompt}.
 *
 * Extends the base {@link IPwaInstallState} with the action methods
 * consumers call from the install-prompt UI.
 */
export interface IUseInstallPromptResult extends IPwaInstallState {
  /**
   * Show the browser install prompt. Returns `true` when accepted.
   * Only valid when `isSupported` is `true`.
   */
  readonly promptInstall: () => Promise<boolean>;
  /** Dismiss the in-app banner + increment the dismiss count. */
  readonly dismiss: () => void;
  /** Reset the dismiss count — useful after user re-engagement. */
  readonly reset: () => void;
}
