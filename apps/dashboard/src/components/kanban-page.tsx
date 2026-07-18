/**
 * @file kanban-page.tsx
 * @module components/kanban-page
 *
 * @description
 * The generic Kanban board (§5.7). Fetches records via Refine's `useList`,
 * groups them by a `column` field, and lets users drag cards between columns
 * — the drop fires a `useUpdate` mutation that persists the new column value.
 *
 * Usage:
 * ```tsx
 * <KanbanPage
 *   resource="leads"
 *   columnField="stage"
 *   columns={[{id:"new", label:"New", color:"accent"}, …]}
 *   renderCard={(row) => <LeadCard row={row} />}
 * />
 * ```
 */

import { Button, Chip } from "@heroui/react";
import { Kanban, useKanban, useKanbanCardPlaceholder, useKanbanColumn } from "@heroui-pro/react";
import { useList, useNotification, useUpdate } from "@refinedev/core";
import { useEffect, useMemo } from "react";

import type { BaseKey, BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { Avatar } from "@heroui/react";

export type KanbanColumnDef = {
  id: string;
  label: string;
  color: "accent" | "success" | "warning" | "danger" | "default";
  icon?: string;
};

type KanbanPageProps<T extends BaseRecord> = {
  resource: string;
  /** Path to the field on the record that determines the column. Dot notation OK (`status.text`). */
  columnField: string;
  columns: KanbanColumnDef[];
  renderCard: (row: T) => ReactNode;
  ariaLabel?: string;
};

const COLUMN_BG: Record<KanbanColumnDef["color"], string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  default: "bg-default",
};

const COLUMN_HALO: Record<KanbanColumnDef["color"], string> = {
  accent: "bg-accent/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  danger: "bg-danger/10",
  default: "bg-default/20",
};

const COLUMN_TEXT: Record<KanbanColumnDef["color"], string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  default: "text-muted",
};

function readPath(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];

    return undefined;
  }, row);
}

function writePath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...target };
  const parts = path.split(".");
  let cursor: Record<string, unknown> = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = cursor[key];

    cursor[key] =
      typeof next === "object" && next !== null ? { ...(next as Record<string, unknown>) } : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;

  return clone;
}

function KanbanColumnBody<T extends BaseRecord>({
  column,
  kanban,
  renderCard,
}: {
  column: KanbanColumnDef;
  kanban: ReturnType<typeof useKanban<T>>;
  renderCard: (row: T) => ReactNode;
}) {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const { dragAndDropHooks, items } = useKanbanColumn(kanban, column.id, { renderDropIndicator });

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader className={`rounded-t-2xl px-3 py-2.5 ${COLUMN_HALO[column.color]}`}>
        <Kanban.ColumnIndicator className={COLUMN_BG[column.color]} />
        <Kanban.ColumnTitle>{column.label}</Kanban.ColumnTitle>
        <Kanban.ColumnCount className={COLUMN_TEXT[column.color]}>
          {items.length}
        </Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <Button aria-label={`Add to ${column.label}`} isIconOnly size="sm" variant="ghost">
            <Iconify className="size-4" icon="plus" />
          </Button>
        </Kanban.ColumnActions>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody className={`rounded-t-none ${COLUMN_HALO[column.color]}`}>
        <Kanban.ScrollShadow className="max-h-[640px]">
          <Kanban.CardList
            aria-label={column.label}
            dragAndDropHooks={dragAndDropHooks}
            items={items}
            renderEmptyState={() => (
              <div className="flex flex-col items-center gap-1 py-6 text-xs text-muted">
                <Iconify className="size-4 opacity-60" icon="inbox" />
                <span>No cards.</span>
              </div>
            )}
          >
            {(item) => (
              <Kanban.Card textValue={String((item as BaseRecord).id ?? "")}>
                {renderCard(item as T)}
              </Kanban.Card>
            )}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

export function KanbanPage<T extends BaseRecord>({
  resource,
  columnField,
  columns,
  renderCard,
  ariaLabel,
}: KanbanPageProps<T>) {
  const { result } = useList<T>({ resource, pagination: { mode: "off" } });
  const rows = useMemo(() => (result?.data ?? []) as T[], [result?.data]);

  const { mutate: updateOne } = useUpdate();
  const { open: notify } = useNotification();

  const kanban = useKanban<T>({
    initialItems: rows,
    getColumn: (item) => {
      const raw = readPath(item as Record<string, unknown>, columnField);
      const key = raw == null ? columns[0]!.id : String(raw).toLowerCase();

      // Match on both id and label to be forgiving.
      return (
        columns.find((c) => c.id.toLowerCase() === key)?.id ??
        columns.find((c) => c.label.toLowerCase() === key)?.id ??
        columns[0]!.id
      );
    },
    setColumn: (item, columnId) => {
      const rec = item as Record<string, unknown>;
      const column = columns.find((c) => c.id === columnId);
      const label = column?.label ?? columnId;

      // For nested fields with the {text,color} shape, preserve the object.
      const current = readPath(rec, columnField);
      const next =
        current && typeof current === "object" && "text" in current
          ? {
              ...(current as Record<string, unknown>),
              text: label,
              color: column?.color ?? "accent",
            }
          : columnId;

      return writePath(rec, columnField, next) as T;
    },
  });

  // Re-seed the kanban's internal list whenever the fixture data changes
  // (initial load, mutation success). Refine's `useList` cache is the source of truth.
  useEffect(() => {
    const currentKeys = new Set(kanban.list.items.map((i) => String((i as BaseRecord).id)));

    for (const row of rows) {
      const rowKey = String((row as BaseRecord).id);

      if (!currentKeys.has(rowKey)) kanban.addItem(row);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Persist column moves.
  useEffect(() => {
    const subscription = () => {
      for (const item of kanban.list.items) {
        const rec = item as BaseRecord;
        const original = rows.find((r) => String((r as BaseRecord).id) === String(rec.id));
        const currentColumn = kanban.getColumn(item);

        if (!original) continue;
        const originalColumn = kanban.getColumn(original);

        if (originalColumn !== currentColumn) {
          const values = readPath(rec as Record<string, unknown>, columnField);

          updateOne(
            {
              resource,
              id: rec.id as BaseKey,
              values: { [columnField.split(".")[0]!]: values },
              mutationMode: "optimistic",
            },
            {
              onSuccess: () =>
                notify?.({
                  key: `kanban-${resource}-${rec.id}-${Date.now()}`,
                  message: `${resource} moved to ${currentColumn}`,
                  type: "success",
                }),
            },
          );
        }
      }
    };

    subscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanban.list.items]);

  return (
    <Kanban aria-label={ariaLabel ?? `${resource} kanban board`}>
      {columns.map((column) => (
        <KanbanColumnBody key={column.id} column={column} kanban={kanban} renderCard={renderCard} />
      ))}
    </Kanban>
  );
}

/** A compact default card renderer that works for most records. */
export function DefaultKanbanCard<T extends BaseRecord>({
  primary,
  secondary,
  chips,
  avatarUrl,
}: {
  row: T;
  primary: string;
  secondary?: string;
  chips?: { label: string; color?: "accent" | "success" | "warning" | "danger" | "default" }[];
  avatarUrl?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {avatarUrl ? (
          <Avatar className="size-6 shrink-0" size="sm">
            <Avatar.Image alt={primary} src={avatarUrl} />
            <Avatar.Fallback>{primary.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{primary}</div>
          {secondary ? <div className="truncate text-xs text-muted">{secondary}</div> : null}
        </div>
      </div>
      {chips && chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {chips.map((chip) => (
            <Chip key={chip.label} color={chip.color ?? "default"} size="sm" variant="soft">
              <Chip.Label>{chip.label}</Chip.Label>
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
