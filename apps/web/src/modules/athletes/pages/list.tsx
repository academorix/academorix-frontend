/**
 * @file list.tsx
 * @module modules/athletes/pages/list
 *
 * @description
 * Athletes list screen (the resource's `list` route). Composed from the shared
 * Refine UI kit: {@link ListView} supplies the header (breadcrumbs, tenant
 * title, create action) and {@link ResourceDataGrid} handles data fetching,
 * sorting, and pagination. This page only declares its **columns** and the
 * per-row actions — no table plumbing.
 */

import { Chip } from "@academorix/ui/react";

import type { Athlete, EntityStatus } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { ENTITY_STATUS_LABELS, SKILL_LEVEL_LABELS } from "@/types";

/** Maps an athlete status to a HeroUI Chip color. */
const STATUS_COLOR: Record<EntityStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  pending: "warning",
  archived: "danger",
  inactive: "default",
};

/** Formats an ISO timestamp as a short, locale-aware date. */
function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

/**
 * DataGrid column definitions. Each sortable column's `id` doubles as the sort
 * field sent to the server, so the `Name` column sorts by `first_name`. The
 * trailing `actions` column carries per-row show/edit/delete buttons.
 */
const COLUMNS: DataGridColumn<Athlete>[] = [
  {
    id: "first_name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (athlete) => (
      <span className="font-medium">
        {athlete.first_name} {athlete.last_name}
      </span>
    ),
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    allowsSorting: true,
    minWidth: 200,
  },
  {
    id: "level",
    header: "Level",
    allowsSorting: true,
    cell: (athlete) => (athlete.level ? SKILL_LEVEL_LABELS[athlete.level] : "—"),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (athlete) => (
      <Chip color={STATUS_COLOR[athlete.status]} size="sm" variant="soft">
        {ENTITY_STATUS_LABELS[athlete.status]}
      </Chip>
    ),
  },
  {
    id: "enrolled_at",
    header: "Enrolled",
    allowsSorting: true,
    cell: (athlete) => formatDate(athlete.enrolled_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (athlete) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
        />
      </div>
    ),
  },
];

/** The athletes list page. */
export default function AthleteList(): ReactNode {
  return (
    <ListView resource="athletes">
      <ResourceDataGrid<Athlete>
        ariaLabel="Athletes"
        columns={COLUMNS}
        contentClassName="min-w-[840px]"
        initialSorters={[{ field: "enrolled_at", order: "desc" }]}
        resource="athletes"
      />
    </ListView>
  );
}
