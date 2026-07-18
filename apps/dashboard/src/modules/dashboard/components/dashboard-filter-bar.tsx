/**
 * @file dashboard-filter-bar.tsx
 * @module modules/dashboard/components/dashboard-filter-bar
 *
 * @description
 * Compact chip bar rendered under the dashboard tabs. Surfaces the
 * dashboard-wide filters (date range, scope) so users can see what's
 * currently constraining the widgets without opening the customise
 * panel. Chips are removable when the dashboard is editable.
 *
 * Design intent:
 *
 *   * **Read-only when idle** — chips display the active filters; no
 *     interaction beyond viewing. When the customise panel is open,
 *     each chip grows a small `×` to clear its filter.
 *   * **Preset date ranges** — three quick-pick chips (Today, 7 days,
 *     30 days) so common ranges are one click away. Clicking a preset
 *     writes both `dateFrom` and `dateTo` in a single patch.
 *   * **Hidden when empty and not editing** — the bar collapses to
 *     nothing when there's no filter to show AND the user isn't in
 *     edit mode. Keeps the dashboard chrome clean.
 */

import { Button, Chip, CloseButton, Tooltip } from "@heroui/react";
import { useMemo } from "react";

import type { DashboardFilters, UseDashboardEditor } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

interface Preset {
  id: string;
  label: string;
  compute: () => { dateFrom: string; dateTo: string };
}

/**
 * Format a `YYYY-MM-DD` slice from a Date. We only care about the
 * calendar day; the backend expands to inclusive-day ranges.
 */
function toDayString(date: Date): string {
  const iso = date.toISOString();

  return iso.slice(0, 10);
}

/** Compute the last `n` days ending today. */
function daysAgo(n: number): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const past = new Date();

  past.setDate(today.getDate() - n);

  return { dateFrom: toDayString(past), dateTo: toDayString(today) };
}

const PRESETS: readonly Preset[] = [
  { id: "today", label: "Today", compute: () => daysAgo(0) },
  { id: "7d", label: "Last 7 days", compute: () => daysAgo(6) },
  { id: "30d", label: "Last 30 days", compute: () => daysAgo(29) },
  { id: "90d", label: "Last 90 days", compute: () => daysAgo(89) },
];

/** Human-facing summary of an active range. */
function rangeSummary(filters: DashboardFilters | undefined): string | null {
  if (!filters?.dateFrom && !filters?.dateTo) return null;

  const from = filters.dateFrom ?? "…";
  const to = filters.dateTo ?? "now";

  return `${from} → ${to}`;
}

export interface DashboardFilterBarProps {
  editor: UseDashboardEditor;
  /** Whether removal / preset-selection is allowed. */
  isEditable: boolean;
}

export function DashboardFilterBar({ editor, isEditable }: DashboardFilterBarProps): ReactNode {
  const filters = editor.draft.filters;
  const rangeLabel = useMemo(() => rangeSummary(filters), [filters]);
  const branchId = filters?.scope?.branchId;
  const seasonId = filters?.scope?.seasonId;

  const hasAnyFilter = Boolean(rangeLabel || branchId || seasonId);

  if (!hasAnyFilter && !isEditable) {
    return null;
  }

  const applyPreset = (preset: Preset): void => {
    const range = preset.compute();

    editor.setFilters({ ...(filters ?? {}), ...range });
  };

  const clearRange = (): void => {
    editor.setFilters({ ...(filters ?? {}), dateFrom: undefined, dateTo: undefined });
  };

  const clearBranch = (): void => {
    editor.setFilters({
      ...(filters ?? {}),
      scope: { ...(filters?.scope ?? {}), branchId: undefined },
    });
  };

  const clearSeason = (): void => {
    editor.setFilters({
      ...(filters ?? {}),
      scope: { ...(filters?.scope ?? {}), seasonId: undefined },
    });
  };

  return (
    <div
      aria-label="Dashboard filters"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface-secondary/30 p-2"
      role="region"
    >
      <Iconify aria-hidden className="ms-1 size-3.5 text-muted" icon="funnel" />
      <span className="text-xs font-medium text-muted">Filters</span>

      {rangeLabel ? (
        <Chip color="accent" size="sm" variant="soft">
          <Chip.Label>{rangeLabel}</Chip.Label>
          {isEditable ? (
            <CloseButton aria-label="Clear date range" className="ms-1" onPress={clearRange} />
          ) : null}
        </Chip>
      ) : null}

      {branchId ? (
        <Chip size="sm" variant="soft">
          <Chip.Label>Branch · {branchId}</Chip.Label>
          {isEditable ? (
            <CloseButton aria-label="Clear branch scope" className="ms-1" onPress={clearBranch} />
          ) : null}
        </Chip>
      ) : null}

      {seasonId ? (
        <Chip size="sm" variant="soft">
          <Chip.Label>Season · {seasonId}</Chip.Label>
          {isEditable ? (
            <CloseButton aria-label="Clear season scope" className="ms-1" onPress={clearSeason} />
          ) : null}
        </Chip>
      ) : null}

      {isEditable ? (
        <div className="ms-auto flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted">Quick range:</span>
          {PRESETS.map((preset) => (
            <Tooltip key={preset.id}>
              <Button onPress={() => applyPreset(preset)} size="sm" variant="ghost">
                {preset.label}
              </Button>
              <Tooltip.Content>{preset.label}</Tooltip.Content>
            </Tooltip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
