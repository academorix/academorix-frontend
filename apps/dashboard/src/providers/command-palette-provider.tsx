/**
 * @file command-palette-provider.tsx
 * @module providers/command-palette-provider
 *
 * @description
 * Owns ⌘K palette open state and installs a global `Cmd/Ctrl+K` listener.
 * Kept separate from the palette UI so the trigger surface (a chip in the
 * navbar) can render outside the palette's heavy code path.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

export type CommandPaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useKeyboardShortcut("Cmd+K", (event) => {
    event.preventDefault();
    toggle();
  });

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);

  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>.");

  return ctx;
}
