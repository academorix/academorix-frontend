/**
 * @file devtools-frame-state.interface.ts
 * @module @stackra/devtools/core/interfaces
 * @description Persisted UI state for the devtools shell — open
 *   state, active panel id, drawer position/size, inspector toggle.
 *
 *   The `DevtoolsFrameStateService` reads and writes this shape from
 *   an `IStorage` when `@stackra/storage` is bound; consumers should
 *   treat every field as optional-with-default so a fresh install
 *   works without a persisted snapshot.
 */

import type { DevtoolsShellPosition } from '../types/devtools-shell-position.type';

/**
 * Persisted devtools frame state.
 */
export interface IDevtoolsFrameState {
  /** Whether the shell is open. */
  readonly isOpen: boolean;
  /** Currently-active panel id (`null` when nothing is selected). */
  readonly activePanelId: string | null;
  /** Which edge the shell is anchored to. */
  readonly position: DevtoolsShellPosition;
  /** Shell size in CSS pixels (width for left/right, height for top/bottom). */
  readonly size: number;
  /** Whether the inspector overlay is active. */
  readonly isInspectorEnabled: boolean;
  /** Panel-search query (empty string when unset). */
  readonly searchQuery: string;
}
