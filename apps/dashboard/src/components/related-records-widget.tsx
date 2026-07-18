/**
 * @file related-records-widget.tsx
 * @module components/related-records-widget
 *
 * @description
 * Renders a related-records widget inside a detail-page Overview tab per
 * §6.1 point 7. Fetches from a target resource with a filter joining on the
 * parent record's id, projects into a compact table with a footer "View all"
 * link.
 */

import { Chip, Link, Skeleton, Table } from "@heroui/react";
import { Widget } from "@heroui-pro/react";
import { useList } from "@refinedev/core";

import type { RelatedRecordsConfig } from "@/lib/module";
import type { BaseKey, BaseRecord } from "@refinedev/core";

import { formatCurrency, formatDate } from "@/refine/format";

function getField<T = unknown>(row: BaseRecord, path: string): T | undefined {
  return path.split(".").reduce<unknown>(
    (acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];

      return undefined;
    },
    row as Record<string, unknown>,
  ) as T | undefined;
}

function renderCell(row: BaseRecord, column: NonNullable<RelatedRecordsConfig["columns"]>[number]) {
  const raw = getField(row, column.field);

  if (raw === undefined || raw === null || raw === "") return <span className="text-muted">—</span>;

  switch (column.kind) {
    case "date":
      return <span className="whitespace-nowrap text-muted">{formatDate(String(raw))}</span>;
    case "money":
      return <span className="text-foreground tabular-nums">{formatCurrency(Number(raw))}</span>;
    case "chip": {
      const chip = raw as { text?: string; color?: string };
      const label = chip?.text ?? String(raw);
      const color =
        (chip?.color as "success" | "warning" | "danger" | "accent" | "default") ?? "accent";

      return (
        <Chip color={color} size="sm" variant="soft">
          <Chip.Label>{label}</Chip.Label>
        </Chip>
      );
    }
    case "text":
    default:
      return <span className="truncate text-foreground">{String(raw)}</span>;
  }
}

type RelatedRecordsWidgetProps = {
  config: RelatedRecordsConfig;
  parentId: BaseKey;
};

export function RelatedRecordsWidget({ config, parentId }: RelatedRecordsWidgetProps) {
  const limit = config.limit ?? 5;
  const { query, result } = useList<BaseRecord>({
    resource: config.resource,
    filters: [{ field: config.foreignKey, operator: "eq", value: parentId }],
    pagination: { currentPage: 1, pageSize: limit },
  });

  const rows = (result?.data ?? []) as BaseRecord[];
  const total = result?.total ?? 0;

  const columns = config.columns ?? [
    { id: "name", header: "Name", field: "name", kind: "text" as const },
    { id: "status", header: "Status", field: "status", kind: "chip" as const },
    { id: "createdAt", header: "Date", field: "createdAt", kind: "date" as const },
  ];

  const viewAllHref = config.viewAllHref ?? `/${config.resource}?${config.foreignKey}=${parentId}`;

  return (
    <Widget className="w-full">
      <Widget.Header>
        <Widget.Title>{config.label}</Widget.Title>
        {total > limit ? (
          <Widget.Description>
            {rows.length} of {total} shown
          </Widget.Description>
        ) : null}
      </Widget.Header>
      <Widget.Content className="p-0">
        {query.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted">No related records.</p>
          </div>
        ) : (
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label={config.label}>
                <Table.Header>
                  {columns.map((column) => (
                    <Table.Column key={column.id} isRowHeader={column.id === columns[0]!.id}>
                      {column.header}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {rows.map((row, index) => (
                    <Table.Row
                      key={String(row.id)}
                      className={index === rows.length - 1 ? "[&_td]:border-b-0" : ""}
                    >
                      {columns.map((column) => (
                        <Table.Cell key={column.id}>{renderCell(row, column)}</Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Widget.Content>
      {total > 0 ? (
        <Widget.Footer>
          <Link className="text-sm" href={viewAllHref}>
            View all
            <Link.Icon />
          </Link>
        </Widget.Footer>
      ) : null}
    </Widget>
  );
}
