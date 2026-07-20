/**
 * KeyboardCatalogListener — Type.
 *
 * @module @stackra/kbd/types
 */

import type { KeyboardCatalogState } from "../interfaces/keyboard-catalog-state.interface";

/**
 * Subscriber callback signature.
 */
export type KeyboardCatalogListener = (state: KeyboardCatalogState) => void;
