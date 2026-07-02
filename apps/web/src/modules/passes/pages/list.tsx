/**
 * @file list.tsx
 * @module modules/passes/pages/list
 *
 * @description
 * Passes list — issued check-in passes with holder, type, status, and validity.
 * The scannable code is shown on the detail screen.
 */

import { Chip } from "@academorix/ui/react";
import { useMemo } from "react";

import type { Pass, PassStatus } from "@/modules/passes/passes.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { PASS_STATUS_LABELS, PASS_TYPE_LABELS } from "@/modules/passes/passes.types";

/** Maps pass status to a semantic Chip color. */
const STATUS_COLOR: Record<PassStatus, "success" | "danger" | "default"> = {
  active: "success",
  expired: "default",
  revoked: "danger",
};

/** The passes list page. */
export default function PassesList(): ReactNode {
  const columns = useMemo<DataGridColumn<Pass>[]>(
    () => [
      {
        id: "holder_name",
        header: "Holder",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 200,
        cell: (pass) => <span className="font-medium">{pass.holder_name}</span>,
      },
      {
        id: "type",
        header: "Type",
        allowsSorting: true,
        cell: (pass) => PASS_TYPE_LABELS[pass.type],
      },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (pass) => (
          <Chip color={STATUS_COLOR[pass.status]} size="sm" variant="soft">
            {PASS_STATUS_LABELS[pass.status]}
          </Chip>
        ),
      },
      {
        id: "valid_until",
        header: "Valid until",
        allowsSorting: true,
        cell: (pass) => formatDate(pass.valid_until),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (pass) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View pass"
              recordItemId={pass.id}
              resource="passes"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <ListView resource="passes">
      <ResourceDataGrid<Pass>
        ariaLabel="Passes"
        columns={columns}
        contentClassName="min-w-[600px]"
        initialSorters={[{ field: "valid_until", order: "desc" }]}
        resource="passes"
      />
    </ListView>
  );
}
