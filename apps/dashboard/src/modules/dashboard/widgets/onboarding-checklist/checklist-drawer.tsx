/**
 * @file checklist-drawer.tsx
 * @module modules/dashboard/widgets/onboarding-checklist/checklist-drawer
 *
 * @description
 * The expanded onboarding checklist rendered inside a HeroUI Drawer. Kept
 * separate from the compact widget shell so the drawer can render its own
 * scroll container, per-row affordances, and the "restore hidden" footer
 * without bloating the widget component.
 *
 * The drawer is fully controlled by the parent widget through `isOpen` +
 * `onOpenChange` so the widget owns both the trigger button and the
 * dismissal path. Placement is `"right"` on desktop-width viewports and
 * defaults to `"bottom"` on narrow screens — the HeroUI runtime handles
 * that responsive swap automatically once we pass `placement="right"`.
 */

import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@academorix/ui/icons/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@academorix/ui/icons/solid";
import {
  Button,
  Chip,
  Drawer,
  Label,
  Link,
  ProgressBar,
  Separator,
  Skeleton,
} from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ChecklistState, ChecklistTaskState } from "./use-checklist-tasks";
import type { ReactNode } from "react";

import { useChecklistTranslate } from "@/modules/dashboard/widgets/onboarding-checklist/use-checklist-translate";

/** Props for {@link ChecklistDrawer}. */
interface ChecklistDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  state: ChecklistState;
}

/**
 * Renders the full onboarding checklist in a right-anchored drawer.
 * Reads the composed state from the parent widget so the drawer never
 * fires its own detectors — one source of truth per widget instance.
 */
export function ChecklistDrawer({ isOpen, onOpenChange, state }: ChecklistDrawerProps): ReactNode {
  const t = useChecklistTranslate();

  // Only render visible tasks in the drawer body. Hidden rows are still
  // recoverable via the "Show hidden" footer button which restores all.
  const rows = state.visibleTasks;
  const hiddenCount = state.tasks.filter((row) => row.isHidden).length;

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="w-full max-w-[420px]">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>{t("onboarding.checklist.title", "Get started")}</Drawer.Heading>
            <p className="mt-1 text-xs text-muted">
              {t(
                "onboarding.checklist.description",
                "Complete these steps to launch your academy.",
              )}
            </p>
          </Drawer.Header>

          <Drawer.Body>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">
                    {t("onboarding.checklist.progress", "{{done}} of {{total}}", {
                      done: state.completedCount,
                      total: state.totalCount,
                    })}
                  </Chip.Label>
                </Chip>
                {state.isLoading ? <Skeleton className="h-4 w-16" /> : null}
              </div>

              <ProgressBar
                aria-label={t("onboarding.checklist.title", "Get started")}
                className="w-full"
                color={state.isAllComplete ? "success" : "accent"}
                data-testid="onboarding-checklist-drawer-progress"
                value={state.progressPercent}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>

              <Separator />

              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ChecklistDrawerRow key={row.task.id} row={row} state={state} />
                ))}
              </div>

              {hiddenCount > 0 ? (
                <div className="mt-2 flex items-center justify-center">
                  <Button size="sm" variant="tertiary" onPress={state.unhideAll}>
                    <EyeIcon />
                    <Label>{`Show ${hiddenCount} hidden task${hiddenCount === 1 ? "" : "s"}`}</Label>
                  </Button>
                </div>
              ) : null}
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <Button slot="close" variant="secondary">
              {t("onboarding.checklist.close", "Close")}
            </Button>
            <Button
              variant="tertiary"
              onPress={() => {
                state.dismissWidget();
                onOpenChange(false);
              }}
            >
              {t("onboarding.checklist.dismiss", "Dismiss checklist")}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

/** Props for {@link ChecklistDrawerRow}. */
interface ChecklistDrawerRowProps {
  row: ChecklistTaskState;
  state: ChecklistState;
}

/**
 * A single task row in the drawer. Extracted so the parent map body stays
 * readable — the row's rich affordances (CTA + mark-done + hide) push the
 * inline version past the reasonable-JSX complexity threshold.
 */
function ChecklistDrawerRow({ row, state }: ChecklistDrawerRowProps): ReactNode {
  const t = useChecklistTranslate();
  const navigate = useNavigate();
  const { task, isCompleted, isLoading, isManuallyMarked, isManualOnly } = row;
  const isExternalPath = /^https?:\/\//i.test(task.path);
  const isInstallTask = task.id === "install.app";

  /**
   * "Do it now" click handler. External links open in a new tab; internal
   * paths route via React Router without a full navigation. Task 11
   * ("install.app") calls the captured `beforeinstallprompt` when
   * available — otherwise falls through to the doc link on `task.path`.
   */
  const handleCta = async (): Promise<void> => {
    if (isInstallTask && state.canPromptInstall) {
      await state.promptInstall();

      return;
    }

    if (isExternalPath) {
      window.open(task.path, "_blank", "noopener,noreferrer");

      return;
    }

    navigate(task.path);
  };

  return (
    <div
      className={
        isCompleted
          ? "flex items-start gap-3 rounded-lg border border-border/60 bg-default/20 p-3"
          : "flex items-start gap-3 rounded-lg border border-border p-3"
      }
      data-testid={`onboarding-checklist-row-${task.id}`}
    >
      <span
        aria-hidden="true"
        className={
          isCompleted
            ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
            : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted"
        }
      >
        {isCompleted ? <CheckCircleSolid className="size-4" /> : null}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span
              className={
                isCompleted
                  ? "text-sm font-medium text-muted line-through"
                  : "text-sm font-medium text-foreground"
              }
            >
              {t(task.labelKey)}
            </span>
            <span className="text-xs text-muted">{t(task.descriptionKey)}</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : isCompleted ? (
            <Chip color="success" size="sm" variant="soft">
              <CheckCircleIcon aria-hidden="true" className="size-3.5" />
              <Chip.Label>{t("onboarding.checklist.completeBadge", "Complete")}</Chip.Label>
            </Chip>
          ) : null}
        </div>

        {!isCompleted ? (
          <div className="flex flex-wrap items-center gap-2">
            {isExternalPath ? (
              <Link
                className="inline-flex items-center gap-1 text-sm font-medium text-accent"
                href={task.path}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("onboarding.checklist.doItNow", "Do it now")}
                <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-3" />
              </Link>
            ) : (
              <Button
                data-testid={`onboarding-checklist-row-${task.id}-cta`}
                size="sm"
                variant="tertiary"
                onPress={() => {
                  void handleCta();
                }}
              >
                {t("onboarding.checklist.doItNow", "Do it now")}
              </Button>
            )}

            {isManualOnly ? (
              <Button
                data-testid={`onboarding-checklist-row-${task.id}-mark-done`}
                size="sm"
                variant="ghost"
                onPress={() => state.toggleManualMark(task.id)}
              >
                {t("onboarding.checklist.markDone", "Mark done")}
              </Button>
            ) : null}

            <Button
              aria-label={t("onboarding.checklist.hide", "Hide")}
              data-testid={`onboarding-checklist-row-${task.id}-hide`}
              size="sm"
              variant="ghost"
              onPress={() => state.hideTask(task.id)}
            >
              <XMarkIcon />
            </Button>
          </div>
        ) : isManuallyMarked ? (
          <div>
            <Button size="sm" variant="ghost" onPress={() => state.toggleManualMark(task.id)}>
              <EyeSlashIcon />
              {t("onboarding.checklist.undo", "Undo")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
