/**
 * @file list.tsx
 * @module modules/offline-sync/pages/list
 *
 * @description
 * Offline & sync surface — communicates the app's offline affordances: which
 * areas capture data offline, the current connectivity state, and any changes
 * queued to sync. The pending queue is read from the `sync-queue` fixture.
 */

import { Card, Chip, Separator } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { SyncItem } from "@/modules/offline-sync/offline-sync.types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { Breadcrumbs } from "@/components/refine";
import { formatDateTime } from "@/lib/format";

/** Areas of the app that capture data while offline. */
const OFFLINE_CAPABLE_AREAS: { title: string; description: string }[] = [
  {
    title: "Attendance capture",
    description: "Mark present/absent pitch-side; marks queue and sync when back online.",
  },
  {
    title: "Progress notes",
    description: "Record skill-card assessments without a connection.",
  },
  {
    title: "Event RSVPs",
    description: "Collect RSVPs at the venue; they reconcile on reconnect.",
  },
];

/** The offline & sync status page. */
export default function OfflineSync(): ReactNode {
  const { result: queueResult } = useList<SyncItem>({
    resource: "sync-queue",
    pagination: { mode: "off" },
  });

  const pending = queueResult?.data ?? [];

  return (
    <ResourceAccessGuard action="list" resource="offline-sync">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Offline &amp; Sync</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <Card.Content className="flex flex-col gap-1 py-5">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                Connectivity
              </span>
              <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <span aria-hidden="true" className="size-2 rounded-full bg-success" />
                Online
              </span>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex flex-col gap-1 py-5">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                Pending changes
              </span>
              <span className="text-lg font-semibold text-foreground">{pending.length}</span>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex flex-col gap-1 py-5">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                Last synced
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatDateTime(pending[0]?.captured_at ?? "2026-06-30T08:10:00Z")}
              </span>
            </Card.Content>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>Offline-capable areas</Card.Title>
            <Card.Description>These surfaces keep working without a connection.</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-4">
              {OFFLINE_CAPABLE_AREAS.map((area) => (
                <li key={area.title} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{area.title}</span>
                  <span className="text-sm text-muted">{area.description}</span>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Pending sync queue</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted">All changes are synced.</p>
            ) : (
              pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-default/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{item.summary}</span>
                    <span className="text-xs text-muted">
                      {item.captured_by ?? "Unknown"} · {formatDateTime(item.captured_at)}
                    </span>
                  </div>
                  <Chip color="warning" size="sm" variant="soft">
                    {item.entity}
                  </Chip>
                </div>
              ))
            )}
          </Card.Content>
        </Card>
      </div>
    </ResourceAccessGuard>
  );
}
