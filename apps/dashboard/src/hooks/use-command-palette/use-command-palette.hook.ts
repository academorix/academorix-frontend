/**
 * @file use-command-palette.hook.ts
 * @module @academorix/dashboard/hooks/use-command-palette
 * @description React binding for {@link CommandPaletteService}.
 *
 *   Preserves the shape the legacy `<CommandPaletteProvider>` used to
 *   expose: `{ isOpen, open, close, toggle }`. Every existing call site
 *   migrates by swapping the import path.
 */

import { useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import { CommandPaletteService } from "@/services/command-palette";
import { COMMAND_PALETTE_SERVICE } from "@/tokens/command-palette-service.token";

/** Result of {@link useCommandPalette}. Mirrors the legacy context shape. */
export interface UseCommandPaletteResult {
  /** Whether the palette is currently open. */
  isOpen: boolean;
  /** Open the palette. */
  open: () => void;
  /** Close the palette. */
  close: () => void;
  /** Toggle the palette. */
  toggle: () => void;
}

/**
 * Reads the reactive open state and returns the imperative openers.
 *
 * @example
 * ```tsx
 * function SearchTrigger() {
 *   const palette = useCommandPalette();
 *   return <Button onPress={palette.open}>Search…</Button>;
 * }
 * ```
 */
export function useCommandPalette(): UseCommandPaletteResult {
  const service = useInject<CommandPaletteService>(COMMAND_PALETTE_SERVICE);
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  return {
    isOpen: snapshot.isOpen,
    open: service.open,
    close: service.close,
    toggle: service.toggle,
  };
}
