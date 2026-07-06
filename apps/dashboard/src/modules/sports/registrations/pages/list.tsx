/**
 * @file list.tsx
 * @module modules/sports/registrations/pages/list
 *
 * @description
 * Registrations funnel (scoped by branch + season) — prospective athletes moving
 * from lead → trial → offer → enrolled/waitlisted. Read-only list with a detail
 * action; conversion happens via dedicated actions in later waves.
 */

import type { Registration } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { RegistrationStatusChip } from "@/modules/sports/registrations/components/registration-status-chip";

/** DataGrid columns for the registrations funnel. */
const COLUMNS: DataGridColumn<Registration>[] = [
  {
    id: "applicant_name",
    header: "Applicant",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (registration) => <span className="font-medium">{registration.applicant_name}</span>,
  },
  {
    id: "contact_email",
    header: "Email",
    allowsSorting: true,
    minWidth: 200,
    cell: (registration) => registration.contact_email,
  },
  { id: "sport_key", header: "Sport", cell: (registration) => registration.sport_key },
  {
    id: "status",
    header: "Stage",
    allowsSorting: true,
    cell: (registration) => <RegistrationStatusChip status={registration.status} />,
  },
  {
    id: "submitted_at",
    header: "Submitted",
    allowsSorting: true,
    cell: (registration) => formatDate(registration.submitted_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 80,
    cell: (registration) => (
      <div className="flex justify-end">
        <ShowButton
          isIconOnly
          aria-label="View registration"
          recordItemId={registration.id}
          resource="registrations"
          size="sm"
          variant="ghost"
        />
      </div>
    ),
  },
];

/** The registrations funnel list page. */
export default function RegistrationList(): ReactNode {
  return (
    <ListView resource="registrations">
      <ResourceDataGrid<Registration>
        ariaLabel="Registrations"
        columns={COLUMNS}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "submitted_at", order: "desc" }]}
        resource="registrations"
      />
    </ListView>
  );
}
