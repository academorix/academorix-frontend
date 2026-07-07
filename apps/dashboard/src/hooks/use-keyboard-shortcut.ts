/**
 * @file use-keyboard-shortcut.ts
 * @module hooks/use-keyboard-shortcut
 *
 * @description
 * Minimal single-keystroke global keyboard hook. Attaches a `keydown`
 * listener to `window` and fires a handler when the pressed key matches a
 * target — respecting the "don't steal from form fields" convention used
 * everywhere else in the shell (see also the `⌘K` binding in
 * {@link "@/components/command/command-palette-provider"
 * CommandPaletteProvider}).
 *
 * ## Scope
 *
 * This hook covers the **single-key, no-modifier** case — the `?` binding
 * for the keyboard-shortcut sheet is the canonical use, but it's flexible
 * enough for any `/`, `Escape`, `?`, etc. binding. Combo shortcuts
 * (`Cmd+K`, `Cmd+Shift+T`) belong in dedicated hooks because their
 * conflict surface is different (the browser also owns some combos).
 *
 * ## Why not a full mousetrap-style library
 *
 * The application already binds shortcuts three different ways:
 *  - `CommandPaletteProvider` owns `Cmd/Ctrl+K` inline.
 *  - `Sidebar.Provider` owns `Cmd/Ctrl+B` (via `toggleShortcut` prop).
 *  - The context-menu hook owns `Escape` on the popover.
 *
 * A generic library would want to consolidate all three; that consolidation
 * is Phase 3 material (MENUS_PLAN.md §11.3 "user-editable shortcuts"). For
 * now, this hook is intentionally small — one key, one handler — so the
 * `?` binding lands without any library churn.
 */

import { useEffect } from "react";

/**
 * Options accepted by {@link useKeyboardShortcut}. Kept as an object so a
 * future opt-in (e.g. `allowInsideEditable`) does not turn into a
 * positional-arg breaking change.
 */
export interface UseKeyboardShortcutOptions {
  /**
   * Whether the hook is active. Renderers gate this with `false` when
   * they want to keep the hook mounted (stable subscribe cost) but pause
   * the effect — for example, while a modal is open and swallowing keys.
   * Defaults to `true`.
   */
  enabled?: boolean;

  /**
   * When true, fire the handler even if the event target is a form field
   * (`<input>`, `<textarea>`, `[contenteditable]`, `<select>`). Defaults
   * to `false` so a user typing into a search box does not accidentally
   * trigger a global shortcut.
   */
  allowInsideEditable?: boolean;
}

/**
 * Returns `true` when the target of a keydown event is a text-editable
 * element. Mirrors the check inside `CommandPaletteProvider` so both
 * behave identically.
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
 * Bind a single key at the window level. The handler is fired on every
 * `keydown` whose `event.key` matches `key` (case-sensitive — `"?"` will
 * NOT match `"/"`).
 *
 * ## Handler stability
 *
 * The effect re-attaches every time `handler` changes reference. Consumers
 * that want a stable listener should wrap the handler in `useCallback`.
 *
 * @param key - The exact `event.key` value to match. Example: `"?"`.
 * @param handler - Fires on match. Receives the raw event so callers can
 *                  `preventDefault()` if they want to swallow the key.
 * @param options - See {@link UseKeyboardShortcutOptions}. Defaults are
 *                  safe for a discoverability shortcut like `?`.
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {},
): void {
  const { enabled = true, allowInsideEditable = false } = options;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const listener = (event: KeyboardEvent): void => {
      if (event.key !== key) {
        return;
      }

      // Never steal from form fields unless the caller explicitly opts
      // in. Also drop when a modifier is held — a keystroke like
      // `Shift+/` on US layouts produces `event.key === "?"` but Shift
      // is already accounted for by the layout, so we don't want to
      // filter it out. We only reject Alt/Ctrl/Meta combos which almost
      // always belong to another owner.
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (!allowInsideEditable && isEditableTarget(event.target)) {
        return;
      }

      handler(event);
    };

    window.addEventListener("keydown", listener);

    return (): void => {
      window.removeEventListener("keydown", listener);
    };
  }, [key, handler, enabled, allowInsideEditable]);
}
