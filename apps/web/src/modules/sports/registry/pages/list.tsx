/**
 * @file list.tsx
 * @module modules/sports/registry/pages/list
 *
 * @description
 * Sports registry list. Shows platform sports and, via the `tenant-sports`
 * overlay, whether each is enabled for the current tenant. Columns are built
 * inside the component so the "Enabled" cell can read the overlay map.
 */

import { Chip } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Sport, TenantSport } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid } from "@/components/refine";
import { SCORING_TYPE_LABELS } from "@/types";

/** The sports registry list page. */
export default function SportList(): ReactNode {
  // Load the tenant overlay to annotate which sports are enabled.
  const { result } = useList<TenantSport>({
    resource: "tenant-sports",
    pagination: { mode: "off" },
  });

  const enabledBySport = useMemo(() => {
    const map = new Map<string, boolean>();

    for (const overlay of result?.data ?? []) {
      map.set(overlay.sport_key, overlay.is_enabled);
    }

    return map;
  }, [result?.data]);

  const columns = useMemo<DataGridColumn<Sport>[]>(
    () => [
      {
        id: "name",
        header: "Sport",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 180,
        cell: (sport) => <span className="font-medium">{sport.name}</span>,
      },
      { id: "category", header: "Category", allowsSorting: true, cell: (sport) => sport.category },
      {
        id: "scoring_type",
        header: "Scoring",
        cell: (sport) => SCORING_TYPE_LABELS[sport.scoring_type],
      },
      {
        id: "default_team_size",
        header: "Squad size",
        cell: (sport) => (sport.is_team_sport ? sport.default_team_size : "—"),
      },
      {
        id: "enabled",
        header: "Enabled",
        cell: (sport) =>
          enabledBySport.get(sport.key) ? (
            <Chip color="success" size="sm" variant="soft">
              Enabled
            </Chip>
          ) : (
            <Chip color="default" size="sm" variant="soft">
              Off
            </Chip>
          ),
      },
    ],
    [enabledBySport],
  );

  return (
    <ListView resource="sports">
      <ResourceDataGrid<Sport>
        ariaLabel="Sports"
        columns={columns}
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="sports"
      />
    </ListView>
  );
}
