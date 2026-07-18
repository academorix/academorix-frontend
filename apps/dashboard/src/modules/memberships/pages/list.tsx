/**
 * @file list.tsx
 * @module modules/memberships/pages/list
 *
 * @description
 * Memberships list (recurring subscriptions), scoped by branch, with plan, price,
 * interval, renewal, and status. Per-row show/edit/delete actions.
 */

import type { Membership } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { MembershipStatusChip } from "@/modules/memberships/components/membership-status-chip";

/** DataGrid columns for the memberships list. */
const COLUMNS: DataGridColumn<Membership>[] = [
  {
    id: "plan_name",
    header: "Plan",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 200,
    cell: (membership) => <span className="font-medium">{membership.plan_name}</span>,
  },
  {
    id: "price",
    header: "Price",
    cell: (membership) =>
      `${formatMoney(membership.price, membership.currency)}/${membership.interval}`,
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (membership) => <MembershipStatusChip status={membership.status} />,
  },
  {
    id: "current_period_end",
    header: "Renews",
    allowsSorting: true,
    cell: (membership) => formatDate(membership.current_period_end),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (membership) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View membership"
          recordItemId={membership.id}
          resource="memberships"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit membership"
          recordItemId={membership.id}
          resource="memberships"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete membership"
          recordItemId={membership.id}
          resource="memberships"
          size="sm"
        />
      </div>
    ),
  },
];

/** The memberships list page. */
export default function MembershipList(): ReactNode {
  return (
    <ListView resource="memberships">
      <ResourceDataGrid<Membership>
        ariaLabel="Memberships"
        columns={COLUMNS}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "current_period_end", order: "asc" }]}
        resource="memberships"
      />
    </ListView>
  );
}
