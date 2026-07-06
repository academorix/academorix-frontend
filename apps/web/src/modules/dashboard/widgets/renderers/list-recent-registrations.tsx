/**
 * @file list-recent-registrations.tsx
 * @module modules/dashboard/widgets/renderers/list-recent-registrations
 *
 * @description
 * Overview widget: the five most recent registrations, rendered inside a
 * `Widget` container with a footer link to the full listing. Uses the mock
 * fixture today; once the backend ships an aggregate endpoint the shape stays
 * the same and only the source resource changes.
 */

import { UserPlusIcon } from "@academorix/ui/icons/outline";
import { Chip, Link, Skeleton, Widget } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

/** Registration-shaped fields we consume for the widget row. */
interface RegistrationLike extends BaseRecord {
  athlete_name?: string;
  athlete?: { name?: string };
  status?: string;
  created_at?: string;
  submitted_at?: string;
  sport_key?: string;
}

/** Formats a date for display. Falls back to raw string on parse failure. */
function formatDate(input: string | undefined): string {
  if (!input) {
    return "-";
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Maps a status string to a soft chip colour. Anything unrecognised falls
 * back to the neutral default.
 */
function statusColor(status: string | undefined): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "approved":
    case "enrolled":
      return "success";
    case "pending":
    case "trial":
    case "offered":
      return "warning";
    case "rejected":
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}

/** Overview widget: recent registrations list. */
export default function ListRecentRegistrationsWidget(): ReactNode {
  const { result, query } = useList<RegistrationLike>({
    resource: "registrations",
    pagination: { currentPage: 1, pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const rows = result.data ?? [];

  return (
    <Widget className="h-full">
      <Widget.Header>
        <Widget.Title>Recent registrations</Widget.Title>
        <Widget.Description>The five most recent registrations.</Widget.Description>
      </Widget.Header>
      <Widget.Content>
        {query.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
            <UserPlusIcon aria-hidden="true" className="size-4" />
            No registrations yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {rows.map((row) => {
              const name = row.athlete_name ?? row.athlete?.name ?? "Unnamed athlete";
              const submitted = row.submitted_at ?? row.created_at;

              return (
                <li
                  key={String(row.id)}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-default/50"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted">{formatDate(submitted)}</span>
                  </div>
                  <Chip color={statusColor(row.status)} size="sm" variant="soft">
                    <Chip.Label className="capitalize">{row.status ?? "pending"}</Chip.Label>
                  </Chip>
                </li>
              );
            })}
          </ul>
        )}
      </Widget.Content>
      <Widget.Footer>
        <Link className="text-sm" href="/registrations">
          View all registrations
        </Link>
      </Widget.Footer>
    </Widget>
  );
}
