/**
 * @file generic-show-page.tsx
 * @module components/generic-show-page
 *
 * @description
 * The canonical detail-page shell (§6). Renders:
 * - Breadcrumbs
 * - Header with avatar + title + subtitle + primary / secondary / overflow actions
 * - Status chip strip
 * - Tabs (Overview / Activity / Settings — override via `meta.detailTabs`)
 * - Two-column body: main content + right-hand metadata rail
 * - Activity Timeline (compact) fed by a synthetic event set until the audit
 *   log lands.
 */

import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Skeleton,
  Tabs,
} from "@heroui/react";
import { Timeline } from "@heroui-pro/react";
import { useDelete, useNavigation, useNotification, useShow } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "@stackra/routing/react";

import type { AppResourceMeta, DetailTabConfig } from "@/lib/module";
import type { BaseKey, BaseRecord } from "@refinedev/core";
import type { Key, ReactNode } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { JsonView } from "@/components/json-view";
import { RelatedRecordsWidget } from "@/components/related-records-widget";
import { useDetailShortcuts } from "@/hooks/use-datagrid-shortcuts";
import { Iconify } from "@/icons/iconify";
import { formatDate } from "@/refine/format";
import { pushRecentRecord } from "@/lib/recent-records";
import { singularize } from "@/lib/singularize";
import { appResources } from "@/modules/registry";

type GenericShowPageProps = {
  backHref: string;
  resource: string;
  title: string;
};

/**
 * The stock tab set rendered by {@link GenericShowPage} when a
 * module manifest doesn't declare its own `meta.detailTabs`.
 *
 * The `"json"` tab exposes the raw record as syntax-highlighted
 * JSON (MedusaJS-style) so operators can spot fields the UI
 * doesn't surface yet. It's the last tab so the info-density
 * ramps naturally: Overview (curated) → Activity (timeline) →
 * Settings (danger zone) → JSON (everything).
 */
const DEFAULT_TABS: DetailTabConfig[] = [
  { id: "overview", label: "Overview", icon: "square-list-ul" },
  { id: "activity", label: "Activity", icon: "clock" },
  { id: "settings", label: "Settings", icon: "gear" },
  { id: "json", label: "JSON", icon: "code" },
];

const OMIT_FROM_METADATA = new Set(["id", "avatar", "createdAt", "updatedAt"]);

function pickTitle(record: Record<string, unknown> | undefined): string | undefined {
  if (!record) return undefined;
  for (const key of ["fullName", "name", "title", "label", "clusterId"]) {
    const v = record[key];

    if (typeof v === "string" && v.trim()) return v;
  }

  return undefined;
}

function pickStatus(record: Record<string, unknown> | undefined) {
  if (!record) return undefined;
  const s = record["status"];

  if (s && typeof s === "object") {
    const obj = s as Record<string, unknown>;

    return {
      text: String(obj.text ?? ""),
      color: (obj.color as "success" | "warning" | "danger" | "accent" | "default") ?? "accent",
    };
  }
  if (typeof s === "string" && s) return { text: s, color: "accent" as const };
  if (typeof record["isActive"] === "boolean") {
    return record["isActive"]
      ? { text: "Active", color: "success" as const }
      : { text: "Inactive", color: "default" as const };
  }

  return undefined;
}

function formatValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    return String(
      record.text ?? record.title ?? record.fullName ?? record.name ?? JSON.stringify(value),
    );
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);

  return String(value);
}

function humanize(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function buildTimeline(record: Record<string, unknown> | undefined) {
  if (!record) return [];
  const created = record["createdAt"];
  const updated = record["updatedAt"];
  const entries: {
    status: "success" | "current" | "default" | "muted";
    title: string;
    time: string;
    icon: string;
  }[] = [];

  if (typeof updated === "string") {
    entries.push({
      status: "current",
      title: "Record updated",
      time: formatDate(updated),
      icon: "pencil",
    });
  }
  if (typeof created === "string") {
    entries.push({
      status: "success",
      title: "Record created",
      time: formatDate(created),
      icon: "circle-check",
    });
  }
  entries.push({ status: "muted", title: "Loaded into workspace", time: "Just now", icon: "eye" });

  return entries;
}

export function GenericShowPage({ backHref, resource, title }: GenericShowPageProps) {
  const { id: idParam } = useParams();
  const { list, edit } = useNavigation();
  const { mutate: deleteOne } = useDelete();
  const { open: notify } = useNotification();
  const { query, result } = useShow<BaseRecord>({ resource });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Key>("overview");

  const meta = appResources.find((r) => r.name === resource)?.meta as AppResourceMeta | undefined;
  const singular = meta?.singularLabel ?? singularize(title);
  const tabs = meta?.detailTabs ?? DEFAULT_TABS;
  const record = (result ?? undefined) as Record<string, unknown> | undefined;
  const isLoading = query.isLoading;
  const displayName = pickTitle(record) ?? `${singular} #${idParam ?? ""}`;
  const status = pickStatus(record);
  const avatarUrl = (record?.["avatar"] as { url?: string }[] | undefined)?.[0]?.url;

  const canEdit = meta?.crud !== "read-only" && meta?.crud !== "list-only" && meta?.crud !== "none";

  // Push this record into the recents list on first successful load.
  useEffect(() => {
    if (!record || !idParam) return;
    pushRecentRecord({
      resource,
      id: String(idParam),
      label: displayName,
      icon: meta?.icon,
    });
  }, [record, idParam, resource, displayName, meta?.icon]);

  const metadataEntries = record
    ? Object.entries(record)
        .filter(
          ([key, value]) => !OMIT_FROM_METADATA.has(key) && key !== "status" && value !== undefined,
        )
        .slice(0, 10)
    : [];

  const timelineEvents = buildTimeline(record);

  const handleDelete = () => {
    deleteOne(
      { resource, id: idParam as BaseKey },
      {
        onSuccess: () => {
          notify?.({ key: `${resource}-delete`, message: `${singular} deleted`, type: "success" });
          list(resource);
        },
        onError: (err) =>
          notify?.({
            key: `${resource}-delete-err`,
            message: `Couldn't delete ${singular.toLowerCase()}`,
            description: err?.message,
            type: "error",
          }),
      },
    );
  };

  // -------------------------------------------------------------------------
  // Detail-page keyboard shortcuts (§13.2)
  //
  //   1..9  — jump to tab N (0-indexed against `tabs`)
  //   E     — edit (only when the resource allows edit)
  //   Del   — open the delete confirmation dialog
  //
  // Shortcuts are ignored when a form control has focus so the user can
  // still type freely inside inputs / textareas. See
  // `useDetailShortcuts` for the containment logic.
  // -------------------------------------------------------------------------
  const handleTabByIndex = useCallback(
    (index: number) => {
      const tab = tabs[index];

      if (tab) setActiveTab(tab.id);
    },
    [tabs],
  );

  const handleShortcutEdit = useCallback(() => {
    if (!canEdit || !idParam) return;
    edit(resource, idParam as BaseKey);
  }, [canEdit, edit, resource, idParam]);

  const handleShortcutDelete = useCallback(() => {
    if (!canEdit) return;
    setConfirmOpen(true);
  }, [canEdit]);

  // `options` object identity matters — memoise so the hook doesn't
  // re-bind the window listener on every render.
  const shortcutOptions = useMemo(
    () => ({
      onTabByIndex: handleTabByIndex,
      onEdit: handleShortcutEdit,
      onDelete: handleShortcutDelete,
    }),
    [handleTabByIndex, handleShortcutEdit, handleShortcutDelete],
  );

  useDetailShortcuts(shortcutOptions);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href={backHref}>{title}</Breadcrumbs.Item>
        <Breadcrumbs.Item>{displayName}</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 shrink-0" color="accent" size="lg">
            {avatarUrl ? <Avatar.Image alt={displayName} src={avatarUrl} /> : null}
            <Avatar.Fallback>{displayName.slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading ? <Skeleton className="inline-block h-7 w-56 rounded-md" /> : displayName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isLoading ? (
                <Skeleton className="inline-block h-4 w-40 rounded-md" />
              ) : (
                <>
                  {singular}
                  {record?.["createdAt"] ? (
                    <> · Created {formatDate(String(record["createdAt"]))}</>
                  ) : null}
                </>
              )}
            </p>
            {status ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip color={status.color} size="sm" variant="soft">
                  <Chip.Label>{status.text}</Chip.Label>
                </Chip>
                {meta?.scopes?.map((scope) => (
                  <Chip key={scope} size="sm" variant="secondary">
                    <Chip.Label className="capitalize">{scope}</Chip.Label>
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/*
           * WHY the Back button lives at the START of the header
           * actions row: users reading a detail page most often
           * want to return to the list they came from — surfacing
           * that action inline (instead of burying it in the
           * overflow dropdown) mirrors GitHub / Linear / Notion.
           * Keeping the ⋮ dropdown reserved for edit + delete
           * gives operators a lighter, more scannable overflow.
           */}
          <Button onPress={() => list(resource)} variant="ghost">
            <Iconify className="size-4" icon="arrow-left" />
            Back to {title.toLowerCase()}
          </Button>
          {canEdit ? (
            <Button onPress={() => edit(resource, idParam as BaseKey)} variant="primary">
              <Iconify className="size-4" icon="pencil" />
              Edit
            </Button>
          ) : null}
          <Dropdown>
            <Button aria-label="More actions" isIconOnly size="md" variant="ghost">
              <Iconify className="size-4" icon="ellipsis" />
            </Button>
            <Dropdown.Popover className="min-w-44" placement="bottom end">
              <Dropdown.Menu>
                {/*
                 * WHY the dropdown no longer carries "Back to list":
                 * the Back action was promoted to a first-class
                 * ghost button above. The overflow menu is now
                 * reserved for destructive + future secondary
                 * actions so operators don't have to scan four
                 * items to find "Delete".
                 */}
                {canEdit ? (
                  <Dropdown.Item
                    id="delete"
                    onAction={() => setConfirmOpen(true)}
                    textValue="Delete"
                    variant="danger"
                  >
                    <Iconify className="size-4" icon="trash-bin" />
                    <Label>Delete</Label>
                  </Dropdown.Item>
                ) : null}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>

      {/* Tabs */}
      <Tabs onSelectionChange={setActiveTab} selectedKey={String(activeTab)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label={`${singular} sections`}>
            {tabs.map((tab, index) => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                {index > 0 ? <Tabs.Separator /> : null}
                {/*
                 * WHY the inline-flex wrapper: `Tabs.Tab` renders
                 * its children in a horizontal flex slot but has
                 * no built-in gap between the icon and the label
                 * — the two render flush together (`📋Overview`)
                 * without breathing room. A dedicated
                 * `inline-flex items-center gap-1.5` container
                 * inserts a 6px gap without touching the parent
                 * layout, keeps the tab's own focus ring intact,
                 * and does the right thing for icon-less tabs
                 * too (the gap collapses when there's no icon).
                 */}
                <span className="inline-flex items-center gap-1.5">
                  {tab.icon ? <Iconify className="size-4" icon={tab.icon} /> : null}
                  {tab.label}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-6" id="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main column */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card>
                <Card.Header>
                  <Card.Title>Profile</Card.Title>
                  <Card.Description>
                    Snapshot of the key attributes for this {singular.toLowerCase()}.
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  {isLoading ? (
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-6 w-full rounded-md" />
                      ))}
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      {metadataEntries.map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <dt className="text-xs tracking-wide text-muted uppercase">
                            {humanize(key)}
                          </dt>
                          <dd className="text-sm break-words text-foreground">
                            {formatValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Recent activity</Card.Title>
                  <Card.Description>Latest changes on this record.</Card.Description>
                </Card.Header>
                <Card.Content>
                  <Timeline density="compact" size="sm">
                    {timelineEvents.map((event) => (
                      <Timeline.Item key={event.title} align="center" status={event.status}>
                        <Timeline.Marker aria-hidden="true">
                          <Iconify className="size-4" icon={event.icon} />
                        </Timeline.Marker>
                        <Timeline.Content>
                          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <h3 className="m-0 text-sm leading-5 font-medium text-foreground">
                              {event.title}
                            </h3>
                            <time className="shrink-0 text-xs leading-5 text-muted">
                              {event.time}
                            </time>
                          </div>
                        </Timeline.Content>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card.Content>
              </Card>

              {meta?.relatedRecords?.map((config) => (
                <RelatedRecordsWidget
                  key={config.id}
                  config={config}
                  parentId={idParam as BaseKey}
                />
              ))}
            </div>

            {/* Metadata side rail */}
            <div className="flex flex-col gap-4">
              <Card>
                <Card.Header>
                  <Card.Title>Quick facts</Card.Title>
                </Card.Header>
                <Card.Content className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">ID</span>
                    <span className="font-mono text-foreground tabular-nums">
                      #{String(idParam ?? "")}
                    </span>
                  </div>
                  {record?.["createdAt"] ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Created</span>
                      <span className="text-foreground">
                        {formatDate(String(record["createdAt"]))}
                      </span>
                    </div>
                  ) : null}
                  {record?.["updatedAt"] ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Updated</span>
                      <span className="text-foreground">
                        {formatDate(String(record["updatedAt"]))}
                      </span>
                    </div>
                  ) : null}
                  {meta?.groupKey ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Group</span>
                      <span className="text-foreground capitalize">{meta.groupKey}</span>
                    </div>
                  ) : null}
                </Card.Content>
              </Card>

              {meta?.description ? (
                <Card>
                  <Card.Header>
                    <Card.Title>About</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm leading-relaxed text-muted">{meta.description}</p>
                  </Card.Content>
                </Card>
              ) : null}
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel className="pt-6" id="activity">
          <Card>
            <Card.Header>
              <Card.Title>Activity log</Card.Title>
              <Card.Description>
                Chronological feed of every change on this {singular.toLowerCase()}.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <Timeline density="compact" size="sm">
                {timelineEvents.map((event) => (
                  <Timeline.Item key={event.title} align="center" status={event.status}>
                    <Timeline.Marker aria-hidden="true">
                      <Iconify className="size-4" icon={event.icon} />
                    </Timeline.Marker>
                    <Timeline.Content>
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <h3 className="m-0 text-sm leading-5 font-medium text-foreground">
                          {event.title}
                        </h3>
                        <time className="shrink-0 text-xs leading-5 text-muted">{event.time}</time>
                      </div>
                    </Timeline.Content>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card.Content>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel className="pt-6" id="settings">
          <Card>
            <Card.Header>
              <Card.Title>Settings</Card.Title>
              <Card.Description>
                Advanced controls for this {singular.toLowerCase()}. Danger zone lives here — always
                confirm.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-danger/40 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Delete this {singular.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted">
                      This permanently removes the record and detaches any linked data. Cannot be
                      undone.
                    </p>
                  </div>
                  <Button onPress={() => setConfirmOpen(true)} variant="danger-soft">
                    <Iconify className="size-4" icon="trash-bin" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        </Tabs.Panel>

        {/*
         * WHY the JSON panel renders unconditionally: the parent
         * `Tabs` component only surfaces panels whose `id` matches
         * a `Tabs.Tab`. Modules that override `meta.detailTabs`
         * without a `json` entry never render this panel — the
         * output tree stays lean. Modules that keep the default
         * tab set (or explicitly include `{id: "json"}`) get the
         * MedusaJS-style structured view for free.
         */}
        <Tabs.Panel className="pt-6" id="json">
          <JsonView defaultOpen title="Record data" value={record ?? {}} />
        </Tabs.Panel>
      </Tabs>

      <ConfirmDialog
        confirmLabel={`Delete ${singular.toLowerCase()}`}
        description={`This permanently removes ${displayName}. Linked records will be detached. This action cannot be undone.`}
        isDestructive
        isOpen={confirmOpen}
        onConfirm={handleDelete}
        onOpenChange={setConfirmOpen}
        title={`Delete ${singular.toLowerCase()}`}
      />
    </div>
  );
}

export default GenericShowPage;
