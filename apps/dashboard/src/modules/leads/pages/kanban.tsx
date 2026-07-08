/**
 * @file kanban.tsx
 * @module modules/leads/pages/kanban
 *
 * @description
 * Leads CRM kanban view — pipeline stages as columns, leads as cards.
 * Recommended by `DASHBOARD_UX_PLAN.md` §5.7 as the *primary* view for leads:
 * operators drag prospects across stages instead of editing a stage cell.
 *
 * ## Data flow
 *
 *  1. `useList` fetches every lead the caller can see, filtered by the active
 *     scope (`meta.scopedBy = ["branch"]` is applied by `ResourceDataGrid` on
 *     the list page — we replicate the branch filter here explicitly since
 *     we render our own layout without the shared grid).
 *  2. `useList` on `staff` resolves owner ids into display names.
 *  3. The shared {@link KanbanBoard} groups cards by `lead.stage`.
 *  4. On a drop, `useUpdate` PATCHes the moved lead with `{ stage: <target> }`
 *     in `mutationMode: "optimistic"` so the UI updates immediately; a rollback
 *     toast fires if the backend rejects the change.
 *
 * ## Filters
 *
 * Filter chips at the top narrow the visible set by `source`, `sport_key`,
 * or `owner_id`. Selections apply client-side against the already-fetched
 * lead list — the tenant lead volume is usually low four-figures at most, so
 * fetching all + filtering locally keeps the kanban snappy without a second
 * round-trip on every dropdown change.
 *
 * ## Feature gate
 *
 * When `features.kanbanViews` is off the module manifest never mounts this
 * page (the route is filtered out at boot). We still render a defensive
 * redirect in the module manifest wiring so an over-eager URL paste doesn't
 * hit a blank screen.
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
import type { Lead, LeadStage } from "@/modules/leads/leads.types";
import type { Staff } from "@/types";
import type { Key, ReactNode } from "react";

import { KanbanBoard } from "@/components/kanban";
import { ListView } from "@/components/refine";
import { buildScopeFilters, useScope } from "@/lib/scope";
import { LeadKanbanCardBody } from "@/modules/leads/components/lead-kanban-card";
import { LEAD_STAGE_LABELS, LEAD_STAGES } from "@/modules/leads/leads.types";

/** The chip color used per lead stage — mirrors {@link LeadStageChip}. */
const STAGE_COLUMN_COLOR: Record<LeadStage, "success" | "warning" | "danger" | "default"> = {
  new: "default",
  contacted: "default",
  qualified: "warning",
  trial_booked: "warning",
  won: "success",
  lost: "danger",
};

/** Sentinel value for the "no filter" option on every dropdown. */
const ALL_OPTION = "__all__";
/** Sentinel value for the "no owner assigned" filter option. */
const UNASSIGNED_OWNER_OPTION = "__unassigned__";

/** Filter state — one axis per axis, `null` = no filter applied. */
interface KanbanFilters {
  source: string | null;
  sport: string | null;
  ownerId: string | null;
}

/**
 * Column definitions, memoised outside the component so the board never
 * re-renders columns when unrelated state (filters, selection) changes.
 */
function buildColumns(): KanbanColumn<LeadStage>[] {
  return LEAD_STAGES.map((stage) => ({
    id: stage,
    label: LEAD_STAGE_LABELS[stage],
    color: STAGE_COLUMN_COLOR[stage],
  }));
}

/** The leads kanban page. */
export default function LeadsKanban(): ReactNode {
  const { scope } = useScope();

  // Full lead set — filter chips slice client-side so the drag/drop remains
  // responsive across chip changes without a refetch storm.
  const scopeFilters = useMemo(() => buildScopeFilters(scope, ["branch"]), [scope]);
  const { result: leadsResult, query: leadsQuery } = useList<Lead>({
    resource: "leads",
    filters: scopeFilters,
    pagination: { mode: "off" },
  });
  // Memoise the row reference so downstream `useMemo`s (option lists, filter
  // result) don't re-run when Refine hands back a new (structurally-equal)
  // wrapper object on every render.
  const leads = useMemo<Lead[]>(() => leadsResult?.data ?? [], [leadsResult?.data]);

  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const staff = useMemo<Staff[]>(() => staffResult?.data ?? [], [staffResult?.data]);

  // Resolve owner ids → display names for the card body + owner filter.
  const staffById = useMemo(() => {
    const map = new Map<string, Staff>();

    for (const member of staff) {
      map.set(member.id, member);
    }

    return map;
  }, [staff]);

  const [filters, setFilters] = useState<KanbanFilters>({
    source: null,
    sport: null,
    ownerId: null,
  });

  // Derive the option lists from the raw lead set so dropdowns only offer
  // values that actually exist in the current scope.
  const sourceOptions = useMemo(() => {
    const set = new Set<string>();

    for (const lead of leads) {
      if (lead.source) {
        set.add(lead.source);
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const sportOptions = useMemo(() => {
    const set = new Set<string>();

    for (const lead of leads) {
      if (lead.sport_key) {
        set.add(lead.sport_key);
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  // Owner options come from the staff resource, not from the leads
  // themselves — that way the dropdown lists staff who *could* own a lead,
  // not only ones who already do. A sentinel option covers "unassigned".
  const ownerOptions = useMemo(
    () =>
      staff
        .slice()
        .sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
        ),
    [staff],
  );

  // Apply filters to the lead list before handing it to the board.
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.source && lead.source !== filters.source) return false;
      if (filters.sport && lead.sport_key !== filters.sport) return false;

      if (filters.ownerId === UNASSIGNED_OWNER_OPTION) {
        return lead.owner_id === null;
      }

      if (filters.ownerId && lead.owner_id !== filters.ownerId) return false;

      return true;
    });
  }, [leads, filters]);

  // Move handler — optimistic PATCH with rollback toast. Refine's optimistic
  // mutation mode already flips the local cache before the request lands, so
  // the card re-renders in the target column instantly.
  const { mutate: update } = useUpdate();

  const handleMove = (cardId: string, fromStage: LeadStage, toStage: LeadStage): void => {
    if (fromStage === toStage) {
      // Intra-column drops are no-ops until the board grows ordering support.
      return;
    }

    update(
      {
        resource: "leads",
        id: cardId,
        values: { stage: toStage },
        mutationMode: "optimistic",
        // Suppress Refine's default success/error toasts — the message we
        // want to surface ("Moved Jordan Reyes to Qualified") is more useful
        // than the generic "Successfully updated leads".
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          toast.success("Lead stage updated", {
            description: `Moved to ${LEAD_STAGE_LABELS[toStage]}.`,
          });
        },
        onError: () => {
          // The optimistic cache has already flipped the card to `toStage`;
          // Refine rolls it back automatically when `onError` fires. We just
          // narrate the failure so the operator knows to retry.
          toast.danger("Could not move lead", {
            description: `Reverted from ${LEAD_STAGE_LABELS[toStage]} back to ${LEAD_STAGE_LABELS[fromStage]}.`,
          });
        },
      },
    );
  };

  const columns = useMemo(() => buildColumns(), []);
  const activeFilterCount =
    (filters.source ? 1 : 0) + (filters.sport ? 1 : 0) + (filters.ownerId ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;
  const clearAll = (): void => setFilters({ source: null, sport: null, ownerId: null });

  return (
    <ListView
      headerActions={
        <Tooltip>
          <Button size="sm" variant="secondary">
            <Link className="flex items-center gap-1.5" to="/leads">
              <TableCellsIcon aria-hidden="true" className="size-4" />
              List view
            </Link>
          </Button>
          <Tooltip.Content>Switch to the table view</Tooltip.Content>
        </Tooltip>
      }
      resource="leads"
    >
      <div className="flex flex-col gap-4">
        {/* Filter row — same visual pattern as the list page filter toolbar,
            but positioned above the horizontal-scrolling board so operators
            can filter without losing their column position. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <Select
            className="min-w-[160px]"
            placeholder="Source"
            value={filters.source ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                source: key === null || key === ALL_OPTION ? null : String(key),
              }))
            }
          >
            <Label className="sr-only">Filter by source</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="All sources">
                  All sources
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {sourceOptions.map((source) => (
                  <ListBox.Item key={source} id={source} textValue={source}>
                    {source}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="min-w-[160px]"
            placeholder="Sport"
            value={filters.sport ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                sport: key === null || key === ALL_OPTION ? null : String(key),
              }))
            }
          >
            <Label className="sr-only">Filter by sport</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="All sports">
                  All sports
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {sportOptions.map((sport) => (
                  <ListBox.Item key={sport} id={sport} textValue={sport}>
                    {sport}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="min-w-[180px]"
            placeholder="Owner"
            value={filters.ownerId ?? ALL_OPTION}
            variant="secondary"
            onChange={(key: Key | null) =>
              setFilters((prev) => ({
                ...prev,
                ownerId: key === null || key === ALL_OPTION ? null : String(key),
              }))
            }
          >
            <Label className="sr-only">Filter by owner</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_OPTION} textValue="All owners">
                  All owners
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id={UNASSIGNED_OWNER_OPTION} textValue="Unassigned only">
                  Unassigned only
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {ownerOptions.map((member) => (
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

        {leadsQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading leads" />
          </div>
        ) : (
          <KanbanBoard<Lead, LeadStage>
            ariaLabel="Leads pipeline"
            cards={filteredLeads}
            columns={columns}
            groupBy={(lead) => lead.stage}
            renderCard={(lead) => {
              const owner = lead.owner_id ? staffById.get(lead.owner_id) : null;
              const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : null;

              return <LeadKanbanCardBody lead={lead} ownerName={ownerName} />;
            }}
            renderColumnEmptyState={(column) => (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-muted">
                  No leads in the {column.label.toLowerCase()} stage.
                </p>
                <Button size="sm" variant="ghost">
                  <Link className="flex items-center gap-1" to={`/leads/create?stage=${column.id}`}>
                    <PlusIcon aria-hidden="true" className="size-3.5" />
                    New lead
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
