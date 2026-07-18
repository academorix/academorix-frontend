/**
 * @file list.tsx
 * @module modules/reception/pages/list
 *
 * @description
 * Front-desk approvals queue (scoped by branch) — pending registrations,
 * documents, and refunds with inline approve/reject actions.
 */

import { Chip } from "@stackra/ui/react";

import type { ApprovalTask } from "@/modules/reception/reception.types";
import type { ApprovalStatus } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { ApprovalActions } from "@/modules/reception/components/approval-actions";
import { APPROVAL_STATUS_LABELS } from "@/types";

/** Maps each approval status to a semantic HeroUI Chip color. */
const STATUS_COLOR: Record<ApprovalStatus, "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/** DataGrid columns for the approvals queue. */
const COLUMNS: DataGridColumn<ApprovalTask>[] = [
  {
    id: "subject",
    header: "Subject",
    isRowHeader: true,
    minWidth: 240,
    cell: (task) => <span className="font-medium">{task.subject}</span>,
  },
  { id: "type", header: "Type", allowsSorting: true, cell: (task) => task.type },
  { id: "requested_by", header: "Requested by", cell: (task) => task.requested_by },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (task) => (
      <Chip color={STATUS_COLOR[task.status]} size="sm" variant="soft">
        {APPROVAL_STATUS_LABELS[task.status]}
      </Chip>
    ),
  },
  {
    id: "created_at",
    header: "Raised",
    allowsSorting: true,
    cell: (task) => formatDateTime(task.created_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 110,
    cell: (task) => <ApprovalActions task={task} />,
  },
];

/** The reception approvals queue page. */
export default function ReceptionQueue(): ReactNode {
  return (
    <ListView resource="approval-tasks" title="Reception">
      <ResourceDataGrid<ApprovalTask>
        ariaLabel="Approvals queue"
        columns={COLUMNS}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "created_at", order: "desc" }]}
        resource="approval-tasks"
      />
    </ListView>
  );
}
