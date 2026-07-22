/**
 * @file command-palette-state.interface.ts
 * CommandPaletteState — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { Command } from "./command.interface";

/**
 * Palette state shape exposed to subscribers.
 */
export interface CommandPaletteState {
  /** Whether the palette is currently open. */
  isOpen: boolean;
  /** Current search query (empty when palette opens). */
  query: string;
  /** Resolved + ordered commands for the current query. */
  commands: Command[];
  /** Whether resolution is in flight. */
  isLoading: boolean;
  /** Active theme id. */
  themeId: string;
}
