/**
 * @file recent-activity.tsx
 * @module components/dashboard/recent-activity
 *
 * @description
 * "Recent activity" widget — a compact tenant-wide activity feed
 * backed by `spatie/laravel-activitylog` server-side (see the
 * `Activity` module). Reads the feed via {@link useRecentActivity}.
 *
 * ## Source
 *
 * In production the widget reads `GET /api/v1/activities` — every
 * domain module logs semantic events (`activity()->log('…')`) at
 * write sites. In dev without an auth token, the hook falls back
 * to the local fixture so component work still renders.
 *
 * ## Row shape
 *
 * `event` tags drive both the coloured chip on the right and the
 * icon on the left when `properties.icon` is omitted server-side.
 * A best-effort `formatRelativeTime` renders "2 min ago" from ISO
 * timestamps; anything that fails to parse (e.g. the fixture's
 * pre-formatted strings) falls through verbatim.
 */

import { Card, Chip, Spinner } from "@heroui/react";

import type { ReactNode } from "react";
import type { ActivityEntry } from "@/lib/api/auth-api";

import { Iconify } from "@/icons/iconify";
import { useRecentActivity } from "@/hooks/use-recent-activity";

/**
 * Map an activity event tag to a Chip colour. Falls back to
 * `default` for unknown events so a newly-added event type never
 * crashes the widget.
 */
function chipColorFor(event: string): "accent" | "success" | "warning" | "danger" | "default" {
  switch (event) {
    case "created":
    case "registration":
      return "accent";
    case "paid":
    case "payment":
    case "attendance":
    case "completed":
      return "success";
    case "assigned":
    case "safeguarding":
      return "warning";
    case "deleted":
      return "danger";
    default:
      return "default";
  }
}

/**
 * Format an ISO timestamp as a relative "N ago" string. Falls back
 * to the input verbatim when the value doesn't parse — lets the
 * dev fixture's pre-formatted strings ("2 min ago") render as-is.
 */
function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);

  if (!Number.isFinite(then)) return iso;

  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172_800) return "yesterday";
  if (seconds < 30 * 86_400) return `${Math.floor(seconds / 86_400)}d ago`;

  return new Date(then).toISOString().slice(0, 10);
}

function ActivityRow({ entry }: { entry: ActivityEntry }): ReactNode {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted"
      >
        <Iconify className="size-4" icon={entry.icon ?? "circle-info"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{entry.description}</p>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Chip color={chipColorFor(entry.event)} size="sm" variant="soft">
            <Chip.Label className="capitalize">{entry.log_name ?? entry.event}</Chip.Label>
          </Chip>
          {entry.subject_label ? (
            <p className="truncate text-xs text-muted">{entry.subject_label}</p>
          ) : entry.causer_name ? (
            <p className="truncate text-xs text-muted">by {entry.causer_name}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function RecentActivity(): ReactNode {
  const { entries, isLoading, error } = useRecentActivity();

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-base">Recent activity</Card.Title>
        <Card.Description className="text-sm text-muted">
          Registrations, payments, attendance across every branch.
        </Card.Description>
      </Card.Header>
      <Card.Content className="pt-0">
        {isLoading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Spinner color="accent" size="md" />
          </div>
        ) : error && entries.length === 0 ? (
          <div className="flex items-start gap-2 py-3 text-xs text-muted">
            <Iconify className="mt-0.5 size-3.5" icon="circle-info" />
            <span>{error.message}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted">
            <Iconify className="size-6" icon="clock" />
            <p>No activity yet. Everything you do here will show up in this feed.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
