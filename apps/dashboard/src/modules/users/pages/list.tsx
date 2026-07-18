/**
 * @file list.tsx
 * @module modules/users/pages/list
 *
 * @description
 * Users list — tenant staff/admin accounts with roles and status. Per-row
 * show/edit/delete actions.
 */

import { Chip } from "@stackra/ui/react";

import type { User } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate } from "@/lib/format";
import { UserStatusChip } from "@/modules/users/components/user-status-chip";

/** DataGrid columns for the users list. */
const COLUMNS: DataGridColumn<User>[] = [
  {
    id: "first_name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (user) => (
      <span className="font-medium">
        {user.first_name} {user.last_name}
      </span>
    ),
  },
  { id: "email", header: "Email", allowsSorting: true, minWidth: 200, cell: (user) => user.email },
  {
    id: "roles",
    header: "Roles",
    cell: (user) => (
      <div className="flex flex-wrap gap-1">
        {user.roles.map((role) => (
          <Chip key={role} size="sm" variant="soft">
            {role}
          </Chip>
        ))}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (user) => <UserStatusChip status={user.status} />,
  },
  {
    id: "last_login_at",
    header: "Last login",
    cell: (user) => formatDate(user.last_login_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (user) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View user"
          recordItemId={user.id}
          resource="users"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit user"
          recordItemId={user.id}
          resource="users"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete user"
          recordItemId={user.id}
          resource="users"
          size="sm"
        />
      </div>
    ),
  },
];

/** The users list page. */
export default function UserList(): ReactNode {
  return (
    <ListView resource="users">
      <ResourceDataGrid<User>
        ariaLabel="Users"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "first_name", order: "asc" }]}
        resource="users"
      />
    </ListView>
  );
}
