/**
 * @file keyboard-shortcut-sheet.tsx
 * @module components/keyboard/keyboard-shortcut-sheet
 *
 * @description
 * The **discoverability sheet** documented in menus module — a
 * HeroUI Modal that lists every menu command, grouped by category, with
 * its OS-appropriate shortcut glyph rendered next to the label. Opens on
 * `?`, closes on Escape, and pulls its content directly from the unified
 * command registry so a new command shows up here automatically.
 *
 * ## Component split
 *
 *  - `KeyboardShortcutSheetProvider` — owns the modal's open state, wires
 *    the `?` global shortcut, listens for the
 *    `help.keyboard_shortcuts` menu action, and exposes an imperative
 *    `open()`/`close()` API via context. Mounted once inside the
 *    authenticated shell.
 *  - `useKeyboardShortcutSheet` — the reader hook consumers use to open
 *    the sheet programmatically (e.g. the help menu item that fires
 *    without a keyboard shortcut).
 *  - The visual (Modal + list) is a private component reachable only
 *    through the provider — no consumer needs to render it directly.
 *
 * ## Rendering strategy
 *
 * The sheet walks the app-surface command list through
 * `filterVisibleCommands("app", ctx)` and `groupByCategory`, then renders
 * one section per category. Commands with no shortcut still appear (a
 * user searching for "sign out" wants to see it even without a bound
 * combo) — the shortcut column simply reads `—` as a placeholder.
 *
 * A search box would be a natural add-on but is deferred: the list fits
 * on one screen at Phase 1 volume, and the muscle-memory audience the
 * sheet targets scans headings, not free text.
 */

import { Button, Kbd, Modal, useOverlayState } from "@academorix/ui/react";
import { createContext, useCallback, useContext, useMemo } from "react";

import type { MenuCategory, MenuCommand, MenuContext, ShortcutOs } from "@/lib/menus/command.types";
import type { ReactNode } from "react";

import { menuCommands } from "@/config/menu.config";
import { detectOs } from "@/config/shortcuts.config";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useMenuAction } from "@/lib/menus/menu-actions";
import {
  filterVisibleCommands,
  groupByCategory,
  resolveShortcutDisplay,
} from "@/lib/menus/registry-helpers";

// ---------------------------------------------------------------------------
// Context + provider
// ---------------------------------------------------------------------------

/** Shape of the keyboard-shortcut-sheet context. */
export interface KeyboardShortcutSheetContextValue {
  /** Whether the sheet is currently open. */
  isOpen: boolean;
  /** Open the sheet. Fires the Modal's controlled `onOpenChange`. */
  open: () => void;
  /** Close the sheet. */
  close: () => void;
}

const KeyboardShortcutSheetContext = createContext<KeyboardShortcutSheetContextValue | null>(null);

/**
 * Category display labels — mirrors the fallback set inside `context-menu.tsx`
 * so the same string lands in every renderer without a translation key.
 * A future i18n pass folds these into the message catalog.
 */
const CATEGORY_LABEL: Record<MenuCategory, string> = {
  application: "Application",
  file: "File",
  edit: "Edit",
  view: "View",
  workspace: "Workspace",
  navigate: "Go to",
  action: "Actions",
  help: "Help",
  developer: "Developer",
};

/**
 * Placement of the placeholder token in the shortcut column when a
 * command has no bound accelerator. `—` (em dash) is the standard
 * "no value" glyph used elsewhere in the shell.
 */
const NO_SHORTCUT = "\u2014";

/**
 * Provider that owns the sheet's open state and wires:
 *  - the `?` global shortcut,
 *  - the `help.keyboard_shortcuts` menu action (fired from the menu
 *    registry),
 *  - the `useOverlayState` interface HeroUI's Modal reads.
 *
 * Mount ONCE inside the authenticated shell — nested mounts would race
 * for keystrokes.
 */
export function KeyboardShortcutSheetProvider({ children }: { children: ReactNode }): ReactNode {
  const state = useOverlayState();

  const open = useCallback(() => {
    state.open();
  }, [state]);

  const close = useCallback(() => {
    state.close();
  }, [state]);

  // Bind the global `?` shortcut. The hook is a no-op inside form fields
  // by design, matching the CommandPaletteProvider's `⌘K` behaviour.
  useKeyboardShortcut("?", (event) => {
    event.preventDefault();
    open();
  });

  // Bridge the menu registry's `help.keyboard_shortcuts` action to the
  // same open call. The registry lives at module scope and cannot call
  // React hooks directly; the action bus is our decoupling seam.
  useMenuAction("help.keyboard_shortcuts", open);

  const value = useMemo<KeyboardShortcutSheetContextValue>(
    () => ({ isOpen: state.isOpen, open, close }),
    [state.isOpen, open, close],
  );

  return (
    <KeyboardShortcutSheetContext.Provider value={value}>
      {children}
      <KeyboardShortcutSheet state={state} />
    </KeyboardShortcutSheetContext.Provider>
  );
}

/**
 * Read the sheet context. Callable from any consumer inside the
 * authenticated shell.
 *
 * @throws Error when called outside {@link KeyboardShortcutSheetProvider}.
 *          Kept loud on purpose — a silent context miss would render a
 *          menu command that appears to do nothing.
 */
export function useKeyboardShortcutSheet(): KeyboardShortcutSheetContextValue {
  const value = useContext(KeyboardShortcutSheetContext);

  if (!value) {
    throw new Error(
      "useKeyboardShortcutSheet must be used inside a KeyboardShortcutSheetProvider. Mount the provider inside AuthenticatedLayout.",
    );
  }

  return value;
}

// ---------------------------------------------------------------------------
// Visual
// ---------------------------------------------------------------------------

/**
 * Props for the internal sheet renderer. Kept internal so consumers can
 * only open/close via the provider's `useKeyboardShortcutSheet` — nobody
 * should pass their own `open` state to the sheet.
 */
interface KeyboardShortcutSheetInternalProps {
  /** HeroUI `useOverlayState` handle, passed from the provider. */
  state: ReturnType<typeof useOverlayState>;
}

/**
 * The actual modal. Reads its state from the shared `useOverlayState`
 * created by the provider so both the shortcut binding and the menu
 * action can drive it.
 */
function KeyboardShortcutSheet({ state }: KeyboardShortcutSheetInternalProps): ReactNode {
  // Snapshot the command list into groups on every render — cheap given
  // registry size (~11 entries today, ~60 at full rollout). Recomputing
  // per render also means an updated registry (dev HMR) reflects
  // immediately without a manual refresh.
  const groups = useMemo(() => {
    // Context is empty for the sheet — every command is visible on the
    // `app` surface unless its `isVisible(ctx)` says otherwise. Passing
    // an empty context lets predicates that don't read context still
    // work while giving those that do a chance to hide themselves.
    const ctx: MenuContext = { source: "app-menu" };
    const visible = filterVisibleCommands(menuCommands, "app", ctx);

    return groupByCategory(visible);
  }, []);

  const os = useMemo(() => detectOs(), []);

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-lg" data-testid="keyboard-shortcut-sheet">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Keyboard shortcuts</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              Every command available from the menus, grouped by category. Press{" "}
              <Kbd className="mx-0.5" variant="light">
                ?
              </Kbd>{" "}
              anywhere to open this sheet.
            </p>
          </Modal.Header>
          <Modal.Body className="max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col gap-6">
              {[...groups.entries()].map(([category, commands]) => (
                <section
                  key={category}
                  aria-labelledby={`shortcut-heading-${category}`}
                  className="flex flex-col gap-2"
                  data-testid={`shortcut-section-${category}`}
                >
                  <h3
                    className="text-xs font-medium tracking-wide text-muted uppercase"
                    id={`shortcut-heading-${category}`}
                  >
                    {CATEGORY_LABEL[category]}
                  </h3>
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {commands.map((command) => (
                      <ShortcutRow key={command.id} command={command} os={os} />
                    ))}
                  </ul>
                </section>
              ))}
              {groups.size === 0 ? (
                <p className="text-sm text-muted">No shortcuts available.</p>
              ) : null}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close">Close</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/**
 * A single row in the shortcut list. Kept as a component (not inlined)
 * so a future variant — bindings with descriptions, editable rows —
 * lands as a prop change rather than a diff churn.
 */
function ShortcutRow({ command, os }: { command: MenuCommand; os: ShortcutOs }): ReactNode {
  const shortcut = resolveShortcutDisplay(command, os);

  return (
    <li
      className="flex items-center justify-between gap-4 px-3 py-2.5"
      data-testid={`shortcut-row-${command.id}`}
    >
      <span className="truncate text-sm text-foreground">{command.labelKey}</span>
      <span className="shrink-0 text-xs text-muted tabular-nums">{shortcut ?? NO_SHORTCUT}</span>
    </li>
  );
}
