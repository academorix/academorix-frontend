/**
 * @file list.tsx
 * @module modules/attributes/pages/list
 *
 * @description
 * Attribute sets list — the SDUI definitions bound to an entity type and a
 * discriminator value (e.g. `athlete_enrollment` + `football`), with version and
 * field count.
 */

import type { AttributeSet } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid } from "@/components/refine";

/** Counts the total attributes across all groups of a set. */
function fieldCount(set: AttributeSet): number {
  return set.groups.reduce((total, group) => total + group.attributes.length, 0);
}

/** DataGrid columns for the attribute-sets list. */
const COLUMNS: DataGridColumn<AttributeSet>[] = [
  {
    id: "code",
    header: "Code",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 240,
    cell: (set) => <span className="font-mono text-xs">{set.code}</span>,
  },
  { id: "entity_type", header: "Entity", allowsSorting: true, cell: (set) => set.entity_type },
  {
    id: "discriminator_value",
    header: "Discriminator",
    cell: (set) => `${set.discriminator_field} = ${set.discriminator_value}`,
  },
  { id: "version", header: "Version", allowsSorting: true, cell: (set) => `v${set.version}` },
  { id: "fields", header: "Fields", cell: (set) => fieldCount(set) },
];

/** The attribute-sets list page. */
export default function AttributeSetList(): ReactNode {
  return (
    <ListView resource="attribute-sets" title="Attribute Sets">
      <ResourceDataGrid<AttributeSet>
        ariaLabel="Attribute sets"
        columns={COLUMNS}
        initialSorters={[{ field: "code", order: "asc" }]}
        resource="attribute-sets"
      />
    </ListView>
  );
}
