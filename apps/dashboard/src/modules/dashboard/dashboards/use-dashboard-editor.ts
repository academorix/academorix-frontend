/**
 * @file use-dashboard-editor.ts
 * @module modules/dashboard/dashboards/use-dashboard-editor
 *
 * @description
 * Editor state + undo/redo for a single dashboard. Given a resolved
 * {@link Dashboard} (loaded via {@link useDashboards}), this hook
 * hands the customise-panel + widget grid a controlled draft they can
 * mutate freely, tracks dirty state, exposes save / discard, and
 * carries a bounded undo stack.
 *
 * ## State machine
 *
 *   * `pristine` — the draft equals the persisted document. Save is
 *     disabled; discard is a no-op.
 *   * `dirty`    — the draft has diverged. Save applies the diff via
 *     the storage adapter; discard rolls back to the last persisted
 *     value.
 *   * `saving`   — an update call is in flight. Every mutator is
 *     ignored so the user can't queue-jump a save.
 *
 * ## Undo / redo
 *
 * Every mutation pushes the previous draft onto a bounded stack.
 * `undo` pops one; `redo` un-pops. The stack lives entirely in
 * memory — it doesn't persist across reloads, matching every
 * page-builder we researched (Figma, Notion, Framer).
 */

import { useCallback, useEffect, useMemo, useReducer } from "react";

import type {
  Dashboard,
  DashboardBreakpoint,
  DashboardDensity,
  DashboardFilters,
  DashboardLayoutMode,
  DashboardVisibility,
  LayoutItem,
  UpdateDashboardInput,
  WidgetInstance,
} from "@/modules/dashboard/dashboards/types";

/** Bounded undo/redo depth. */
const UNDO_STACK_MAX = 25;

/** Internal reducer state. */
interface EditorState {
  draft: Dashboard;
  undoStack: Dashboard[];
  redoStack: Dashboard[];
  isSaving: boolean;
  saveError: Error | null;
}

type EditorAction =
  | { type: "reset"; dashboard: Dashboard }
  | { type: "patch"; patch: Partial<Dashboard> }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "save-start" }
  | { type: "save-success"; dashboard: Dashboard }
  | { type: "save-error"; error: Error };

function pushHistory(stack: Dashboard[], entry: Dashboard): Dashboard[] {
  const next = [...stack, entry];

  if (next.length > UNDO_STACK_MAX) {
    return next.slice(next.length - UNDO_STACK_MAX);
  }

  return next;
}

/**
 * Deep-clone-lite for a dashboard draft — sufficient for our shape
 * because every nested field is JSON-safe.
 */
function cloneDashboard(source: Dashboard): Dashboard {
  return {
    ...source,
    layouts: {
      lg: [...source.layouts.lg],
      md: [...source.layouts.md],
      sm: [...source.layouts.sm],
    },
    widgets: [...source.widgets],
    filters: source.filters
      ? { ...source.filters, scope: source.filters.scope ? { ...source.filters.scope } : undefined }
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

      if (!previous) {
        return state;
      }

      return {
        ...state,
        draft: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.draft],
      };
    }

    case "redo": {
      const next = state.redoStack.at(-1);

      if (!next) {
        return state;
      }

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
 * Structural equality — compares the fields the editor is allowed to
 * touch. We ignore `updatedAt` + `version` because they only change
 * on save.
 */
function isDirty(draft: Dashboard, source: Dashboard): boolean {
  const draftShape = {
    name: draft.name,
    icon: draft.icon,
    color: draft.color,
    visibility: draft.visibility,
    isPinned: draft.isPinned,
    isDefault: draft.isDefault,
    layoutMode: draft.layoutMode,
    // Density is part of the drafted surface — treat it like every
    // other visual switch so toggling Cozy → Compact flips the
    // Save button on and re-persists the choice.
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

/** Callback provided by the parent to actually persist a save. */
export type EditorPersistFn = (id: string, input: UpdateDashboardInput) => Promise<Dashboard>;

/** Public shape of the editor hook. */
export interface UseDashboardEditor {
  /** The current in-memory draft — passed to the grid and the panel. */
  draft: Dashboard;
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
  /**
   * Update the dashboard's spacing density. Undoable through the
   * shared editor undo/redo stack — flipping Cozy → Compact and
   * back walks through the history exactly like every other patch.
   */
  setDensity: (density: DashboardDensity) => void;
  setFilters: (filters: DashboardFilters | undefined) => void;
  /** Toggle the sidebar-pin flag. */
  setPinned: (next: boolean) => void;
  /** Set the "is user's default dashboard" flag. */
  setIsDefault: (next: boolean) => void;
  /** Replace the widget list — used by reorder + bulk drag. */
  setWidgets: (widgets: readonly WidgetInstance[]) => void;

  /** Set a layout for a specific breakpoint. */
  setLayout: (breakpoint: DashboardBreakpoint, layout: readonly LayoutItem[]) => void;
  /** Add a widget instance at the tail of the widget list. */
  addWidget: (widget: WidgetInstance, layout: LayoutItem) => void;
  /** Remove a widget instance and any layout entry that references it. */
  removeWidget: (widgetId: string) => void;
  /** Update a widget instance's title or config. */
  updateWidget: (widgetId: string, patch: Partial<WidgetInstance>) => void;
}

/**
 * Bind the editor to a resolved {@link Dashboard} and a `persist`
 * callback. The persist callback is intentionally injected — the
 * editor doesn't import the storage adapter directly so tests + the
 * embed viewer can reuse the same reducer with a no-op persister.
 */
export function useDashboardEditor(
  source: Dashboard,
  persist: EditorPersistFn,
): UseDashboardEditor {
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
        // Include density in every save payload — the storage
        // adapter normalises `undefined` back to `"cozy"` on read,
        // but the wire shape should be explicit so the (future)
        // API doesn't have to guess.
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

  const patch = useCallback((next: Partial<Dashboard>) => {
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
  const setDensity = useCallback(
    // Same one-field patch shape as every other setter — routing
    // through `patch` keeps the undo stack coherent so pressing
    // Undo after a density flip walks back to the previous choice.
    (density: DashboardDensity) => patch({ density }),
    [patch],
  );
  const setFilters = useCallback(
    (filters: DashboardFilters | undefined) => patch({ filters }),
    [patch],
  );
  const setPinned = useCallback((isPinned: boolean) => patch({ isPinned }), [patch]);
  const setIsDefault = useCallback((isDefault: boolean) => patch({ isDefault }), [patch]);
  const setWidgets = useCallback(
    (widgets: readonly WidgetInstance[]) => patch({ widgets }),
    [patch],
  );

  const setLayout = useCallback(
    (breakpoint: DashboardBreakpoint, layout: readonly LayoutItem[]) => {
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
    (widget: WidgetInstance, layout: LayoutItem) => {
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
    (widgetId: string, widgetPatch: Partial<WidgetInstance>) => {
      patch({
        widgets: state.draft.widgets.map((entry) =>
          entry.id === widgetId ? { ...entry, ...widgetPatch } : entry,
        ),
      });
    },
    [patch, state.draft.widgets],
  );

  return useMemo<UseDashboardEditor>(
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
