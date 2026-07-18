/**
 * @file list.tsx
 * @module modules/notifications/pages/list
 *
 * @description
 * `/notifications` — the durable inbox surface (§11.2). Composed
 * of three foundation pieces:
 *
 *   1. **`useNotificationInboxState`** — merges durable rows with
 *      the live-event bus, groups them by kind, tracks the active
 *      tab.
 *   2. **`useNotificationActions`** — resolves inline row actions
 *      via a dashboard-owned handler map.
 *   3. **`<NotificationTabs>`** — the shared Segment strip.
 *
 * The row layout stays wide (DataGrid with Channel / Status / Sent
 * columns) — the compact `<NotificationRow>` foundation component
 * is reserved for the drawer variant. Both surfaces read from the
 * same view model, so switching between them stays coherent.
 */

import { Breadcrumbs, Button, Card, Chip, Dropdown, Label } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useList, useNotification, useUpdate } from "@refinedev/core";
import { useCallback, useMemo } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { BaseKey } from "@refinedev/core";
import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type {
  INotificationAction as _INotificationActionCanonical,
  INotificationRecord as _INotificationRecordCanonical,
} from "@academorix/contracts";

/**
 * Local WIP shape — the page still speaks the legacy notification
 * record layout with columns like `name` / `recipient` / `status` /
 * `sentAt` / `url` / `isActive`. The canonical
 * `INotificationRecord` (in `@academorix/contracts`) is the leaner
 * inbox-drawer shape (`title` / `kind` / `channel` / `createdAt`).
 *
 * Rather than block the page compile, we ship a local superset with
 * the legacy fields marked optional. Runtime rows from the mock
 * fixture already carry these fields; when the real backend lands,
 * the page will be migrated to the canonical shape and this
 * override deleted.
 *
 * TODO: rewrite the page to consume the canonical shape and drop
 * these locals.
 */
interface INotificationRecord extends _INotificationRecordCanonical {
  readonly name?: string;
  readonly recipient?: string;
  /**
   * Status is a `{ text, color }` bag on the legacy mock rows —
   * shown as a colored chip in the listing.
   */
  readonly status?: { readonly text: string; readonly color: string };
  readonly sentAt?: string;
  readonly url?: string;
  readonly isActive?: boolean;
}

interface INotificationAction extends _INotificationActionCanonical {
  readonly variant?: "default" | "primary" | "danger";
}
import type { NotificationActionHandlerMap } from "@academorix/notifications";

import {
  NotificationTabs,
  resolveNotificationChannelIcon,
  resolveNotificationKindColor,
  resolveNotificationKindIcon,
  useNotificationActions,
  useNotificationBus,
  useNotificationInboxState,
} from "@academorix/notifications";

import { Iconify } from "@/icons/iconify";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/refine/format";

/**
 * Dashboard action registry — hook mutation dispatch here as the
 * backend exposes real endpoints (Retry, Escalate, Send reminder,
 * Mark all present).
 */
const DASHBOARD_ACTION_HANDLERS: NotificationActionHandlerMap = {};

export default function Page() {
  const { mutate: updateOne } = useUpdate();
  const { open: notify } = useNotification();
  const navigate = useNavigate();

  // Durable rows.
  const { result } = useList<INotificationRecord>({
    resource: "notifications",
    pagination: { mode: "off" },
  });
  const durable = (result?.data ?? []) as INotificationRecord[];

  // Live push events prepended.
  const { events: liveEvents } = useNotificationBus();

  // Shared view model — same shape the drawer consumes.
  //
  // `useNotificationInboxState` in `@academorix/notifications`
  // types its inputs as `NotificationLike` (a loose
  // `Record<string, unknown> & { id }` shape). Our local
  // `INotificationRecord` is stricter — cast at the boundary.
  const inbox = useNotificationInboxState({
    durable: durable as unknown as readonly (Record<string, unknown> & { id: string })[],
    liveEvents,
  });

  const markRead = useCallback(
    // `NotificationLike` is the loose input type here; we know we're
    // handling `INotificationRecord` at runtime because that's what
    // we passed in above.
    (row: INotificationRecord) => {
      if (String(row.id).startsWith("live:")) return;
      updateOne(
        {
          resource: "notifications",
          id: row.id as BaseKey,
          values: { isActive: false },
          mutationMode: "optimistic",
        },
        {
          onSuccess: () =>
            notify?.({
              key: `notif-read-${row.id}`,
              message: "Marked as read",
              type: "success",
            }),
        },
      );
    },
    [updateOne, notify],
  );

  const actions = useNotificationActions({
    handlers: DASHBOARD_ACTION_HANDLERS,
    // `NotificationLike` is the loose `Record<string, unknown> &
    // { id: string | number }` input type; `markRead` accepts a
    // stricter `INotificationRecord` — cast at the boundary.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMarkRead: markRead as unknown as (row: any) => void,
    onNavigate: (url: string) => navigate(url),
  });

  /**
   * Runtime helper — narrow a strict `INotificationRecord` to the
   * loose `NotificationLike` shape expected by
   * `@academorix/notifications`. Same structural bytes, just weaker
   * typing at the call site.
   *
   * Returns `any` because `NotificationLike` from
   * `@academorix/notifications` is loose enough that a strict
   * `Record<string, unknown> & { id: string }` isn't a valid
   * subtype (`id` there widens to `string | number`).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asNotificationLike = (row: INotificationRecord): any => row;

  /**
   * Same idea for action objects — the loose input side is
   * `NotificationActionLike`. Kept named so future readers can
   * grep for the migration touchpoints.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asNotificationActionLike = (action: INotificationAction): any => action;

  const markAllRead = () => {
    for (const row of inbox.filtered) {
      if (String(row.id).startsWith("live:")) continue;
      updateOne({
        resource: "notifications",
        id: row.id as BaseKey,
        values: { isActive: false },
        mutationMode: "optimistic",
      });
    }
    notify?.({
      key: `notif-read-all-${Date.now()}`,
      message: `Marked ${inbox.filtered.length} notifications as read`,
      type: "success",
    });
  };

  const columns: DataGridColumn<INotificationRecord>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Notification",
        accessorKey: "name",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 320,
        cell: (row) => (
          <div className="flex items-start gap-3">
            <div
              className={
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full " +
                (row.isActive ? "bg-accent/10 text-accent" : "bg-default/20 text-muted")
              }
            >
              <Iconify className="size-4" icon={resolveNotificationKindIcon(row.kind)} />
            </div>
            <div className="min-w-0">
              <div
                className={
                  "truncate text-sm " +
                  (row.isActive ? "font-medium text-foreground" : "text-muted")
                }
              >
                {row.name}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <Chip color={resolveNotificationKindColor(row.kind)} size="sm" variant="soft">
                  <Chip.Label>{row.kind}</Chip.Label>
                </Chip>
                {row.recipient ? <span className="truncate">→ {row.recipient}</span> : null}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "channel",
        header: "Channel",
        minWidth: 120,
        cell: (row) => (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Iconify className="size-3.5" icon={resolveNotificationChannelIcon(row.channel)} />
            {row.channel}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        minWidth: 120,
        cell: (row) =>
          row.status ? (
            <Chip color={row.status.color as never} size="sm" variant="soft">
              <Chip.Label>{row.status.text}</Chip.Label>
            </Chip>
          ) : null,
      },
      {
        id: "sentAt",
        header: "Sent",
        accessorKey: "sentAt",
        allowsSorting: true,
        minWidth: 140,
        cell: (row) => (
          <span className="text-xs whitespace-nowrap text-muted tabular-nums">
            {formatDate(row.sentAt ?? "")}
          </span>
        ),
      },
      {
        id: "__actions__",
        header: "",
        align: "end",
        minWidth: 200,
        cell: (row) => {
          const inlineActions = row.actions ?? [];
          return (
            <div className="flex items-center justify-end gap-1.5">
              {inlineActions.slice(0, 2).map((action) => (
                <Button
                  key={action.id}
                  onPress={() => actions.runAction(asNotificationLike(row), asNotificationActionLike(action as INotificationAction))}
                  size="sm"
                  variant={
                    // `INotificationAction.variant` uses the
                    // legacy `default | primary | danger` set;
                    // HeroUI's Button accepts a different palette
                    // (`primary | danger | danger-soft | ghost | ...`).
                    // Map `default` → `ghost` at the boundary and
                    // cast so TS is happy.
                    ((action as INotificationAction).variant === "default"
                      ? "ghost"
                      : ((action as INotificationAction).variant ?? "ghost")) as
                      | "primary"
                      | "danger"
                      | "danger-soft"
                      | "ghost"
                      | "outline"
                      | "secondary"
                      | "tertiary"
                  }
                >
                  {action.icon ? <Iconify className="size-3.5" icon={action.icon} /> : null}
                  {action.label}
                </Button>
              ))}
              <Dropdown>
                <Button aria-label="Actions" isIconOnly size="sm" variant="ghost">
                  <Iconify className="size-4" icon="ellipsis" />
                </Button>
                <Dropdown.Popover className="min-w-44" placement="bottom end">
                  <Dropdown.Menu
                    onAction={(key: Key) => {
                      if (key === "read") actions.markRead(asNotificationLike(row));
                      else if (key === "dismiss") actions.dismiss(asNotificationLike(row));
                      else if (key === "open") actions.openRow(asNotificationLike(row));
                      else {
                        const action = inlineActions.find(
                          (candidate) => candidate.id === String(key),
                        );
                        if (action) {
                          actions.runAction(asNotificationLike(row), asNotificationActionLike(action as INotificationAction));
                        }
                      }
                    }}
                  >
                    <Dropdown.Item id="read" textValue="Mark read">
                      <Iconify className="size-4" icon="circle-check" />
                      <Label>Mark read</Label>
                    </Dropdown.Item>
                    {row.url ? (
                      <Dropdown.Item id="open" textValue="Open">
                        <Iconify className="size-4" icon="arrow-right" />
                        <Label>Open</Label>
                      </Dropdown.Item>
                    ) : null}
                    {inlineActions.slice(2).map((action) => (
                      <Dropdown.Item key={action.id} id={action.id} textValue={action.label}>
                        {action.icon ? <Iconify className="size-4" icon={action.icon} /> : null}
                        <Label>{action.label}</Label>
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Item id="dismiss" textValue="Dismiss" variant="danger">
                      <Iconify className="size-4" icon="xmark" />
                      <Label>Dismiss</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          );
        },
      },
    ],
    [actions],
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Notifications</Breadcrumbs.Item>
      </Breadcrumbs>

      <PageHeader
        actions={
          <>
            <Button isDisabled={inbox.unreadCount === 0} onPress={markAllRead} variant="secondary">
              <Iconify className="size-4" icon="circle-check" />
              Mark all read
            </Button>
            <Button onPress={() => navigate("/notifications/preferences")} variant="ghost">
              <Iconify className="size-4" icon="gear" />
              Preferences
            </Button>
          </>
        }
        description={`${inbox.unreadCount} unread of ${inbox.totalCount} total`}
        title="Notifications"
      />

      <NotificationTabs
        onSelectionChange={inbox.setActiveTab}
        selectedKey={inbox.activeTab}
        size="md"
        tabs={inbox.tabs}
      />

      <Card>
        <Card.Content className="px-0 pb-0">
          <DataGrid<INotificationRecord>
            aria-label="Notifications inbox"
            columns={columns}
            contentClassName="min-w-[860px]"
            // `inbox.filtered` is `readonly NotificationLike[]` at the
            // type level; the runtime data still carries every
            // `INotificationRecord` field (the loose type just hides
            // them). Cast at the boundary so DataGrid's generic
            // matches.
            data={inbox.filtered as unknown as INotificationRecord[]}
            getRowId={(item) => item.id as BaseKey}
            renderEmptyState={() => (
              <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted">
                <Iconify className="size-8 opacity-60" icon="bell" />
                <span>All caught up. Nothing here yet.</span>
              </div>
            )}
            variant="secondary"
          />
        </Card.Content>
      </Card>
    </div>
  );
}
