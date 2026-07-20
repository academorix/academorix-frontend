/**
 * @file inbox-page.component.tsx
 * @module @stackra/notifications/react/pages
 * @description Full-page inbox route.
 *
 *   Renders the same section tabs + category chips + list machinery
 *   the drawer uses, at page scale. Consumers mount this at their
 *   chosen route path.
 */

import { useMemo, useState, type ReactElement } from "react";
import { Button, Chip } from "@stackra/ui/react";
import { CheckIcon, Cog6ToothIcon } from "@stackra/ui/icons/heroicon/outline";

import { NOTIFICATION_CATEGORIES } from "@/core/constants";
import type { IRenderableNotification } from "@/core/interfaces";
import { useNotificationWrites } from "../../hooks/use-notification-writes";
import { useRenderableNotifications } from "../../hooks/use-renderable-notifications";
import { NotificationList } from "../../components/notification-list";
import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
} from "../../components/notification-drawer";
import type { InboxPageProps } from "./inbox-page.interface";

/** Category filter chips — identical shape to the drawer's. */
const CATEGORY_FILTERS: readonly {
  readonly key: NotificationDrawerCategoryFilter;
  readonly label: string;
}[] = [
  { key: "all", label: "All" },
  ...(Object.values(NOTIFICATION_CATEGORIES).map((c) => ({
    key: c.key,
    label: c.label,
  })) as readonly {
    readonly key: NotificationDrawerCategoryFilter;
    readonly label: string;
  }[]),
];

/**
 * Filter helper — mirrors the drawer's own matcher.
 */
function matchesCategory(
  entry: IRenderableNotification,
  category: NotificationDrawerCategoryFilter,
): boolean {
  if (category === "all") return true;
  return entry.notification.payload.category === category;
}

/**
 * The full-page inbox.
 *
 * @example
 * ```tsx
 * import { InboxPage } from '@stackra/notifications/react';
 *
 * // Route at /notifications
 * function NotificationsRoute() {
 *   return <InboxPage onOpenPreferences={() => navigate('/notifications/preferences')} />;
 * }
 * ```
 */
export function InboxPage({
  writer,
  onOpenPreferences,
  className,
}: InboxPageProps = {}): ReactElement {
  const { entries, unreadCount } = useRenderableNotifications();
  const { markAllSeen } = useNotificationWrites(writer);
  const [section, setSection] = useState<NotificationDrawerSection>("unread");
  const [category, setCategory] = useState<NotificationDrawerCategoryFilter>("all");

  const filtered = useMemo<readonly IRenderableNotification[]>(() => {
    return entries.filter((entry) => {
      if (entry.isSnoozed) return false;
      if (section === "unread" && entry.isRead) return false;
      if (!matchesCategory(entry, category)) return false;
      return true;
    });
  }, [entries, section, category]);

  return (
    <div
      className={`flex flex-col gap-4 p-6${className ? ` ${className}` : ""}`}
      data-notifications-inbox-page=""
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-xl font-semibold">Inbox</h1>
          <p className="text-muted text-sm">
            {unreadCount === 0
              ? "You're up to date."
              : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenPreferences ? (
            <Button
              size="sm"
              variant="tertiary"
              aria-label="Notification preferences"
              onPress={onOpenPreferences}
            >
              <Cog6ToothIcon aria-hidden="true" className="size-4" />
              Preferences
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            isDisabled={unreadCount === 0}
            aria-label="Mark all as read"
            onPress={() => {
              void markAllSeen();
            }}
          >
            <CheckIcon aria-hidden="true" className="size-4" />
            Mark all read
          </Button>
        </div>
      </header>

      <div className="border-border flex flex-col gap-3 border-b pb-3">
        <div
          aria-label="Sections"
          className="bg-surface-secondary inline-flex rounded-lg p-0.5"
          role="tablist"
        >
          {[
            {
              key: "unread" as const,
              label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { key: "all" as const, label: "All" },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={section === tab.key}
              className={
                section === tab.key
                  ? "bg-surface text-foreground shadow-surface rounded-md px-3 py-1 text-sm font-medium"
                  : "text-muted hover:text-foreground rounded-md px-3 py-1 text-sm"
              }
              onClick={() => setSection(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div aria-label="Category filters" className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((filter) => {
            const isActive = category === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={isActive}
                className="focus-visible:ring-accent focus:outline-none focus-visible:ring-2"
                onClick={() => setCategory(filter.key)}
              >
                <Chip
                  color={isActive ? "accent" : "default"}
                  size="sm"
                  variant={isActive ? "primary" : "secondary"}
                >
                  <Chip.Label>{filter.label}</Chip.Label>
                </Chip>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border bg-surface min-h-[400px] rounded-xl border">
        <NotificationList emptyVariant="page" entries={filtered} writer={writer} />
      </div>
    </div>
  );
}
