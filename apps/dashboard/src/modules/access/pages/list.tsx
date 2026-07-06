/**
 * @file list.tsx
 * @module modules/access/pages/list
 *
 * @description
 * Roles list — the tenant's RBAC roles with their permission counts and
 * system-role flag. Detail shows the full permission set.
 */

import { Chip } from "@academorix/ui/react";

import type { Role } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";

/** DataGrid columns for the roles list. */
const COLUMNS: DataGridColumn<Role>[] = [
  {
    id: "name",
    header: "Role",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (role) => <span className="font-medium">{role.name}</span>,
  },
  {
    id: "description",
    header: "Description",
    minWidth: 240,
    cell: (role) => role.description ?? "—",
  },
  { id: "permissions", header: "Permissions", cell: (role) => role.permissions.length },
  {
    id: "is_system",
    header: "Type",
    cell: (role) =>
      role.is_system ? (
        <Chip size="sm" variant="soft">
          System
        </Chip>
      ) : (
        "Custom"
      ),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 80,
    cell: (role) => (
      <div className="flex justify-end">
        <ShowButton
          isIconOnly
          aria-label="View role"
          recordItemId={role.id}
          resource="roles"
          size="sm"
          variant="ghost"
        />
      </div>
    ),
  },
];

/** The roles list page. */
export default function RoleList(): ReactNode {
  return (
    <ListView resource="roles" title="Roles & Permissions">
      <ResourceDataGrid<Role>
        ariaLabel="Roles"
        columns={COLUMNS}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="roles"
      />
    </ListView>
  );
}
