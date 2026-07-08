/**
 * @file kanban.tsx
 * @module modules/safeguarding/pages/kanban
 *
 * @description
 * Safeguarding cases kanban view — case lifecycle statuses as columns, one
 * case per card. Recommended by `DASHBOARD_UX_PLAN.md` §5.7 as the *primary*
 * view for the safeguarding module: leads can drag a case through
 * `Open → Monitoring → Escalated → Closed` without touching a status cell.
 *
 * ## Data flow
 *
 *  1. `useList` fetches every case the caller can see, filtered by the active
 *     scope (branch).
 *  2. `useList` on `athletes` resolves subject ids into "First Last" strings.
 *  3. `useList` on `staff` resolves handler ids into display names — same
 *     shape the leads kanban uses for owner resolution.
 *  4. The shared {@link KanbanBoard} groups cases by `case_.status`.
 *  5. On a drop, `useUpdate` PATCHes the moved case with `{ status: <target> }`
 *     in `mutationMode: "optimistic"` — a rollback toast fires if the backend
 *     rejects the change.
 *
 * ## Filters
 *
 *  - Severity: any of {@link SAFEGUARDING_SEVERITIES}.
 *  - Branch: any branch the caller can see. Filters client-side; the fetch
 *    itself still respects `meta.scopedBy = ["branch"]` if the resource opts
 *    in.
 *  - Reporter: today this maps to `handler_id` because the backend fixture
 *    does not currently expose a distinct `reported_by_id` column — see the
 *    `TODO(safeguarding-reporter)` marker below for the follow-up.
 *
 * ## Feature gate
 *
 * When `features.kanbanViews` is off the module manifest never mounts this
 * page. A defensive redirect is registered in
 * `safeguarding.module.tsx` in that case so pasted URLs land on the list.
 */

import { PlusIcon, TableCellsIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  Spinner,
  toast,
  Tooltip,
} from "@academorix/ui/react";
import { useList, useUpdate } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import type { KanbanColumn } from "@/components/kanban";
import type {
  SafeguardingCase,
  SafeguardingSeverity,
  SafeguardingStatus,
} from "@/modules/safeguarding/safeguarding.types";
import type { Athlete, Branch, Staff } from "@/types";
import type { Key, ReactNode } from "react";

import { KanbanBoard } from "@/components/kanban";
import { ListView } from "@/components/refine";
import { buildScopeFilters, useScope } from "@/lib/scope";
import { SafeguardingKanbanCardBody } from "@/modules/safeguarding/components/safeguarding-kanban-card";
import {
  SAFEGUARDING_SEVERITIES,
  SAFEGUARDING_SEVERITY_LABELS,
  SAFEGUARDING_STATUS_LABELS,
  SAFEGUARDING_STATUSES,
} from "@/modules/safeguarding/safeguarding.types";

/**
 * The chip color used per lifecycle status — mirrors the status chip on the
 * list page so the kanban and list share a visual vocabulary.
 */
const STATUS_COLUMN_COLOR: Record<
  SafeguardingStatus,
  "success" | "warning" | "danger" | "default"
> = {
  open: "warning",
  monitoring: "default",
  escalated: "danger",
  closed: "success",
};

/** Sentinel value for the "no filter" option on every dropdown. */
const ALL_OPTION = "__all__";

/** Filter state — `null` slots represent "no filter applied on that axis". */
interface KanbanFilters {
  severity: SafeguardingSeverity | null;
  branchId: string | null;
  reporterId: string | null;
}

/** Column definitions, memoised outside the component. */
function buildColumns(): KanbanColumn<SafeguardingStatus>[] {
  return SAFEGUARDING_STATUSES.map((status) => ({
    id: status,
    label: SAFEGUARDING_STATUS_LABELS[status],
    color: STATUS_COLUMN_COLOR[status],
  }));
}

/** The safeguarding kanban page. */
export default function SafeguardingKanban(): ReactNode {
  const { scope } = useScope();

  const scopeFilters = useMemo(() => buildScopeFilters(scope, ["branch"]), [scope]);
  const { result: casesResult, query: casesQuery } = useList<SafeguardingCase>({
    resource: "safeguarding",
    filters: scopeFilters,
    pagination: { mode: "off" },
  });
  // Memoise fallback arrays so downstream `useMemo`s don't re-run just
  // because Refine returned a new wrapper object with the same rows.
  const cases = useMemo<SafeguardingCase[]>(() => casesResult?.data ?? [], [casesResult?.data]);

  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = useMemo<Athlete[]>(() => athletesResult?.data ?? [], [athletesResult?.data]);

  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const staff = useMemo<Staff[]>(() => staffResult?.data ?? [], [staffResult?.data]);

  const { result: branchesResult } = useList<Branch>({
    resource: "branches",
    pagination: { mode: "off" },
  });
  const branches = useMemo<Branch[]>(() => branchesResult?.data ?? [], [branchesResult?.data]);

  // Resolvers — small maps keyed by id so the card body doesn't ship one
  // useMemo per lookup.
  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletes) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletes]);

  const staffById = useMemo(() => {
    const map = new Map<string, Staff>();

    for (const member of staff) {
      map.set(member.id, member);
    }

    return map;
  }, [staff]);

  const [filters, setFilters] = useState<KanbanFilters>({
    severity: null,
    branchId: null,
    reporterId: null,
  });

  // Build option lists for the branch + reporter dropdowns from the resolved
  // resources so operators only see selectable ids.
  const sortedBranches = useMemo(
    () => branches.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );
  const sortedStaff = useMemo(
    () =>
      staff
        .slice()
        .sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
        ),
    [staff],
  );

  const filteredCases = useMemo(() => {
    return cases.filter((record) => {
      if (filters.severity && record.severity !== filters.severity) return false;
      if (filters.branchId && record.branch_id !== filters.branchId) return false;

      // TODO(safeguarding-reporter): once the backend surfaces a distinct
      // `reported_by_id` column, switch this to filter on that. For now the
      // dropdown filters on `handler_id` — the field the current DTO exposes.
      if (filters.reporterId && record.handler_id !== filters.reporterId) return false;

      return true;
    });
  }, [cases, filters]);

  const { mutate: update } = useUpdate();

  const handleMove = (
    cardId: string,
    fromStatus: SafeguardingStatus,
    toStatus: SafeguardingStatus,
  ): void => {
    if (fromStatus === toStatus) {
      // Intra-column drops are no-ops until the board grows ordering support.
      return;
    }

    update(
      {
        resource: "safeguarding",
        id: cardId,
        values: { status: toStatus },
        mutationMode: "optimistic",
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          toast.success("Case status updated", {
            description: `Moved to ${SAFEGUARDING_STATUS_LABELS[toStatus]}.`,
          });
        },
        onError: () => {
          // Refine's optimistic mode rolls the cached record back on error;
          // we narrate the reversion so the operator knows to retry.
          toast.danger("Could not update case", {
            description: `Reverted from ${SAFEGUARDING_STATUS_LABELS[toStatus]} back to ${SAFEGUARDING_STATUS_LABELS[fromStatus]}.`,
          });
        },
      },
    );
  };

  const columns = useMemo(() => buildColumns(), []);
  const activeFilterCount =
    (filters.severity ? 1 : 0) + (filters.branchId ? 1 : 0) + (filters.reporterId ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;
  const clearAll = (): void => setFilters({ severity: null, branchId: null, reporterId: null });

  return (
    <ListView
      headerActions={
        <Tooltip>
          <Button size="sm" variant="secondary">
            <Link className="flex items-center gap-1.5" to="/safeguarding">
              <TableCellsIcon aria-hidden="true" className="size-4" />
              List view
            </Link>
          </Button>
          <Tooltip.Content>Switch to the table view</Tooltip.Content>
        </Tooltip>
      }
      resource="safeguarding"
    >
      <div className="flex flex-col gap-4">
        {/* Filter row — severity / branch / reporter. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <Select
            className="min-w-[160px]"
            placeholder="Severity"
            value={filters.severity ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                severity:
                  key === null || key === ALL_OPTION ? null : (String(key) as SafeguardingSeverity),
              }))
            }
          >
            <Label className="sr-only">Filter by severity</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="Any severity">
                  Any severity
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {SAFEGUARDING_SEVERITIES.map((severity) => (
                  <ListBox.Item
                    key={severity}
                    id={severity}
                    textValue={SAFEGUARDING_SEVERITY_LABELS[severity]}
                  >
                    {SAFEGUARDING_SEVERITY_LABELS[severity]}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="min-w-[180px]"
            placeholder="Branch"
            value={filters.branchId ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                branchId: key === null || key === ALL_OPTION ? null : String(key),
              }))
            }
          >
            <Label className="sr-only">Filter by branch</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="All branches">
                  All branches
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {sortedBranches.map((branch) => (
                  <ListBox.Item key={branch.id} id={branch.id} textValue={branch.name}>
                    {branch.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="min-w-[200px]"
            placeholder="Reporter"
            value={filters.reporterId ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                reporterId: key === null || key === ALL_OPTION ? null : String(key),
              }))
            }
          >
            <Label className="sr-only">Filter by reporter</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="Any reporter">
                  Any reporter
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {sortedStaff.map((member) => (
                  <ListBox.Item
                    key={member.id}
                    id={member.id}
                    textValue={`${member.first_name} ${member.last_name}`}
                  >
                    {member.first_name} {member.last_name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {hasActiveFilters ? (
            <>
              <Chip size="sm" variant="secondary">
                <Chip.Label className="tabular-nums">
                  {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                </Chip.Label>
              </Chip>
              <Button size="sm" variant="ghost" onPress={clearAll}>
                Clear all
              </Button>
            </>
          ) : null}
        </div>

        {casesQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading cases" />
          </div>
        ) : (
          <KanbanBoard<SafeguardingCase, SafeguardingStatus>
            ariaLabel="Safeguarding pipeline"
            cards={filteredCases}
            columns={columns}
            groupBy={(record) => record.status}
            renderCard={(record) => {
              const subject = record.athlete_id
                ? (athleteName.get(record.athlete_id) ?? record.athlete_id)
                : "General concern";
              const handler = record.handler_id ? staffById.get(record.handler_id) : null;
              const handlerName = handler ? `${handler.first_name} ${handler.last_name}` : null;

              return (
                <SafeguardingKanbanCardBody
                  case_={record}
                  handlerName={handlerName}
                  subject={subject}
                />
              );
            }}
            renderColumnEmptyState={(column) => (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-muted">No {column.label.toLowerCase()} cases.</p>
                <Button size="sm" variant="ghost">
                  <Link
                    className="flex items-center gap-1"
                    to={`/safeguarding/create?status=${column.id}`}
                  >
                    <PlusIcon aria-hidden="true" className="size-3.5" />
                    New case
                  </Link>
                </Button>
              </div>
            )}
            onMove={handleMove}
          />
        )}
      </div>
    </ListView>
  );
}
