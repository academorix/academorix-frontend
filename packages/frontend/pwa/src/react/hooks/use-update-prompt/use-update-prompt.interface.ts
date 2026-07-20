/**
 * @file use-update-prompt.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the `useUpdatePrompt()` hook.
 */

import type { IPwaUpdateState } from "@/core/interfaces";

/**
 * Value returned by {@link useUpdatePrompt}.
 *
 * Extends the base {@link IPwaUpdateState} with `accept` / `dismiss`
 * actions.
 */
export interface IUseUpdatePromptResult extends IPwaUpdateState {
  /** Accept the waiting update (`SKIP_WAITING` + reload). */
  readonly accept: () => void;
  /** Dismiss the update banner for the session. */
  readonly dismiss: () => void;
}
