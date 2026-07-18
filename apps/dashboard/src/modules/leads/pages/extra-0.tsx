/**
 * @file extra-0.tsx
 * @module modules/leads/pages/extra-0
 *
 * @description
 * The `/leads/kanban` board (§5.7). A drag-and-drop Kanban with five columns
 * mirroring the funnel stages, pulled from the leads fixture. Dropping a card
 * fires `useUpdate` to persist the new stage.
 */

import { PageHeader } from "@/components/page-header";
import { DefaultKanbanCard, KanbanPage, type KanbanColumnDef } from "@/components/kanban-page";
import { Iconify } from "@/icons/iconify";
import { Button } from "@heroui/react";
import { useNavigation } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";

type Lead = BaseRecord & {
  fullName?: string;
  email?: string;
  phone?: string;
  stage?: string;
  source?: string;
  owner?: string;
};

const COLUMNS: KanbanColumnDef[] = [
  { id: "new", label: "New", color: "accent", icon: "circle-dashed" },
  { id: "contacted", label: "Contacted", color: "accent", icon: "envelope" },
  { id: "qualified", label: "Qualified", color: "warning", icon: "circle-check" },
  { id: "converted", label: "Converted", color: "success", icon: "trophy" },
  { id: "lost", label: "Lost", color: "danger", icon: "circle-xmark" },
];

export default function Page() {
  const { list } = useNavigation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button onPress={() => list("leads")} variant="ghost">
            <Iconify className="size-4" icon="list-ul" />
            List view
          </Button>
        }
        description="Drag leads through the funnel — dropped cards persist the new stage."
        title="Leads · Kanban"
      />
      <KanbanPage<Lead>
        ariaLabel="Leads Kanban board"
        columnField="stage"
        columns={COLUMNS}
        renderCard={(row) => (
          <DefaultKanbanCard
            chips={[
              ...(row.source ? [{ label: row.source }] : []),
              ...(row.owner ? [{ label: row.owner, color: "accent" as const }] : []),
            ]}
            primary={row.fullName ?? `Lead #${row.id}`}
            row={row}
            secondary={row.email ?? row.phone}
          />
        )}
        resource="leads"
      />
    </div>
  );
}
