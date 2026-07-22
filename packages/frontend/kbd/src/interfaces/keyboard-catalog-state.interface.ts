/**
 * @file keyboard-catalog-state.interface.ts
 * KeyboardCatalogState — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

/**
 * Catalog state shape.
 */
export interface KeyboardCatalogState {
  isOpen: boolean;
  /** Active type id or `"all"` when no filter is applied. */
  activeTab: string;
  /** Free-text search query. */
  query: string;
}
