/**
 * @file use-dashboard-editor.interface.ts
 * @module @stackra/dashboard/react/hooks/use-dashboard-editor
 * @description Public return shape for {@link useDashboardEditor}.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardFilters } from "@/core/interfaces/dashboard-filters.interface";
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IUpdateDashboardInput } from "@/core/interfaces/update-dashboard-input.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { DashboardDensity } from "@/core/types/dashboard-density.type";
import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";
import type { DashboardVisibility } from "@/core/types/dashboard-visibility.type";

/**
 * Persist callback the editor calls on `save()`. Injected so the
 * editor stays independent of the storage adapter — tests + the
 * embed viewer can reuse the same reducer with a no-op persister.
 */
export type EditorPersistFn = (id: string, input: IUpdateDashboardInput) => Promise<IDashboard>;

/**
 * Public shape of the editor hook.
 */
export interface IUseDashboardEditor {
  /** Current in-memory draft — passed to the grid and the panel. */
  draft: IDashboard;

  /** True when the draft has diverged from the persisted document. */
  isDirty: boolean;

  /** True while a save call is in flight. */
  isSaving: boolean;

  /** Any error from the last save attempt. */
  saveError: Error | null;

  /** True when the undo stack has an entry. */
  canUndo: boolean;

  /** True when the redo stack has an entry. */
  canRedo: boolean;

  /** Persist the draft to the storage adapter. */
  save: () => Promise<void>;

  /** Roll the draft back to the last persisted state. */
  discard: () => void;

  /** Undo the last change. */
  undo: () => void;

  /** Redo the last undone change. */
  redo: () => void;

  /** Rename the dashboard. */
  setName: (name: string) => void;
  setIcon: (icon: string | undefined) => void;
  setColor: (color: string | undefined) => void;
  setVisibility: (visibility: DashboardVisibility) => void;
  setLayoutMode: (mode: DashboardLayoutMode) => void;
  setDensity: (density: DashboardDensity) => void;
  setFilters: (filters: IDashboardFilters | undefined) => void;
  setPinned: (next: boolean) => void;
  setIsDefault: (next: boolean) => void;
  setWidgets: (widgets: readonly IWidgetInstance[]) => void;

  /** Set a layout for a specific breakpoint. */
  setLayout: (breakpoint: DashboardBreakpoint, layout: readonly ILayoutItem[]) => void;

  /** Add a widget instance at the tail of the widget list. */
  addWidget: (widget: IWidgetInstance, layout: ILayoutItem) => void;

  /** Remove a widget instance and any layout entry that references it. */
  removeWidget: (widgetId: string) => void;

  /** Update a widget instance's title or config. */
  updateWidget: (widgetId: string, patch: Partial<IWidgetInstance>) => void;
}
