/**
 * @file command-palette-provider.tsx
 * @module components/command/command-palette-provider
 *
 * @description
 * Global context for the ⌘K command palette. The provider owns the open/close
 * state and installs a document-level key listener that opens the palette on
 * `Cmd/Ctrl + K` from anywhere in the authenticated shell. Consumers read the
 * `useCommandPalette` hook to open, close, or toggle programmatically (for
 * example from the navbar's search trigger).
 *
 * Kept separate from the palette UI so the trigger surface (a chip in the
 * navbar) can render inside its own React tree without pulling in the heavy
 * `Command` component code path.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

/** Shape of the command-palette context value. */
export interface CommandPaletteContextValue {
  /** Whether the palette is currently open. */
  isOpen: boolean;
  /** Open the palette. Called from the navbar search trigger and the ⌘K listener. */
  open: () => void;
  /** Close the palette. */
  close: () => void;
  /** Toggle the palette open state. */
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

/**
 * Returns `true` when the target of a keydown event is a text-editable
 * element, so we do not steal `⌘K` from a form field where the user is
 * expecting standard browser behaviour.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Provider that owns the palette open state and the global keyboard shortcut.
 * Mount this once at the authenticated shell root so every child can call
 * {@link useCommandPalette}.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }): ReactNode {
  const [isOpen, setOpen] = useState(false);

  const open = useCallback(() => {
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Listen for `Cmd/Ctrl + K` at the document level so any keystroke opens the
  // palette. The listener explicitly ignores keystrokes inside form fields so
  // an operator typing into a search box does not lose their input.
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const isModifier = event.metaKey || event.ctrlKey;
      const isK = event.key === "k" || event.key === "K";

      if (!isModifier || !isK) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handler);

    return (): void => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle],
  );

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

/**
 * Reads the command-palette state. Throws when called outside a
 * {@link CommandPaletteProvider}.
 */
export function useCommandPalette(): CommandPaletteContextValue {
  const value = useContext(CommandPaletteContext);

  if (!value) {
    throw new Error(
      "useCommandPalette must be used inside a CommandPaletteProvider. Mount the provider inside AuthenticatedLayout.",
    );
  }

  return value;
}
