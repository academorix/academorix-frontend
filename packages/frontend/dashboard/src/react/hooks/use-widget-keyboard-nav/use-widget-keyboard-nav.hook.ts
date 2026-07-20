/**
 * @file use-widget-keyboard-nav.hook.ts
 * @module @stackra/dashboard/react/hooks/use-widget-keyboard-nav
 * @description Keyboard-first widget navigation. When the customise
 *   panel is open, this hook binds a set of document-level shortcuts
 *   that let the user pilot the widget grid without touching the
 *   mouse:
 *
 *   - `Tab` / `Shift+Tab` — advance / retreat selection; wraps.
 *   - `Space` / `Enter` — open the selected widget's action menu.
 *   - `Delete` / `Backspace` — remove the selected widget.
 *   - `Arrow keys` — reorder by swapping with the neighbour.
 *   - `Escape` — deselect.
 *
 *   All shortcuts short-circuit when the keydown target is a text
 *   input so typing a dashboard name doesn't accidentally reorder
 *   widgets.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";

import type {
  IUseWidgetKeyboardNav,
  IUseWidgetKeyboardNavInput,
  IWidgetKeyboardProps,
} from "./use-widget-keyboard-nav.interface";

/**
 * Detect keystrokes originating inside an editable target so the
 * hook stays out of the user's way while they type.
 */
function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Compute the wrap-around next / previous index of the current
 * selection in `widgets`. Returns `null` when the list is empty.
 */
function neighbourIndex(
  widgets: readonly IWidgetInstance[],
  selectedId: string | null,
  direction: "next" | "previous",
): number | null {
  if (widgets.length === 0) return null;

  const currentIndex = selectedId ? widgets.findIndex((widget) => widget.id === selectedId) : -1;

  if (currentIndex < 0) {
    // Nothing selected → Tab picks the first, Shift+Tab the last.
    return direction === "next" ? 0 : widgets.length - 1;
  }

  const delta = direction === "next" ? 1 : -1;

  return (currentIndex + delta + widgets.length) % widgets.length;
}

/**
 * Try to open a widget's action menu by clicking a well-known DOM
 * anchor. Consumers decorate their overflow trigger with
 * `data-widget-actions={widgetId}` so this helper is portable — no
 * ref plumbing required.
 *
 * @param widgetId - Widget instance id to open the menu for.
 * @returns `true` when a menu button was found + clicked.
 */
function openActionMenuFor(widgetId: string): boolean {
  if (typeof document === "undefined") return false;

  const escaped = widgetId.replace(/"/g, '\\"');
  const button = document.querySelector<HTMLButtonElement>(`[data-widget-actions="${escaped}"]`);

  if (!button) return false;

  button.focus();
  button.click();

  return true;
}

/**
 * Bind keyboard shortcuts + selection state for the widget grid.
 *
 * The hook is intentionally UI-agnostic — it doesn't render
 * anything, just wires event handlers. The canvas remains in charge
 * of the DOM shape and layout.
 *
 * @param input - `widgets` + `isEnabled` + callbacks.
 * @returns Selection state + prop factory.
 */
export function useWidgetKeyboardNav(input: IUseWidgetKeyboardNavInput): IUseWidgetKeyboardNav {
  const { widgets, isEnabled, onReorder, onRemove, onDuplicate } = input;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((widgetId: string | null) => {
    setSelectedId(widgetId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Drop selections that no longer resolve — prevents "phantom"
  // selection after a widget was removed elsewhere.
  useEffect(() => {
    if (selectedId === null) return;

    const stillExists = widgets.some((widget) => widget.id === selectedId);

    if (!stillExists) setSelectedId(null);
  }, [widgets, selectedId]);

  // Main keydown listener — registered on `document` so shortcuts
  // fire regardless of which grid tile has native focus.
  useEffect(() => {
    if (!isEnabled) return;
    if (typeof document === "undefined") return;

    const onKeyDown = (event: KeyboardEvent): void => {
      // Never intercept keys the user is typing inside a field.
      if (isEditableTarget(event)) return;

      if (event.key === "Escape") {
        if (selectedId !== null) {
          event.preventDefault();
          setSelectedId(null);
        }

        return;
      }

      if (event.key === "Tab") {
        // Only steal Tab when at least one widget exists — otherwise
        // let the browser continue normal focus traversal.
        if (widgets.length === 0) return;

        const direction = event.shiftKey ? "previous" : "next";
        const nextIndex = neighbourIndex(widgets, selectedId, direction);

        if (nextIndex === null) return;

        event.preventDefault();
        // `neighbourIndex` returns a valid index into `widgets` when
        // the list is non-empty, so this access is safe.
        setSelectedId(widgets[nextIndex]!.id);

        return;
      }

      // Every other shortcut requires a selected widget.
      if (selectedId === null) return;

      const currentIndex = widgets.findIndex((widget) => widget.id === selectedId);

      if (currentIndex < 0) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onRemove(selectedId);
        setSelectedId(null);

        return;
      }

      if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
        event.preventDefault();
        // Best-effort: if a downstream widget exposed a menu-trigger
        // anchor, click it. Otherwise no-op.
        openActionMenuFor(selectedId);

        return;
      }

      const isArrow =
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight";

      if (!isArrow) return;

      // Arrow keys reorder. We don't wrap past the ends so power
      // users don't accidentally teleport widgets around.
      const isForward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const targetIndex = isForward ? currentIndex + 1 : currentIndex - 1;

      if (targetIndex < 0 || targetIndex >= widgets.length) return;

      event.preventDefault();
      onReorder(currentIndex, targetIndex);
      // Selection follows the widget — it hasn't moved identity,
      // only position, so we keep `selectedId` unchanged.
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isEnabled, widgets, selectedId, onReorder, onRemove]);

  // When shortcuts are disabled, drop the selection so re-enabling
  // starts from a clean slate.
  useEffect(() => {
    if (!isEnabled) setSelectedId(null);
  }, [isEnabled]);

  // Build a memoised prop factory. Returning the same object shape
  // per selection state prevents unnecessary re-renders on widgets
  // that aren't the selected one.
  const getWidgetProps = useMemo(() => {
    return (widgetId: string): IWidgetKeyboardProps => {
      const isSelected = widgetId === selectedId;

      return {
        isSelected,
        tabIndex: isSelected ? 0 : -1,
        onFocus: () => setSelectedId(widgetId),
        "data-selected": isSelected ? "true" : "false",
      };
    };
  }, [selectedId]);

  return useMemo<IUseWidgetKeyboardNav>(
    () => ({
      selectedId,
      select,
      clearSelection,
      getWidgetProps,
      onDuplicate,
    }),
    [selectedId, select, clearSelection, getWidgetProps, onDuplicate],
  );
}
