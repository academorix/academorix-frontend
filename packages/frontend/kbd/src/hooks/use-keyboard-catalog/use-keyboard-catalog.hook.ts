/**
 * @fileoverview useKeyboardCatalog — read catalog state in React.
 *
 * Uses `useStore()` from TanStack Store for fine-grained subscriptions.
 * Components only re-render when the specific slice they read changes.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useSelector } from "@tanstack/react-store";
import { useInject } from "@stackra/container/react";
import type { Store } from "@tanstack/store";

import { KEYBOARD_CATALOG_STORE, KEYBOARD_CATALOG_SERVICE } from "../../tokens";
import type { KeyboardCatalogState } from "../../interfaces/keyboard-catalog-state.interface";
import type { KeyboardCatalogService } from "../../services/keyboard-catalog.service";
import type { UseKeyboardCatalogResult } from "../../interfaces/use-keyboard-catalog-result.interface";

/**
 * Read the catalog state and trigger updates.
 *
 * Uses TanStack Store for reactive subscriptions — no manual subscribe
 * pattern. The component re-renders only when the store state changes.
 *
 * @returns Catalog state + service actions.
 */
export function useKeyboardCatalog(): UseKeyboardCatalogResult {
  const store = useInject<Store<KeyboardCatalogState>>(KEYBOARD_CATALOG_STORE);
  const service = useInject<KeyboardCatalogService>(KEYBOARD_CATALOG_SERVICE);
  const state = useSelector(store);

  return {
    ...state,
    service,
    open: service.open.bind(service),
    close: service.close.bind(service),
    toggle: service.toggle.bind(service),
    setTab: service.setTab.bind(service),
    setQuery: service.setQuery.bind(service),
  };
}
