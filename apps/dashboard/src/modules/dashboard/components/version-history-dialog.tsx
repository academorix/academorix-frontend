/**
 * @file version-history-dialog.tsx
 * @module modules/dashboard/components/version-history-dialog
 *
 * @description
 * Modal that surfaces the persisted version log for a dashboard
 * and lets the owner restore an older snapshot. Backed by the
 * storage adapter's `listVersions` / `restoreVersion` methods
 * (implemented in `storage.ts`), plumbed through the
 * {@link useDashboards} hook so the dashboard list refreshes as
 * soon as a restore lands.
 *
 * ## Layout
 *
 *   * **Header** — "Version history · {dashboard.name}", a small
 *     count chip, and the standard Modal close trigger.
 *   * **Body** — two-column split on desktop (`sm:grid-cols-[minmax(0,20rem)_1fr]`),
 *     stacked on mobile. The left column is a scrollable list of
 *     every snapshot; the right column is a preview pane for the
 *     selection.
 *   * **Footer** — plain "Done" button that dismisses the modal.
 *     Restore lives inside the preview pane so the two-column
 *     mental model stays intact.
 *
 * ## Restore contract
 *
 * Restoring goes through the storage adapter's `restoreVersion`
 * method, which itself wraps `update()` — so the dashboard's
 * `version` counter still bumps monotonically and a concurrent
 * editor in another tab still hits an optimistic-lock error.
 * The pre-restore state is captured as a fresh snapshot before
 * the write lands, so nothing the user does in the editor can
 * silently drop a checkpoint from the log.
 *
 * Built-in dashboards (Overview / Analytics) can view the log but
 * never restore — the storage adapter's `update` method refuses
 * writes on the two built-in ids. The Restore button is disabled
 * with a Tooltip explaining the guardrail so the user isn't
 * left guessing.
 */

import { Button, Chip, Modal, Spinner, toast, Tooltip } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Dashboard,
  DashboardVersionSnapshot,
  UseDashboardsResult,
  WidgetInstance,
} from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/**
 * Human-readable colour label for the preview pane's colour chip.
 * Mirrors the palette in `customize-panel.tsx` so the two surfaces
 * agree on labelling without importing each other's constants.
 */
const COLOR_LABEL: Record<string, string> = {
  accent: "Accent",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
  neutral: "Neutral",
};

/**
 * Convert an ISO-8601 timestamp into a friendly relative-time
 * string. Falls back to a locale-aware absolute date when the
 * delta exceeds a week — the intent is to keep the list scannable
 * without turning the timestamp into a wall of "45,231 seconds
 * ago" noise.
 */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return iso;
  }

  const now = Date.now();
  const deltaMs = now - then;

  if (deltaMs < 0) {
    // Clock skew or a future timestamp — fall back to the raw date
    // rather than producing "-3 minutes ago" nonsense.
    return new Date(iso).toLocaleString();
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (deltaMs < minute) {
    return "just now";
  }

  if (deltaMs < hour) {
    const value = Math.floor(deltaMs / minute);

    return `${value} minute${value === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < day) {
    const value = Math.floor(deltaMs / hour);

    return `${value} hour${value === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < 2 * day) {
    return "yesterday";
  }

  if (deltaMs < week) {
    const value = Math.floor(deltaMs / day);

    return `${value} days ago`;
  }

  return new Date(iso).toLocaleDateString();
}

/**
 * Group a snapshot's widget instances by cohort so the preview
 * pane can render a small per-cohort summary. Widgets whose
 * catalogue entry is missing (unknown key) fall into a synthetic
 * "Other" bucket so the count still reconciles with the total.
 */
function groupWidgetsByCohort(
  widgets: readonly WidgetInstance[],
): { cohort: string; label: string; widgets: WidgetInstance[] }[] {
  const buckets = new Map<string, { label: string; widgets: WidgetInstance[] }>();

  for (const widget of widgets) {
    const entry = findWidget(widget.widgetType);
    const cohortKey = entry?.cohort ?? "other";
    // The catalogue labels are Title Case (`Numbers`, `Charts`, …)
    // and the cohort enum is lowercase — we synthesise a matching
    // label for the fallback bucket so the UI reads consistently.
    const cohortLabel = entry?.cohort
      ? entry.cohort.charAt(0).toUpperCase() + entry.cohort.slice(1)
      : "Other";
    const existing = buckets.get(cohortKey);

    if (existing) {
      existing.widgets.push(widget);
    } else {
      buckets.set(cohortKey, { label: cohortLabel, widgets: [widget] });
    }
  }

  return Array.from(buckets.entries()).map(([cohort, value]) => ({
    cohort,
    label: value.label,
    widgets: value.widgets,
  }));
}

export interface VersionHistoryDialogProps {
  /** Dashboard whose history the modal renders. Null → the modal collapses. */
  dashboard: Dashboard | null;
  /** Hook handle — used to invoke `listVersions` and `restoreVersion`. */
  registry: UseDashboardsResult;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDialog({
  dashboard,
  registry,
  isOpen,
  onOpenChange,
}: VersionHistoryDialogProps): ReactNode {
  const [snapshots, setSnapshots] = useState<readonly DashboardVersionSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isRestoring, setRestoring] = useState(false);

  /**
   * Refresh the version log. Kept in a callback so the restore path
   * can await it directly rather than duplicating the read logic.
   */
  const reload = useCallback(async (): Promise<void> => {
    if (!dashboard) {
      setSnapshots([]);
      setSelectedId(null);

      return;
    }

    setLoading(true);
    try {
      const list = await registry.listVersions(dashboard.id);

      setSnapshots(list);
      // Auto-select the most-recent snapshot so the preview pane
      // isn't blank. The list is already newest-first at the
      // adapter layer.
      setSelectedId((current) => {
        if (current && list.some((entry) => entry.id === current)) {
          return current;
        }

        return list[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [dashboard, registry]);

  useEffect(() => {
    if (isOpen) {
      void reload();
    } else {
      // Reset the transient selection when the dialog closes so a
      // reopen starts on the newest snapshot even if the user had
      // scrolled deep into the log last session.
      setSelectedId(null);
    }
  }, [isOpen, reload]);

  const selected = useMemo(
    () => snapshots.find((entry) => entry.id === selectedId) ?? null,
    [snapshots, selectedId],
  );

  /**
   * Fire the restore mutation, refresh the log, and toast the
   * outcome. Uses a native confirm so we don't need an extra modal
   * to guard a destructive action that's already gated by the
   * dashboard's owner permissions.
   */
  const handleRestore = useCallback(async (): Promise<void> => {
    if (!dashboard || !selected) return;

    // Confirm to catch accidental clicks — restoring rewrites the
    // live dashboard, and while the pre-restore state is captured
    // as a fresh snapshot, users still want a moment to double
    // check before the write lands.
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `Restore v${selected.version}? This creates a new version capturing the current state, then applies the snapshot.`,
          );

    if (!confirmed) return;

    setRestoring(true);
    try {
      await registry.restoreVersion(dashboard.id, selected.id);
      toast.success(`Restored to v${selected.version}`, {
        description: `${dashboard.name} is now at v${selected.version}.`,
      });

      // Refresh the log so the pre-restore snapshot (freshly
      // captured by the adapter) appears at the top, then bounce
      // the selection to the newest entry — the "current" row.
      await reload();
      setSelectedId((current) => {
        // `reload()` already synced selectedId to the newest
        // entry if the previous selection is gone, so we only
        // override when the selection somehow survived (e.g. a
        // fluke id collision — impossible in practice, cheap to
        // guard).
        return current;
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not restore.";

      toast.danger("Restore failed", { description: message });
    } finally {
      setRestoring(false);
    }
  }, [dashboard, selected, reload, registry]);

  if (!dashboard) {
    return null;
  }

  const canRestore = !dashboard.isBuiltIn;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        {/* Wider than the share dialog (`sm:max-w-lg`) so the two-column
            preview layout has room to breathe on desktop. */}
        <Modal.Dialog className="sm:max-w-3xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Iconify className="size-4" icon="clock" />
            </Modal.Icon>
            <Modal.Heading>Version history · {dashboard.name}</Modal.Heading>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              Every save writes a version. Open any past checkpoint to inspect its shape, then
              restore it if you need to roll back — the current state is snapshotted first, so
              nothing is lost.
            </p>
          </Modal.Header>
          <Modal.Body>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16">
                <Spinner color="accent" size="md" />
                <span className="text-sm text-muted">Loading history…</span>
              </div>
            ) : snapshots.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,20rem)_1fr]">
                <SnapshotList
                  currentVersion={dashboard.version}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                  snapshots={snapshots}
                />
                <SnapshotPreview
                  canRestore={canRestore}
                  isRestoring={isRestoring}
                  onCancel={() => onOpenChange(false)}
                  onRestore={handleRestore}
                  snapshot={selected}
                />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="w-full"
              onPress={() => onOpenChange(false)}
              size="sm"
              variant="primary"
            >
              Done
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/**
 * Empty state — surfaced when the storage adapter reports no
 * snapshots yet. Copy nudges the user toward making an edit rather
 * than treating the missing log as a bug.
 */
function EmptyState(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <Iconify className="size-8 text-muted" icon="clock" />
      <div>
        <p className="text-sm font-medium text-foreground">No history yet.</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted">
          Every save creates a version — come back after your first edit.
        </p>
      </div>
    </div>
  );
}

/**
 * Left-column snapshot list. Renders one row per checkpoint with a
 * version chip + summary + relative time. The row whose `version`
 * matches the live dashboard's `version` gets a "Current" chip so
 * the user can locate the head at a glance.
 */
function SnapshotList({
  currentVersion,
  onSelect,
  selectedId,
  snapshots,
}: {
  currentVersion: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  snapshots: readonly DashboardVersionSnapshot[];
}): ReactNode {
  return (
    <ul
      aria-label="Version history entries"
      className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-lg border border-border"
    >
      {snapshots.map((snapshot) => {
        const active = snapshot.id === selectedId;
        // "Current" tag identifies the snapshot whose version
        // matches the live dashboard — one row at most. When a
        // restore lands, a fresh snapshot capturing the previous
        // state jumps to the top and this tag moves with it.
        const isCurrent = snapshot.version === currentVersion;

        return (
          <li key={snapshot.id}>
            <button
              aria-current={active ? "true" : undefined}
              aria-label={`Version ${snapshot.version}`}
              className={[
                "flex w-full flex-col gap-1 px-3 py-2.5 text-start transition-colors",
                active ? "bg-accent/10" : "hover:bg-surface-secondary/60",
              ].join(" ")}
              onClick={() => onSelect(snapshot.id)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <Chip
                  color={active ? "accent" : "default"}
                  size="sm"
                  variant={active ? "primary" : "soft"}
                >
                  <Chip.Label>v{snapshot.version}</Chip.Label>
                </Chip>
                {isCurrent ? (
                  <Chip size="sm" variant="soft">
                    <Chip.Label>Current</Chip.Label>
                  </Chip>
                ) : null}
                <span className="ms-auto text-xs text-muted">
                  {relativeTime(snapshot.changedAt)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-foreground">
                {snapshot.summary ?? "Snapshot captured before an edit."}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Right-column preview pane. Shows the snapshot's identity fields
 * (name / icon / colour / share level), a widget count, and a
 * per-cohort breakdown of the widget set. Restore lives here so
 * the two-column layout feels self-contained.
 */
function SnapshotPreview({
  canRestore,
  isRestoring,
  onCancel,
  onRestore,
  snapshot,
}: {
  canRestore: boolean;
  isRestoring: boolean;
  onCancel: () => void;
  onRestore: () => void;
  snapshot: DashboardVersionSnapshot | null;
}): ReactNode {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        Pick a version on the left to preview it here.
      </div>
    );
  }

  const inner = snapshot.snapshot;
  const cohortGroups = groupWidgetsByCohort(inner.widgets);
  const colorLabel = inner.color ? (COLOR_LABEL[inner.color] ?? inner.color) : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted"
        >
          <Iconify className="size-5" icon={inner.icon ?? "sliders"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{inner.name}</p>
          <p className="text-xs text-muted">
            v{snapshot.version} · captured {relativeTime(snapshot.changedAt)}
          </p>
        </div>
        <Chip size="sm" variant="soft">
          <Chip.Label>
            {inner.widgets.length} widget{inner.widgets.length === 1 ? "" : "s"}
          </Chip.Label>
        </Chip>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip size="sm" variant="soft">
          <Chip.Label>
            Share ·{" "}
            {inner.shareLevel === "role-restricted"
              ? "Restricted"
              : inner.shareLevel === "shared"
                ? "Shared"
                : "Private"}
          </Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft">
          <Chip.Label>Layout · {inner.layoutMode === "grid" ? "Grid" : "Flow"}</Chip.Label>
        </Chip>
        {colorLabel ? (
          <Chip size="sm" variant="soft">
            <Chip.Label>Colour · {colorLabel}</Chip.Label>
          </Chip>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-foreground uppercase">
          Widgets in this version
        </p>
        {cohortGroups.length === 0 ? (
          <p className="text-xs text-muted">This snapshot has no widgets.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cohortGroups.map((group) => (
              <li key={group.cohort} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{group.label}</span>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{group.widgets.length}</Chip.Label>
                  </Chip>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {group.widgets.map((widget) => {
                    const entry = findWidget(widget.widgetType);
                    const label = widget.title ?? entry?.title ?? widget.widgetType;

                    return (
                      <li key={widget.id}>
                        <Chip size="sm" variant="soft">
                          <Chip.Label>
                            <span className="flex items-center gap-1.5">
                              <Iconify
                                aria-hidden
                                className="size-3 opacity-70"
                                icon={entry?.icon ?? "square"}
                              />
                              <span>{label}</span>
                            </span>
                          </Chip.Label>
                        </Chip>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button isDisabled={isRestoring} onPress={onCancel} size="sm" variant="ghost">
          Cancel
        </Button>
        <div className="flex-1" />
        {canRestore ? (
          <Button
            isDisabled={isRestoring}
            isPending={isRestoring}
            onPress={onRestore}
            size="sm"
            variant="primary"
          >
            <Iconify className="size-4" icon="arrow-uturn-cw-left" />
            Restore this version
          </Button>
        ) : (
          <Tooltip>
            {/* Disabled buttons don't fire pointer events, so the
                Tooltip wraps the button and renders on hover of the
                still-focusable trigger — matches the pattern used
                for the shell's Share affordance. */}
            <Button isDisabled onPress={onRestore} size="sm" variant="primary">
              <Iconify className="size-4" icon="arrow-uturn-cw-left" />
              Restore this version
            </Button>
            <Tooltip.Content>
              Built-in dashboards can&apos;t be restored — duplicate first.
            </Tooltip.Content>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
