/**
 * @file list.tsx
 * @module modules/integrations/pages/list
 *
 * @description
 * Integrations list — external providers the tenant can connect, with their
 * category, connection status, and last sync time.
 */

import { Chip } from "@academorix/ui/react";
import { useMemo } from "react";

import type { Integration, IntegrationStatus } from "@/modules/integrations/integrations.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { INTEGRATION_STATUS_LABELS } from "@/modules/integrations/integrations.types";

/** Maps integration status to a semantic Chip color. */
const STATUS_COLOR: Record<IntegrationStatus, "success" | "danger" | "default"> = {
  connected: "success",
  disconnected: "default",
  error: "danger",
};

/** The integrations list page. */
export default function IntegrationsList(): ReactNode {
  const columns = useMemo<DataGridColumn<Integration>[]>(
    () => [
      {
        id: "name",
        header: "Integration",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 200,
        cell: (integration) => <span className="font-medium">{integration.name}</span>,
      },
      {
        id: "category",
        header: "Category",
        allowsSorting: true,
        cell: (integration) => integration.category,
      },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (integration) => (
          <Chip color={STATUS_COLOR[integration.status]} size="sm" variant="soft">
            {INTEGRATION_STATUS_LABELS[integration.status]}
          </Chip>
        ),
      },
      {
        id: "last_synced_at",
        header: "Last sync",
        allowsSorting: true,
        cell: (integration) => formatDateTime(integration.last_synced_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 120,
        cell: (integration) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View integration"
              recordItemId={integration.id}
              resource="integrations"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit integration"
              recordItemId={integration.id}
              resource="integrations"
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
    <ListView resource="integrations">
      <ResourceDataGrid<Integration>
        ariaLabel="Integrations"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="integrations"
      />
    </ListView>
  );
}
