/**
 * @file index.tsx
 * @module modules/dashboard/widgets/onboarding-checklist
 *
 * @description
 * The compact onboarding checklist widget — a card that lives in the
 * top-right of the dashboard overview when the workspace is not yet fully
 * set up. Expands into a right-anchored drawer showing all 12 tasks (see
 * onboarding module).
 *
 * Structure:
 *
 *  - The compact card shows:
 *    * `Get started` heading + description
 *    * `<done>/<total>` chip + progress bar
 *    * The first two incomplete tasks as inline links (jump-off affordance)
 *    * "View all" button that opens the drawer
 *    * Kebab-style dismiss action that hides the widget permanently
 *  - The drawer (see `./checklist-drawer.tsx`) shows every task, with
 *    "Do it now", "Mark done" (manual), and per-row hide affordances.
 *
 * Auto-hides when:
 *  - The user dismissed the widget (`state.dismissed === true`).
 *  - All visible tasks are complete (`state.isAllComplete`) AND the "all
 *    done" celebration state has been shown for one render — after that
 *    the widget hides itself so it doesn't linger.
 *
 * ## Detection strategy
 *
 * See {@link "./use-checklist-tasks".useChecklistTasks} for the auto/manual
 * detection contract. This component is pure presentation on top of that
 * hook.
 *
 * @see onboarding module — Onboarding checklist.
 */

import { CheckCircleIcon, EyeSlashIcon, XMarkIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Chip, Link, ProgressBar, Widget } from "@stackra/ui/react";
import { useState } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { features } from "@/config/features.config";
import { ChecklistDrawer } from "@/modules/dashboard/widgets/onboarding-checklist/checklist-drawer";
import { useChecklistTasks } from "@/modules/dashboard/widgets/onboarding-checklist/use-checklist-tasks";
import { useChecklistTranslate } from "@/modules/dashboard/widgets/onboarding-checklist/use-checklist-translate";

/**
 * The compact, top-right onboarding widget. Renders `null` when the widget
 * has been dismissed, the checklist feature is off, or the workspace has
 * completed every task.
 */
export default function OnboardingChecklistWidget(): ReactNode {
  const state = useChecklistTasks();
  const t = useChecklistTranslate();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Global kill switch — ops can flip this off in an incident. Also
  // covers the "user has finished onboarding" case: `isAllComplete`
  // returns `true` when every visible task is complete, so the widget
  // auto-hides without a manual dismiss.
  if (!features.onboardingChecklist) {
    return null;
  }

  if (state.dismissed || state.isAllComplete) {
    return null;
  }

  // Pick the first two visible-incomplete tasks to surface as inline
  // links on the compact card. Two is chosen deliberately — one feels
  // sparse, three overflows the card. Users can open the drawer for the
  // full list.
  const previewRows = state.visibleTasks.filter((row) => !row.isCompleted).slice(0, 2);

  return (
    <>
      <Widget className="w-full max-w-md" data-testid="onboarding-checklist-widget">
        <Widget.Header>
          <div className="flex min-w-0 flex-col gap-1">
            <Widget.Title>{t("onboarding.checklist.title", "Get started")}</Widget.Title>
            <Widget.Description>
              {t(
                "onboarding.checklist.description",
                "Complete these steps to launch your academy.",
              )}
            </Widget.Description>
          </div>
          <div className="flex items-center gap-2">
            <Chip data-testid="onboarding-checklist-progress-chip" size="sm" variant="soft">
              <Chip.Label className="tabular-nums">
                {t("onboarding.checklist.progress", "{{done}} of {{total}}", {
                  done: state.completedCount,
                  total: state.totalCount,
                })}
              </Chip.Label>
            </Chip>
            <Button
              isIconOnly
              aria-label={t("onboarding.checklist.dismiss", "Dismiss checklist")}
              data-testid="onboarding-checklist-dismiss"
              size="sm"
              variant="ghost"
              onPress={state.dismissWidget}
            >
              <EyeSlashIcon />
            </Button>
          </div>
        </Widget.Header>

        <Widget.Content className="flex flex-col gap-4">
          <ProgressBar
            aria-label={t("onboarding.checklist.title", "Get started")}
            className="w-full"
            color={state.isAllComplete ? "success" : "accent"}
            data-testid="onboarding-checklist-progress"
            value={state.progressPercent}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>

          {/* Two-row preview so the compact card is actionable without
              opening the drawer. Users routinely finish onboarding by
              tapping the top item and never touching the "View all"
              button, so surfacing the next-up actions matters. */}
          {previewRows.length > 0 ? (
            <ul className="flex flex-col gap-1.5" data-testid="onboarding-checklist-preview">
              {previewRows.map((row) => {
                const isExternal = /^https?:\/\//i.test(row.task.path);
                const label = t(row.task.labelKey);

                return (
                  <li key={row.task.id} className="flex items-center justify-between gap-2">
                    {isExternal ? (
                      <Link
                        className="truncate text-sm text-foreground hover:text-accent"
                        href={row.task.path}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {label}
                      </Link>
                    ) : (
                      <button
                        className="truncate text-left text-sm text-foreground hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        data-testid={`onboarding-checklist-preview-${row.task.id}`}
                        type="button"
                        onClick={() => navigate(row.task.path)}
                      >
                        {label}
                      </button>
                    )}
                    <button
                      aria-label={t("onboarding.checklist.hide", "Hide")}
                      className="rounded-md p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                      data-testid={`onboarding-checklist-preview-${row.task.id}-hide`}
                      type="button"
                      onClick={() => state.hideTask(row.task.id)}
                    >
                      <XMarkIcon className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted">
              <CheckCircleIcon aria-hidden="true" className="size-4 text-success" />
              <span>
                {t(
                  "onboarding.checklist.allDoneDescription",
                  "You've finished the onboarding tasks. Well done!",
                )}
              </span>
            </div>
          )}
        </Widget.Content>

        <Widget.Footer className="justify-end">
          <Button
            data-testid="onboarding-checklist-expand"
            size="sm"
            variant="tertiary"
            onPress={() => setIsDrawerOpen(true)}
          >
            {t("onboarding.checklist.expand", "View all tasks")}
          </Button>
        </Widget.Footer>
      </Widget>

      <ChecklistDrawer isOpen={isDrawerOpen} state={state} onOpenChange={setIsDrawerOpen} />
    </>
  );
}

// Re-export the state hook so tests + related surfaces (Help menu, PWA
// welcome toast) can query onboarding progress without importing the
// widget itself.
export { useChecklistTasks } from "@/modules/dashboard/widgets/onboarding-checklist/use-checklist-tasks";
export { useInstallDetection } from "@/modules/dashboard/widgets/onboarding-checklist/use-install-detection";
