/**
 * UseKeyboardCatalogResult — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { KeyboardCatalogState } from "./keyboard-catalog-state.interface";
import type { KeyboardCatalogService } from "../services/keyboard-catalog.service";

/**
 * Combined return shape — catalog state plus imperative actions.
 */
export interface UseKeyboardCatalogResult extends KeyboardCatalogState {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setTab: (tab: string) => void;
  setQuery: (query: string) => void;
  service: KeyboardCatalogService;
}
