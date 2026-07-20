/**
 * @file use-dashboard-editor.hook.ts
 * @module @stackra/dashboard/react/hooks/use-dashboard-editor
 * @description Editor state + undo/redo for a single dashboard.
 *
 *   Given a resolved {@link IDashboard} (loaded via {@link useDashboards}),
 *   this hook hands the customise-panel + widget grid a controlled
 *   draft they can mutate freely, tracks dirty state, exposes save /
 *   discard, and carries a bounded undo stack.
 *
 *   ## State machine
 *
 *   - `pristine` — the draft equals the persisted document. Save is
 *     disabled; discard is a no-op.
 *   - `dirty` — the draft has diverged. Save applies the diff via the
 *     storage adapter; discard rolls back to the last persisted value.
 *   - `saving` — an update call is in flight. Every mutator is
 *     ignored so the user can't queue-jump a save.
 *
 *   ## Undo / redo
 *
 *   Every mutation pushes the previous draft onto a bounded stack.
 *   `undo` pops one; `redo` un-pops. The stack lives entirely in
 *   memory — it doesn't persist across reloads, matching every
 *   page-builder we researched (Figma, Notion, Framer).
 */

import { useCallback, useEffect, useMemo, useReducer } from "react";

import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardFilters } from "@/core/interfaces/dashboard-filters.interface";
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { DashboardDensity } from "@/core/types/dashboard-density.type";
import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";
import type { DashboardVisibility } from "@/core/types/dashboard-visibility.type";

import type { EditorPersistFn, IUseDashboardEditor } from "./use-dashboard-editor.interface";

/** Bounded undo/redo depth. */
const UNDO_STACK_MAX = 25;

/** Internal reducer state. */
interface EditorState {
  draft: IDashboard;
  undoStack: IDashboard[];
  redoStack: IDashboard[];
  isSaving: boolean;
  saveError: Error | null;
}

type EditorAction =
  | { type: "reset"; dashboard: IDashboard }
  | { type: "patch"; patch: Partial<IDashboard> }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "save-start" }
  | { type: "save-success"; dashboard: IDashboard }
  | { type: "save-error"; error: Error };

/** Cap the undo stack — bounded so long editing sessions stay stable. */
function pushHistory(stack: IDashboard[], entry: IDashboard): IDashboard[] {
  const next = [...stack, entry];

  if (next.length > UNDO_STACK_MAX) {
    return next.slice(next.length - UNDO_STACK_MAX);
  }

  return next;
}

/**
 * Deep-clone-lite for a dashboard draft — sufficient because every
 * nested field is JSON-safe. Faster than `structuredClone` for the
 * common case and avoids the sync-only ergonomics of `JSON.parse`.
 */
function cloneDashboard(source: IDashboard): IDashboard {
  return {
    ...source,
    layouts: {
      lg: [...source.layouts.lg],
      md: [...source.layouts.md],
      sm: [...source.layouts.sm],
    },
    widgets: [...source.widgets],
    filters: source.filters
      ? {
          ...source.filters,
          scope: source.filters.scope ? { ...source.filters.scope } : undefined,
        }
      : undefined,
  };
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "reset":
      return {
        draft: cloneDashboard(action.dashboard),
        undoStack: [],
        redoStack: [],
        isSaving: false,
        saveError: null,
      };

    case "patch": {
      const nextDraft = { ...state.draft, ...action.patch };

      return {
        ...state,
        draft: nextDraft,
        undoStack: pushHistory(state.undoStack, state.draft),
        redoStack: [],
      };
    }

    case "undo": {
      const previous = state.undoStack.at(-1);

      if (!previous) return state;

      return {
        ...state,
        draft: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.draft],
      };
    }

    case "redo": {
      const next = state.redoStack.at(-1);

      if (!next) return state;

      return {
        ...state,
        draft: next,
        undoStack: [...state.undoStack, state.draft],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    case "save-start":
      return { ...state, isSaving: true, saveError: null };

    case "save-success":
      return {
        draft: cloneDashboard(action.dashboard),
        undoStack: [],
        redoStack: [],
        isSaving: false,
        saveError: null,
      };

    case "save-error":
      return { ...state, isSaving: false, saveError: action.error };

    default:
      return state;
  }
}

/**
 * Structural equality — compares only the fields the editor is
 * allowed to touch. We ignore `updatedAt` + `version` because they
 * only change on save.
 */
function isDirty(draft: IDashboard, source: IDashboard): boolean {
  const draftShape = {
    name: draft.name,
    icon: draft.icon,
    color: draft.color,
    visibility: draft.visibility,
    isPinned: draft.isPinned,
    isDefault: draft.isDefault,
    layoutMode: draft.layoutMode,
    density: draft.density ?? "cozy",
    layouts: draft.layouts,
    widgets: draft.widgets,
    filters: draft.filters ?? null,
  };
  const sourceShape = {
    name: source.name,
    icon: source.icon,
    color: source.color,
    visibility: source.visibility,
    isPinned: source.isPinned,
    isDefault: source.isDefault,
    layoutMode: source.layoutMode,
    density: source.density ?? "cozy",
    layouts: source.layouts,
    widgets: source.widgets,
    filters: source.filters ?? null,
  };

  return JSON.stringify(draftShape) !== JSON.stringify(sourceShape);
}

/**
 * Bind the editor to a resolved {@link IDashboard} and a `persist`
 * callback.
 *
 * @param source - The persisted dashboard we're editing.
 * @param persist - Callback that persists the update; typically
 *   bound to `useDashboards().update`.
 * @returns Editor state + mutators.
 *
 * @example
 * ```typescript
 * import { useDashboardEditor, useDashboards } from '@stackra/dashboard/react';
 *
 * const registry = useDashboards(storage);
 * const editor = useDashboardEditor(dashboard, registry.update);
 * ```
 */
export function useDashboardEditor(
  source: IDashboard,
  persist: EditorPersistFn,
): IUseDashboardEditor {
  const [state, dispatch] = useReducer(reducer, source, (initial) => ({
    draft: cloneDashboard(initial),
    undoStack: [],
    redoStack: [],
    isSaving: false,
    saveError: null,
  }));

  // Rebind when the caller switches which dashboard we're editing.
  useEffect(() => {
    dispatch({ type: "reset", dashboard: source });
  }, [source]);

  const dirty = useMemo(() => isDirty(state.draft, source), [state.draft, source]);

  const save = useCallback(async () => {
    dispatch({ type: "save-start" });
    try {
      const saved = await persist(state.draft.id, {
        version: state.draft.version,
        name: state.draft.name,
        icon: state.draft.icon,
        color: state.draft.color,
        visibility: state.draft.visibility,
        isPinned: state.draft.isPinned,
        isDefault: state.draft.isDefault,
        layoutMode: state.draft.layoutMode,
        density: state.draft.density ?? "cozy",
        layouts: state.draft.layouts,
        widgets: state.draft.widgets,
        filters: state.draft.filters,
      });

      dispatch({ type: "save-success", dashboard: saved });
    } catch (caught) {
      dispatch({
        type: "save-error",
        error: caught instanceof Error ? caught : new Error(String(caught)),
      });
      throw caught;
    }
  }, [persist, state.draft]);

  const discard = useCallback(() => {
    dispatch({ type: "reset", dashboard: source });
  }, [source]);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const patch = useCallback((next: Partial<IDashboard>) => {
    dispatch({ type: "patch", patch: next });
  }, []);

  const setName = useCallback((name: string) => patch({ name }), [patch]);
  const setIcon = useCallback((icon: string | undefined) => patch({ icon }), [patch]);
  const setColor = useCallback((color: string | undefined) => patch({ color }), [patch]);
  const setVisibility = useCallback(
    (visibility: DashboardVisibility) => patch({ visibility }),
    [patch],
  );
  const setLayoutMode = useCallback(
    (layoutMode: DashboardLayoutMode) => patch({ layoutMode }),
    [patch],
  );
  const setDensity = useCallback((density: DashboardDensity) => patch({ density }), [patch]);
  const setFilters = useCallback(
    (filters: IDashboardFilters | undefined) => patch({ filters }),
    [patch],
  );
  const setPinned = useCallback((isPinned: boolean) => patch({ isPinned }), [patch]);
  const setIsDefault = useCallback((isDefault: boolean) => patch({ isDefault }), [patch]);
  const setWidgets = useCallback(
    (widgets: readonly IWidgetInstance[]) => patch({ widgets }),
    [patch],
  );

  const setLayout = useCallback(
    (breakpoint: DashboardBreakpoint, layout: readonly ILayoutItem[]) => {
      patch({
        layouts: {
          ...state.draft.layouts,
          [breakpoint]: layout,
        },
      });
    },
    [patch, state.draft.layouts],
  );

  const addWidget = useCallback(
    (widget: IWidgetInstance, layout: ILayoutItem) => {
      patch({
        widgets: [...state.draft.widgets, widget],
        layouts: {
          lg: [...state.draft.layouts.lg, layout],
          md: [...state.draft.layouts.md, layout],
          sm: [...state.draft.layouts.sm, layout],
        },
      });
    },
    [patch, state.draft.layouts, state.draft.widgets],
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      patch({
        widgets: state.draft.widgets.filter((entry) => entry.id !== widgetId),
        layouts: {
          lg: state.draft.layouts.lg.filter((entry) => entry.widgetId !== widgetId),
          md: state.draft.layouts.md.filter((entry) => entry.widgetId !== widgetId),
          sm: state.draft.layouts.sm.filter((entry) => entry.widgetId !== widgetId),
        },
      });
    },
    [patch, state.draft.layouts, state.draft.widgets],
  );

  const updateWidget = useCallback(
    (widgetId: string, widgetPatch: Partial<IWidgetInstance>) => {
      patch({
        widgets: state.draft.widgets.map((entry) =>
          entry.id === widgetId ? { ...entry, ...widgetPatch } : entry,
        ),
      });
    },
    [patch, state.draft.widgets],
  );

  return useMemo<IUseDashboardEditor>(
    () => ({
      draft: state.draft,
      isDirty: dirty,
      isSaving: state.isSaving,
      saveError: state.saveError,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
      save,
      discard,
      undo,
      redo,
      setName,
      setIcon,
      setColor,
      setVisibility,
      setLayoutMode,
      setDensity,
      setFilters,
      setPinned,
      setIsDefault,
      setWidgets,
      setLayout,
      addWidget,
      removeWidget,
      updateWidget,
    }),
    [
      state,
      dirty,
      save,
      discard,
      undo,
      redo,
      setName,
      setIcon,
      setColor,
      setVisibility,
      setLayoutMode,
      setDensity,
      setFilters,
      setPinned,
      setIsDefault,
      setWidgets,
      setLayout,
      addWidget,
      removeWidget,
      updateWidget,
    ],
  );
}
