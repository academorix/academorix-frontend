/**
 * @file use-checklist-tasks.ts
 * @module modules/dashboard/widgets/onboarding-checklist/use-checklist-tasks
 *
 * @description
 * Composes the runtime state of the onboarding checklist widget. Combines
 * three streams into one flat list of {@link ChecklistTaskState}:
 *
 *  1. **Detector state** — for auto-detected tasks with a `detectResource`,
 *     fires a `useList({ pageSize: 1 })` and reads `result.total`. A count
 *     of `≥ 1` marks the task complete. React's rules-of-hooks require the
 *     detector calls to happen in a stable order, so we fire ONE
 *     `useList` per detectable resource declared in `CHECKLIST_TASKS` —
 *     no dynamic list. Resources that don't appear in the config never
 *     fire a query.
 *  2. **Manual-mark state** — read from localStorage via
 *     {@link readChecklistState}. Manual-mark tasks (`billing.setup`,
 *     `branding.customize`, `safeguarding.read`, `profile.complete`)
 *     complete when their id appears in `manuallyCompleted`.
 *  3. **Install detection** — task 11 uses the `beforeinstallprompt` +
 *     `matchMedia("(display-mode: standalone)")` signal captured by
 *     {@link useInstallDetection}.
 *
 * Also exposes the widget's persistence surface: setters that append to
 * `manuallyCompleted` / `hidden` / `dismissed` and write through to
 * localStorage.
 *
 * ## Detection ordering
 *
 * React hooks must run in a stable order. To keep it stable we call
 * `useList` once per `detectResource` value found in the config, in
 * config-order. The mapping from resource → total is stored in a plain
 * object so the loop that composes task states can read it via a lookup.
 */

import { useGetIdentity, useList } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ChecklistStorageState,
  OnboardingChecklistTask,
} from "@/lib/onboarding/onboarding.types";
import type { Identity } from "@/types";

import { CHECKLIST_TASKS } from "@/config/onboarding.config";
import { readChecklistState, writeChecklistState } from "@/lib/onboarding/storage";
import { useInstallDetection } from "@/modules/dashboard/widgets/onboarding-checklist/use-install-detection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Runtime state for a single row on the checklist. */
export interface ChecklistTaskState {
  /** The static task definition from the config. */
  task: OnboardingChecklistTask;
  /** True when the task should render as complete (auto OR manually marked). */
  isCompleted: boolean;
  /**
   * True when the completion answer isn't known yet (row-count probe still
   * loading). We render a skeleton chip in this state — the row still
   * shows the CTA so the user isn't stuck waiting.
   */
  isLoading: boolean;
  /**
   * True when the user hid this row via the per-row X button. Hidden tasks
   * still count towards completion analytics but don't render in the widget.
   */
  isHidden: boolean;
  /**
   * True when the user manually ticked the task via "Mark done", even if
   * the underlying detector says otherwise. Used to render an "Undo" button.
   */
  isManuallyMarked: boolean;
  /** True when the task is manual-mark only (no auto detection). */
  isManualOnly: boolean;
}

/**
 * Aggregate return of {@link useChecklistTasks}. Kept flat so the widget's
 * render function reads like a template.
 */
export interface ChecklistState {
  /** Live task rows in display order — 12 entries, one per config task. */
  tasks: readonly ChecklistTaskState[];
  /**
   * `hidden` rows filtered out, so the widget can iterate them without
   * doing the filter twice. `visibleTasks.length` is the total shown in
   * the header chip.
   */
  visibleTasks: readonly ChecklistTaskState[];
  /** Number of visible tasks currently marked complete. */
  completedCount: number;
  /** Total visible tasks (excludes hidden). */
  totalCount: number;
  /** True when the whole widget has been dismissed. */
  dismissed: boolean;
  /**
   * True when every visible task is complete. Drives auto-hide (the widget
   * unmounts once everything ticks).
   */
  isAllComplete: boolean;
  /** Percentage complete (0-100), rounded. */
  progressPercent: number;
  /** True when at least one auto-detected task is still loading. */
  isLoading: boolean;
  /** True when a `beforeinstallprompt` was captured — controls task 11 CTA. */
  canPromptInstall: boolean;
  /** Fires the captured `beforeinstallprompt` event (task 11 CTA handler). */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** Toggle a task's manual-mark state (adds/removes from `manuallyCompleted`). */
  toggleManualMark: (taskId: string) => void;
  /** Hide a specific task row. */
  hideTask: (taskId: string) => void;
  /** Restore all hidden tasks (used from the drawer's "Show hidden" affordance). */
  unhideAll: () => void;
  /** Dismiss the whole widget permanently. */
  dismissWidget: () => void;
  /** Restore a dismissed widget (developer command). */
  restoreWidget: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The set of distinct resource names to probe. Derived once from the config
 * so we can wire `useList` calls in a stable order without hardcoding.
 * Config-order is deliberately preserved — swap the array to change the
 * probe order.
 */
const DETECTABLE_RESOURCES: readonly string[] = Array.from(
  new Set(
    CHECKLIST_TASKS.filter(
      (task): task is OnboardingChecklistTask & { detectResource: string } =>
        typeof task.detectResource === "string",
    ).map((task) => task.detectResource),
  ),
);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Composes the checklist runtime state for the currently-authenticated user.
 * Reads persisted state per identity so a workspace switch reloads the
 * hidden/dismissed sets without leaking.
 */
export function useChecklistTasks(): ChecklistState {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id ?? null;

  const [storage, setStorage] = useState<ChecklistStorageState>(() => readChecklistState(userId));

  // Rehydrate whenever the identity changes (e.g. cross-tenant workspace
  // switch). The initial `useState` uses the mount-time identity; this
  // effect covers the swap case.
  useEffect(() => {
    setStorage(readChecklistState(userId));
  }, [userId]);

  // Persist + update in-memory state as one atomic write.
  const persist = useCallback(
    (next: ChecklistStorageState) => {
      setStorage(next);
      writeChecklistState(userId, next);
    },
    [userId],
  );

  // ---- Detector probes ---------------------------------------------------
  //
  // We call `useList` for each detectable resource in a stable order. To
  // avoid the rule-of-hooks trap ("hook called conditionally"), the array
  // {@link DETECTABLE_RESOURCES} is constant per-build and the probe count
  // never changes across renders.
  const detectorTotals = useDetectorTotals(DETECTABLE_RESOURCES);

  // ---- Install detection --------------------------------------------------
  const install = useInstallDetection();

  // ---- Compose task rows -------------------------------------------------
  const tasks = useMemo<readonly ChecklistTaskState[]>(() => {
    return CHECKLIST_TASKS.map((task) => {
      const isHidden = storage.hidden.includes(task.id);
      const isManuallyMarked = storage.manuallyCompleted.includes(task.id);

      // Special case: task 11 ("install.app") — completion comes from the
      // OS install detector, not from a row count.
      if (task.id === "install.app") {
        return {
          task,
          isCompleted: install.isInstalled || isManuallyMarked,
          isLoading: false,
          isHidden,
          isManuallyMarked,
          isManualOnly: task.manualMark,
        };
      }

      // Auto-detected tasks: read the total for the declared resource.
      if (task.detectResource) {
        const probe = detectorTotals.get(task.detectResource);

        // Some tasks require count > 1 (e.g. "team.invite" — invited a
        // teammate other than themselves). Configured on the task via
        // an id-based rule below.
        const threshold = task.id === "team.invite" ? 2 : 1;

        return {
          task,
          isCompleted: (probe?.total ?? 0) >= threshold || isManuallyMarked,
          isLoading: probe?.isLoading ?? false,
          isHidden,
          isManuallyMarked,
          isManualOnly: task.manualMark,
        };
      }

      // Manual-only tasks (billing, branding, safeguarding, profile).
      return {
        task,
        isCompleted: isManuallyMarked,
        isLoading: false,
        isHidden,
        isManuallyMarked,
        isManualOnly: true,
      };
    });
  }, [detectorTotals, install.isInstalled, storage.hidden, storage.manuallyCompleted]);

  const visibleTasks = useMemo(() => tasks.filter((row) => !row.isHidden), [tasks]);

  const completedCount = visibleTasks.filter((row) => row.isCompleted).length;
  const totalCount = visibleTasks.length;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);
  const isLoading = tasks.some((row) => row.isLoading);

  // ---- Mutators ----------------------------------------------------------

  const toggleManualMark = useCallback(
    (taskId: string) => {
      const set = new Set(storage.manuallyCompleted);

      if (set.has(taskId)) {
        set.delete(taskId);
      } else {
        set.add(taskId);
      }
      persist({ ...storage, manuallyCompleted: Array.from(set) });
    },
    [persist, storage],
  );

  const hideTask = useCallback(
    (taskId: string) => {
      if (storage.hidden.includes(taskId)) {
        return;
      }
      persist({ ...storage, hidden: [...storage.hidden, taskId] });
    },
    [persist, storage],
  );

  const unhideAll = useCallback(() => {
    if (storage.hidden.length === 0) {
      return;
    }
    persist({ ...storage, hidden: [] });
  }, [persist, storage]);

  const dismissWidget = useCallback(() => {
    persist({ ...storage, dismissed: true });
  }, [persist, storage]);

  const restoreWidget = useCallback(() => {
    persist({ ...storage, dismissed: false });
  }, [persist, storage]);

  return {
    tasks,
    visibleTasks,
    completedCount,
    totalCount,
    dismissed: storage.dismissed,
    isAllComplete,
    progressPercent,
    isLoading,
    canPromptInstall: install.canPrompt,
    promptInstall: install.prompt,
    toggleManualMark,
    hideTask,
    unhideAll,
    dismissWidget,
    restoreWidget,
  };
}

// ---------------------------------------------------------------------------
// Detector probes — one useList per declared resource in stable order
// ---------------------------------------------------------------------------

/**
 * Fires a `useList({ pageSize: 1 })` per resource in {@link resources} and
 * returns a map from resource name to `{ total, isLoading }`. The resource
 * list MUST be stable across renders — see the module docblock for why
 * (rules of hooks).
 *
 * We can't literally loop `useList()` because the number of hooks in a
 * component must be constant. Instead we unroll: this helper is a small
 * component-like function that hardcodes the maximum probe count and
 * reads only the entries the config declared. Since
 * {@link DETECTABLE_RESOURCES} is `const readonly` computed at module load,
 * its length is stable for the lifetime of the process.
 *
 * Concretely, we call {@link useDetectorProbe} one time per resource. The
 * config as of this writing declares 7 detectable resources (users,
 * branches, athletes, sessions, teams, attendance, invoices), which is
 * well below any realistic hook-count concern.
 */
function useDetectorTotals(
  resources: readonly string[],
): Map<string, { total: number; isLoading: boolean }> {
  // The concrete unroll — one call per entry. We rely on
  // {@link DETECTABLE_RESOURCES} being immutable at module scope.
  const probe0 = useDetectorProbe(resources[0]);
  const probe1 = useDetectorProbe(resources[1]);
  const probe2 = useDetectorProbe(resources[2]);
  const probe3 = useDetectorProbe(resources[3]);
  const probe4 = useDetectorProbe(resources[4]);
  const probe5 = useDetectorProbe(resources[5]);
  const probe6 = useDetectorProbe(resources[6]);
  const probe7 = useDetectorProbe(resources[7]);

  // Flat dependencies keep the linter happy (react-hooks/exhaustive-deps
  // complains about complex expressions inside a dep array). Every probe
  // is a `{ total, isLoading }` primitive-carrying record so shallow
  // reference identity is what changes when data refreshes.
  return useMemo(() => {
    const probes = [probe0, probe1, probe2, probe3, probe4, probe5, probe6, probe7] as const;
    const result = new Map<string, { total: number; isLoading: boolean }>();

    resources.forEach((resource, index) => {
      const probe = probes[index];

      if (probe) {
        result.set(resource, probe);
      }
    });

    return result;
  }, [resources, probe0, probe1, probe2, probe3, probe4, probe5, probe6, probe7]);
}

/**
 * Probes a single resource for its row count. Returns `{ total: 0, isLoading: false }`
 * when the resource name is `undefined` — a no-op that keeps the hook
 * call slot stable.
 *
 * Uses Refine's `useList` with `pageSize: 1` so we only pay for the count,
 * not for the rows. `enabled` is `false` when there's no resource so the
 * hook doesn't fire a wasted request.
 */
function useDetectorProbe(resource: string | undefined): { total: number; isLoading: boolean } {
  // Refine's `useList` supports `queryOptions.enabled` so we can guard the
  // network call when the slot is empty. A no-op slot still occupies the
  // hook position — that's what we need for stable ordering.
  const { result, query } = useList({
    resource: resource ?? "__noop__",
    pagination: { currentPage: 1, pageSize: 1 },
    queryOptions: { enabled: Boolean(resource) },
  });

  return {
    total: result?.total ?? 0,
    isLoading: Boolean(resource) && query.isLoading,
  };
}
