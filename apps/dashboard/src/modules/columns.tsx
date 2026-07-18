/**
 * @file columns.tsx
 * @module modules/columns
 *
 * @description
 * Column projections for the generic `ResourceGrid`. Each resource can plug in
 * either a bespoke column set (for domain-specific fields like phone / gender
 * on athletes, or capacity / indoor on facilities) or fall back to the
 * generic `id / name / status / createdAt` layout.
 */

import { Avatar, Chip } from "@heroui/react";
import { useList } from "@refinedev/core";
import type { DataGridColumn } from "@heroui-pro/react";
import type { BaseKey, BaseRecord } from "@refinedev/core";

import type { ReferenceKind } from "@/lib/module";

import { ReferenceHoverCard } from "@/components/reference-hover-card";
import { formatDate } from "@/refine/format";

function getField<T = unknown>(row: BaseRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];

      return undefined;
    }, row);

    if (value !== undefined && value !== null && value !== "") return value as T;
  }

  return undefined;
}

function StatusCell({ row }: { row: BaseRecord }) {
  const active = getField<boolean>(row, "isActive");
  const statusText = getField<string>(row, "status.text", "status");
  const statusColor = getField<string>(row, "status.color") as
    "success" | "warning" | "danger" | "accent" | "default" | undefined;

  if (statusText) {
    return (
      <Chip color={statusColor ?? "accent"} size="sm" variant="soft">
        <Chip.Label>{statusText}</Chip.Label>
      </Chip>
    );
  }

  if (typeof active === "boolean") {
    return (
      <Chip color={active ? "success" : "default"} size="sm" variant="soft">
        <Chip.Label>{active ? "Active" : "Inactive"}</Chip.Label>
      </Chip>
    );
  }

  return <span className="text-muted">—</span>;
}

const personColumns: DataGridColumn<BaseRecord>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "fullName",
    allowsSorting: true,
    isRowHeader: true,
    cell: (row) => {
      const name = getField<string>(row, "fullName", "name", "title") ?? "Unknown";
      const avatarUrl = getField<string>(row, "avatar.0.url");
      const email = getField<string>(row, "email");
      const kind = getField<string>(row, "kind", "role");
      // Guess the reference kind — leans on the row's own `kind` when present,
      // otherwise falls back to `athlete` since that's the most common surface.
      const resolvedKind: ReferenceKind =
        kind && kind.toLowerCase().includes("coach")
          ? "coach"
          : kind && kind.toLowerCase().includes("staff")
            ? "staff"
            : kind && kind.toLowerCase().includes("lead")
              ? "lead"
              : "athlete";

      return (
        <ReferenceHoverCard id={row.id} kind={resolvedKind}>
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 shrink-0" color="accent" size="sm">
              {avatarUrl ? <Avatar.Image alt={name} src={avatarUrl} /> : null}
              <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{name}</div>
              {email || kind ? (
                <div className="truncate text-xs text-muted">
                  {[kind, email].filter(Boolean).join(" · ")}
                </div>
              ) : null}
            </div>
          </div>
        </ReferenceHoverCard>
      );
    },
  },
  {
    id: "gsm",
    header: "Phone",
    cell: (row) => (
      <span className="text-muted tabular-nums">{getField<string>(row, "gsm") ?? "—"}</span>
    ),
  },
  {
    id: "gender",
    header: "Gender",
    cell: (row) => <span className="text-muted">{getField<string>(row, "gender") ?? "—"}</span>,
  },
  {
    id: "isActive",
    header: "Status",
    cell: (row) => <StatusCell row={row} />,
  },
];

const genericColumns: DataGridColumn<BaseRecord>[] = [
  {
    id: "id",
    header: "ID",
    accessorKey: "id",
    allowsSorting: true,
    cell: (row) => <span className="text-muted tabular-nums">#{String(row.id)}</span>,
  },
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    allowsSorting: true,
    isRowHeader: true,
    cell: (row) => (
      <span className="font-medium text-foreground">
        {getField<string>(row, "name", "title", "fullName", "label") ?? `Record ${row.id}`}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusCell row={row} />,
  },
  {
    id: "createdAt",
    header: "Created",
    cell: (row) => {
      const created = getField<string>(row, "createdAt");

      return (
        <span className="whitespace-nowrap text-muted">{created ? formatDate(created) : "—"}</span>
      );
    },
  },
];

const facilityColumns: DataGridColumn<BaseRecord>[] = [
  {
    id: "name",
    header: "Facility",
    accessorKey: "name",
    allowsSorting: true,
    isRowHeader: true,
    cell: (row) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">
          {getField<string>(row, "name") ?? "—"}
        </div>
        <div className="truncate text-xs text-muted">{getField<string>(row, "type") ?? "—"}</div>
      </div>
    ),
  },
  {
    id: "branch",
    header: "Branch",
    accessorKey: "branch",
    cell: (row) => <span className="text-muted">{getField<string>(row, "branch") ?? "—"}</span>,
  },
  {
    id: "capacity",
    header: "Capacity",
    accessorKey: "capacity",
    allowsSorting: true,
    cell: (row) => (
      <span className="text-foreground tabular-nums">{getField<number>(row, "capacity") ?? 0}</span>
    ),
  },
  {
    id: "indoor",
    header: "Environment",
    cell: (row) => (
      <Chip color="default" size="sm" variant="soft">
        <Chip.Label>{getField<boolean>(row, "indoor") ? "Indoor" : "Outdoor"}</Chip.Label>
      </Chip>
    ),
  },
  {
    id: "utilisation",
    header: "Utilisation",
    cell: (row) => {
      const value = getField<number>(row, "utilisation");

      return (
        <span className="text-foreground tabular-nums">
          {typeof value === "number" ? `${Math.round(value * 100)}%` : "—"}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusCell row={row} />,
  },
];

const documentColumns: DataGridColumn<BaseRecord>[] = [
  {
    id: "name",
    header: "Document",
    accessorKey: "name",
    allowsSorting: true,
    isRowHeader: true,
    cell: (row) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">
          {getField<string>(row, "name") ?? "—"}
        </div>
        <div className="truncate text-xs text-muted">
          {getField<string>(row, "kind") ?? "—"} · {getField<string>(row, "owner") ?? "Unassigned"}
        </div>
      </div>
    ),
  },
  {
    id: "size",
    header: "Size",
    cell: (row) => (
      <span className="text-muted tabular-nums">{getField<string>(row, "size") ?? "—"}</span>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    cell: (row) => {
      const updated = getField<string>(row, "updatedAt");

      return (
        <span className="whitespace-nowrap text-muted">{updated ? formatDate(updated) : "—"}</span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusCell row={row} />,
  },
];

/**
 * Renders the athlete cell for attendance rows. The fixture stores the
 * athlete as a plain `fullName` string, so we resolve the linked record's
 * id via a lightweight `useList` lookup and wrap the label in a
 * `ReferenceHoverCard` for the same preview affordance every other
 * person-cell offers.
 */
function AthleteRefCell({ name }: { name: string }) {
  const { result } = useList<BaseRecord>({
    resource: "athletes",
    filters: [{ field: "fullName", operator: "eq", value: name }],
    pagination: { currentPage: 1, pageSize: 1 },
  });
  const record = result?.data?.[0];
  const avatarUrl = record ? getField<string>(record, "avatar.0.url") : undefined;
  const kind: ReferenceKind = "athlete";
  const inline = (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-7 shrink-0" color="accent" size="sm">
        {avatarUrl ? <Avatar.Image alt={name} src={avatarUrl} /> : null}
        <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
      <span className="truncate font-medium text-foreground">{name}</span>
    </div>
  );

  if (!record) return inline;

  return (
    <ReferenceHoverCard id={record.id as BaseKey} kind={kind}>
      {inline}
    </ReferenceHoverCard>
  );
}

const attendanceColumns: DataGridColumn<BaseRecord>[] = [
  {
    id: "sessionName",
    header: "Session",
    accessorKey: "sessionName",
    allowsSorting: true,
    isRowHeader: true,
    cell: (row) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">
          {getField<string>(row, "sessionName") ?? "Session"}
        </div>
        <div className="truncate text-xs text-muted">
          {getField<string>(row, "coach") ?? "Unassigned"} ·{" "}
          {getField<string>(row, "branch") ?? "—"}
        </div>
      </div>
    ),
  },
  {
    id: "athlete",
    header: "Athlete",
    accessorKey: "athlete",
    allowsSorting: true,
    cell: (row) => {
      const name = getField<string>(row, "athlete") ?? "Unknown";

      return <AthleteRefCell name={name} />;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusCell row={row} />,
  },
  {
    id: "notes",
    header: "Notes",
    cell: (row) => (
      <span className="truncate text-muted">{getField<string>(row, "notes") ?? "—"}</span>
    ),
  },
  {
    id: "checkInAt",
    header: "Date",
    accessorKey: "checkInAt",
    allowsSorting: true,
    cell: (row) => {
      const at = getField<string>(row, "checkInAt", "createdAt");

      return (
        <span className="whitespace-nowrap text-muted tabular-nums">
          {at ? formatDate(at) : "—"}
        </span>
      );
    },
  },
];

const BUILT_IN_COLUMNS: Record<
  string,
  { columns: DataGridColumn<BaseRecord>[]; contentClassName?: string }
> = {
  athletes: { columns: personColumns, contentClassName: "min-w-[720px]" },
  staff: { columns: personColumns, contentClassName: "min-w-[720px]" },
  coaches: { columns: personColumns, contentClassName: "min-w-[720px]" },
  people: { columns: personColumns, contentClassName: "min-w-[720px]" },
  users: { columns: personColumns, contentClassName: "min-w-[720px]" },
  facilities: { columns: facilityColumns, contentClassName: "min-w-[860px]" },
  documents: { columns: documentColumns, contentClassName: "min-w-[720px]" },
  attendance: { columns: attendanceColumns, contentClassName: "min-w-[880px]" },
};

export function getResourceColumns(resource: string): {
  columns: DataGridColumn<BaseRecord>[];
  contentClassName?: string;
} {
  return (
    BUILT_IN_COLUMNS[resource] ?? { columns: genericColumns, contentClassName: "min-w-[640px]" }
  );
}
