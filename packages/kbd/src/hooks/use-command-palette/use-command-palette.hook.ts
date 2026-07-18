/**
 * @fileoverview useCommandPalette — read command palette state reactively.
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

import { COMMAND_PALETTE_STORE, COMMAND_PALETTE_SERVICE } from "../../tokens";
import type { CommandPaletteState } from "../../interfaces/command-palette-state.interface";
import type { CommandPaletteService } from "../../services/command-palette.service";
import type { UseCommandPaletteResult } from "../../interfaces/use-command-palette-result.interface";

/**
 * Read the command-palette state and access service actions.
 *
 * Uses TanStack Store for reactive subscriptions — no manual subscribe
 * pattern. The component re-renders only when the store state changes.
 *
 * @returns Palette state + service actions.
 *
 * @example
 * ```tsx
 * const { isOpen, query, commands, open, close, setQuery } = useCommandPalette();
 * ```
 */
export function useCommandPalette(): UseCommandPaletteResult {
  const store = useInject<Store<CommandPaletteState>>(COMMAND_PALETTE_STORE);
  const service = useInject<CommandPaletteService>(COMMAND_PALETTE_SERVICE);
  const state = useSelector(store);

  return {
    ...state,
    service,
    open: service.open.bind(service),
    close: service.close.bind(service),
    toggle: service.toggle.bind(service),
    setQuery: service.setQuery.bind(service),
    setTheme: service.setTheme.bind(service),
  };
}
