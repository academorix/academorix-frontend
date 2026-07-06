/**
 * @file list.tsx
 * @module modules/regions/pages/list
 *
 * @description
 * Regions list — currency, countries, timezone, and locale per commercial region.
 */

import type { Region } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid } from "@/components/refine";

/** DataGrid columns for the regions list. */
const COLUMNS: DataGridColumn<Region>[] = [
  {
    id: "name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 160,
    cell: (region) => <span className="font-medium">{region.name}</span>,
  },
  {
    id: "currency_code",
    header: "Currency",
    allowsSorting: true,
    cell: (region) => region.currency_code,
  },
  {
    id: "countries",
    header: "Countries",
    cell: (region) => region.countries.join(", "),
  },
  {
    id: "timezone",
    header: "Timezone",
    cell: (region) => region.timezone,
  },
  {
    id: "locale",
    header: "Locale",
    cell: (region) => region.locale,
  },
];

/** The regions list page. */
export default function RegionList(): ReactNode {
  return (
    <ListView resource="regions">
      <ResourceDataGrid<Region>
        ariaLabel="Regions"
        columns={COLUMNS}
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="regions"
      />
    </ListView>
  );
}
