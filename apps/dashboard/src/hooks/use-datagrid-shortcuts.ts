/**
 * @file use-datagrid-shortcuts.ts
 * @module hooks/use-datagrid-shortcuts
 *
 * @description
 * Wires the listing-scoped keyboard shortcuts from §13.2:
 * `J` / `K` — move focus between rows, `Enter` — open focused row,
 * `E` — edit focused row, `X` — toggle selection, `⌘ A` — select all,
 * `Del` — prompt delete.
 *
 * Applied when a `DataGrid` container has focus. Uses `document.activeElement`
 * containment check so shortcuts only fire when the user is inside a grid.
 */

import { useEffect } from "react";

type DataGridShortcutsOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  onSelectNext?: () => void;
  onSelectPrev?: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
  onToggleSelect?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
};

function isEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;

  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox"
  );
}

export function useDataGridShortcuts(options: DataGridShortcutsOptions): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const container = options.containerRef.current;

      if (!container) return;
      const active = document.activeElement;

      if (!container.contains(active)) return;
      if (isEditableElement(active)) return;

      const isMod = event.metaKey || event.ctrlKey;

      switch (event.key) {
        case "j":
        case "J":
          event.preventDefault();
          options.onSelectNext?.();
          break;
        case "k":
        case "K":
          event.preventDefault();
          options.onSelectPrev?.();
          break;
        case "x":
        case "X":
          event.preventDefault();
          options.onToggleSelect?.();
          break;
        case "Enter":
          event.preventDefault();
          options.onOpen?.();
          break;
        case "e":
        case "E":
          event.preventDefault();
          options.onEdit?.();
          break;
        case "a":
        case "A":
          if (isMod && event.shiftKey) {
            event.preventDefault();
            options.onClearSelection?.();
          } else if (isMod) {
            event.preventDefault();
            options.onSelectAll?.();
          }
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          options.onDelete?.();
          break;
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [options]);
}

type DetailShortcutOptions = {
  onEdit?: () => void;
  onDelete?: () => void;
  onTabByIndex?: (index: number) => void;
};

/** Detail-page shortcuts: `1-9` jump to tab N, `E` edit, `Del` delete. */
export function useDetailShortcuts(options: DetailShortcutOptions): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) return;

      if (event.key >= "1" && event.key <= "9") {
        event.preventDefault();
        options.onTabByIndex?.(Number(event.key) - 1);

        return;
      }
      switch (event.key) {
        case "e":
        case "E":
          event.preventDefault();
          options.onEdit?.();
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          options.onDelete?.();
          break;
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [options]);
}
