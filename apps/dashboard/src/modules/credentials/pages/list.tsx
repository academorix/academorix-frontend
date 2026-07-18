/**
 * @file list.tsx
 * @module modules/credentials/pages/list
 *
 * @description
 * Access credentials (NFC/RFID/QR) issued to athletes, scoped by branch. Athlete
 * names are resolved from the `athletes` resource so the grid shows people, not
 * ids. Per-row show action.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Credential } from "@/modules/credentials/credentials.types";
import type { Athlete } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { CredentialStatusChip } from "@/modules/credentials/components/credential-status-chip";

/** The credentials list page. */
export default function CredentialList(): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });

  // Build an id → athlete-name map so the grid can show names, not raw ids.
  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  const columns = useMemo<DataGridColumn<Credential>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Athlete",
        isRowHeader: true,
        minWidth: 200,
        cell: (credential) => (
          <span className="font-medium">
            {athleteName.get(credential.athlete_id) ?? credential.athlete_id}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        allowsSorting: true,
        cell: (credential) => credential.type.toUpperCase(),
      },
      {
        id: "code",
        header: "Code",
        cell: (credential) => <span className="font-mono">{credential.code}</span>,
      },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (credential) => <CredentialStatusChip status={credential.status} />,
      },
      {
        id: "issued_at",
        header: "Issued",
        allowsSorting: true,
        cell: (credential) => formatDate(credential.issued_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (credential) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View credential"
              recordItemId={credential.id}
              resource="credentials"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [athleteName],
  );

  return (
    <ListView resource="credentials">
      <ResourceDataGrid<Credential>
        ariaLabel="Credentials"
        columns={columns}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "issued_at", order: "desc" }]}
        resource="credentials"
      />
    </ListView>
  );
}
