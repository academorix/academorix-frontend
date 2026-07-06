/**
 * @file list.tsx
 * @module modules/leads/pages/list
 *
 * @description
 * Leads CRM list — prospective members with their pipeline stage, source,
 * sport of interest, and owning staff member. The owner name is resolved from
 * the staff resource.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Lead } from "@/modules/leads/leads.types";
import type { Staff } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { LeadStageChip } from "@/modules/leads/components/lead-stage-chip";

/** The leads CRM list page. */
export default function LeadsList(): ReactNode {
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });

  const staffName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staffResult?.data ?? []) {
      map.set(member.id, `${member.first_name} ${member.last_name}`);
    }

    return map;
  }, [staffResult?.data]);

  const columns = useMemo<DataGridColumn<Lead>[]>(
    () => [
      {
        id: "name",
        header: "Lead",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 200,
        cell: (lead) => <span className="font-medium">{lead.name}</span>,
      },
      {
        id: "stage",
        header: "Stage",
        allowsSorting: true,
        cell: (lead) => <LeadStageChip stage={lead.stage} />,
      },
      { id: "source", header: "Source", allowsSorting: true, cell: (lead) => lead.source },
      { id: "sport_key", header: "Sport", cell: (lead) => lead.sport_key ?? "—" },
      {
        id: "owner_id",
        header: "Owner",
        minWidth: 160,
        cell: (lead) => (lead.owner_id ? (staffName.get(lead.owner_id) ?? lead.owner_id) : "—"),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 120,
        cell: (lead) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View lead"
              recordItemId={lead.id}
              resource="leads"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit lead"
              recordItemId={lead.id}
              resource="leads"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [staffName],
  );

  return (
    <ListView resource="leads">
      <ResourceDataGrid<Lead>
        ariaLabel="Leads"
        columns={columns}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "created_at", order: "desc" }]}
        resource="leads"
      />
    </ListView>
  );
}
