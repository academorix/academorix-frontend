/**
 * @file use-pwa.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the aggregate `usePwa()` hook.
 */

import type {
  IPwaAttribution,
  IPwaInstallState,
  IPwaUpdateState,
  PwaDisplayMode,
} from "@/core/interfaces";

/**
 * Shape returned by {@link usePwa}.
 *
 * Aggregates every top-level snapshot field the individual hooks
 * expose in isolation — handy when a single component consumes
 * multiple PWA aspects at once.
 */
export interface IUsePwaResult {
  /** Install prompt state. */
  readonly install: IPwaInstallState;
  /** Service-worker update state. */
  readonly update: IPwaUpdateState;
  /** Whether the app is running standalone. */
  readonly standalone: boolean;
  /** Coarse display-mode categorisation. */
  readonly displayMode: PwaDisplayMode;
  /** Install-source attribution. */
  readonly attribution: IPwaAttribution;
}
