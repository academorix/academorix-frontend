/**
 * @file extra-0.tsx
 * @module modules/safeguarding/pages/extra-0
 *
 * @description
 * The `/safeguarding/kanban` board (§5.7). Sensitive cases move through an
 * open → under-review → resolved → escalated pipeline; dropping a card
 * persists the new status via `useUpdate`.
 */

import { PageHeader } from "@/components/page-header";
import { DefaultKanbanCard, KanbanPage, type KanbanColumnDef } from "@/components/kanban-page";
import { Iconify } from "@/icons/iconify";
import { Button } from "@heroui/react";
import { useNavigation } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";

type SafeguardingCase = BaseRecord & {
  name?: string;
  severity?: string;
  status?: { text?: string; color?: string } | string;
  reporter?: string;
  reportedAt?: string;
};

const COLUMNS: KanbanColumnDef[] = [
  { id: "open", label: "Open", color: "warning", icon: "circle-dashed" },
  { id: "under-review", label: "Under review", color: "accent", icon: "eye" },
  { id: "escalated", label: "Escalated", color: "danger", icon: "triangle-exclamation" },
  { id: "resolved", label: "Resolved", color: "success", icon: "circle-check" },
];

const SEVERITY_COLOR: Record<string, "success" | "warning" | "danger" | "accent"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export default function Page() {
  const { list } = useNavigation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button onPress={() => list("safeguarding")} variant="ghost">
            <Iconify className="size-4" icon="list-ul" />
            List view
          </Button>
        }
        description="Sensitive-case workflow — every move is audited. Drop cards to change status."
        title="Safeguarding · Kanban"
      />
      <KanbanPage<SafeguardingCase>
        ariaLabel="Safeguarding Kanban board"
        columnField="status.text"
        columns={COLUMNS}
        renderCard={(row) => (
          <DefaultKanbanCard
            chips={[
              ...(row.severity
                ? [
                    {
                      label: row.severity,
                      color:
                        (SEVERITY_COLOR[row.severity.toLowerCase()] ?? "default") as
                          | "success"
                          | "warning"
                          | "danger"
                          | "accent"
                          | "default",
                    },
                  ]
                : []),
              ...(row.reporter ? [{ label: row.reporter, color: "default" as const }] : []),
            ]}
            primary={row.name ?? `Case #${row.id}`}
            row={row}
            secondary={row.reportedAt}
          />
        )}
        resource="safeguarding"
      />
    </div>
  );
}
