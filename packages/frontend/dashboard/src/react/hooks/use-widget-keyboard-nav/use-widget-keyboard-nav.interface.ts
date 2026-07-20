/**
 * @file use-widget-keyboard-nav.interface.ts
 * @module @stackra/dashboard/react/hooks/use-widget-keyboard-nav
 * @description Input + output shapes for
 *   {@link useWidgetKeyboardNav}. Family-grouped: every interface
 *   below is used only via the outer hook, so they share a single
 *   file per the code-standards composite-family rule.
 */

import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";

/**
 * Spreadable prop bag `getWidgetProps` returns. Consumers spread it
 * onto their widget wrapper element. Kept as a plain object (not a
 * component) so the canvas remains in charge of DOM shape.
 */
export interface IWidgetKeyboardProps {
  /** Whether this widget is the currently-selected one. */
  isSelected: boolean;

  /**
   * `0` when selected, `-1` otherwise. Roving-tabindex pattern —
   * only one widget is in the tab sequence at a time.
   */
  tabIndex: 0 | -1;

  /**
   * Fires when the widget receives DOM focus (mouse click, initial
   * mount, or programmatic focus). Syncs the hook's selection to the
   * DOM so users can click or arrow-key their way in.
   */
  onFocus: () => void;

  /**
   * DOM attribute mirror of {@link isSelected}. Kept as a string so
   * CSS-only surfaces can style via `[data-selected="true"]` without
   * inspecting a boolean prop.
   */
  "data-selected": "true" | "false";
}

/**
 * Input signature for {@link useWidgetKeyboardNav}.
 */
export interface IUseWidgetKeyboardNavInput {
  /** The widget list, in current visual order. Read-only. */
  widgets: readonly IWidgetInstance[];

  /**
   * Whether keyboard shortcuts should be active. Wire this to the
   * "customise panel open" flag so shortcuts sleep on the read-only
   * dashboard page.
   */
  isEnabled: boolean;

  /**
   * Reorder callback — invoked with source + target indices. Matches
   * the signature the dashboard page already exposes.
   */
  onReorder: (from: number, to: number) => void;

  /**
   * Remove callback — invoked on Delete / Backspace with the
   * selected widget id.
   */
  onRemove: (widgetId: string) => void;

  /**
   * Duplicate callback — the hook never triggers it automatically,
   * but exposes it in the return shape so consumers can wire
   * arbitrary widget actions from Space/Enter menus.
   */
  onDuplicate?: (widgetId: string) => void;
}

/**
 * Output shape of {@link useWidgetKeyboardNav}.
 */
export interface IUseWidgetKeyboardNav {
  /** The currently-selected widget id, or `null` when nothing is selected. */
  selectedId: string | null;

  /** Programmatically select a widget by id. */
  select: (widgetId: string | null) => void;

  /** Programmatically clear the current selection. */
  clearSelection: () => void;

  /**
   * Spreadable-prop factory for the widget wrapper element. Returns
   * a stable object per selection state so React's reconciler
   * doesn't churn the wrapper on unrelated re-renders.
   */
  getWidgetProps: (widgetId: string) => IWidgetKeyboardProps;

  /**
   * Passed-through onDuplicate handle. Not called from inside the
   * hook — exposed so consumers have a single import surface.
   */
  onDuplicate?: (widgetId: string) => void;
}
