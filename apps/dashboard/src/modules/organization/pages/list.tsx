/**
 * @file list.tsx
 * @module modules/organization/pages/list
 *
 * @description
 * Organizations list — the tenant's divisions with their status and default
 * flag. Composed from the shared Refine UI kit.
 */

import { Chip } from "@academorix/ui/react";

import type { Organization } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import { ListView, ResourceDataGrid } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** DataGrid columns for the organizations list. */
const COLUMNS: DataGridColumn<Organization>[] = [
  {
    id: "name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 220,
    cell: (organization) => <span className="font-medium">{organization.name}</span>,
  },
  {
    id: "is_default",
    header: "Default",
    cell: (organization) =>
      organization.is_default ? (
        <Chip size="sm" variant="soft">
          Default
        </Chip>
      ) : (
        "—"
      ),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (organization) => <EntityStatusChip status={organization.status} />,
  },
  {
    id: "created_at",
    header: "Created",
    allowsSorting: true,
    cell: (organization) => formatDate(organization.created_at),
  },
];

/** The organizations list page. */
export default function OrganizationList(): ReactNode {
  return (
    <ListView resource="organizations">
      <ResourceDataGrid<Organization>
        ariaLabel="Organizations"
        columns={COLUMNS}
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="organizations"
      />
    </ListView>
  );
}
