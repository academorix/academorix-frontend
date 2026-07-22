/**
 * @file use-command-palette-result.interface.ts
 * UseCommandPaletteResult — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { CommandPaletteState } from "./command-palette-state.interface";
import type { CommandPaletteService } from "../services/command-palette.service";

/**
 * Combined return shape — palette state plus imperative actions.
 */
export interface UseCommandPaletteResult extends CommandPaletteState {
  /** Open the palette with an optional pre-filled query. */
  open: (initialQuery?: string) => void;
  /** Close the palette. */
  close: () => void;
  /** Toggle the palette open / closed. */
  toggle: () => void;
  /** Update the search query. */
  setQuery: (query: string) => void;
  /** Switch the active theme. */
  setTheme: (themeId: string) => void;
  /** Direct service reference (escape hatch). */
  service: CommandPaletteService;
}
