/**
 * @file notification-drawer.component.tsx
 * @module @stackra/notifications/react/components
 * @description Right-hand HeroUI Drawer that opens from the navbar
 *   bell.
 *
 *   Hosts every inbox interaction outside the full-page
 *   `/notifications` route:
 *
 *     - Header: title + unread count + "Mark all read".
 *     - Push permission banner (auto-hidden when granted / denied).
 *     - Section tabs (Unread / All) + category chips + channel
 *       chips.
 *     - Scrolling list.
 *     - Footer: optional "Notification preferences" link.
 *
 *   Fully controlled by the parent — a future Cmd-K action can open
 *   the drawer without wiring extra state.
 */

import { useMemo, useState, type ReactElement } from "react";
import { Button, Chip, Drawer } from "@stackra/ui/react";
import { CheckIcon, Cog6ToothIcon } from "@stackra/ui/icons/heroicon/outline";

import { NOTIFICATION_CATEGORIES } from "@/core/constants";
import type { IRenderableNotification } from "@/core/interfaces";
import { useRenderableNotifications } from "../../hooks/use-renderable-notifications";
import { useNotificationWrites } from "../../hooks/use-notification-writes";
import { NotificationList } from "../notification-list";
import { PushPermissionBanner } from "../push-permission-banner";
import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerProps,
  NotificationDrawerSection,
} from "./notification-drawer.interface";

/** The category chips the drawer exposes. */
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
 * Match an entry against the current category filter.
 *
 * `'all'` matches everything. Otherwise the entry's own
 * `payload.category` must equal the selected chip.
 */
function matchesCategory(
  entry: IRenderableNotification,
  category: NotificationDrawerCategoryFilter,
): boolean {
  if (category === "all") return true;
  return entry.notification.payload.category === category;
}

/**
 * The drawer.
 *
 * @example
 * ```tsx
 * import { NotificationDrawer } from '@stackra/notifications/react';
 * const [open, setOpen] = useState(false);
 * <NotificationDrawer isOpen={open} onOpenChange={setOpen} />
 * ```
 */
export function NotificationDrawer({
  isOpen,
  onOpenChange,
  writer,
  onOpenPreferences,
}: NotificationDrawerProps): ReactElement {
  const { entries, unreadCount } = useRenderableNotifications();
  const { markAllSeen } = useNotificationWrites(writer);

  // Local filter state — reset when the drawer closes is intentional
  // (the drawer is transient; a saved filter would leak between
  // navigations).
  const [section, setSection] = useState<NotificationDrawerSection>("unread");
  const [category, setCategory] = useState<NotificationDrawerCategoryFilter>("all");

  // Filter pipeline — hide snoozed, apply section + category.
  const filtered = useMemo<readonly IRenderableNotification[]>(() => {
    return entries.filter((entry) => {
      if (entry.isSnoozed) return false;
      if (section === "unread" && entry.isRead) return false;
      if (!matchesCategory(entry, category)) return false;
      return true;
    });
  }, [entries, section, category]);

  const handleMarkAll = (): void => {
    void markAllSeen();
  };

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="flex h-full w-full max-w-md flex-col md:w-[420px]">
          <Drawer.CloseTrigger />
          <Drawer.Header className="border-border flex items-center justify-between gap-3 border-b pb-3">
            <div className="flex min-w-0 flex-col">
              <Drawer.Heading>Notifications</Drawer.Heading>
              <span className="text-muted text-xs">
                {unreadCount === 0
                  ? "No unread"
                  : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={unreadCount === 0}
              aria-label="Mark all as read"
              onPress={handleMarkAll}
              data-notifications-drawer-mark-all=""
            >
              <CheckIcon aria-hidden="true" className="size-4" />
              Mark all read
            </Button>
          </Drawer.Header>

          <PushPermissionBanner />

          <div className="border-border flex flex-col gap-3 border-b px-4 py-3">
            {/*
              Section tabs — kept as a bare-bones segmented control
              on top of HeroUI Chips so the compound stays
              accessible without introducing a heavier segment
              component. Tailwind layout classes only — no
              custom class names.
            */}
            <div
              aria-label="Sections"
              className="bg-surface-secondary inline-flex rounded-lg p-0.5"
              role="tablist"
              data-notifications-drawer-sections=""
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

            {/* Category filter chips — HeroUI `Chip` inside a
                button wrapper for the pressed state, following the
                ref implementation. */}
            <div
              aria-label="Category filters"
              className="flex flex-wrap gap-1.5"
              data-notifications-drawer-categories=""
            >
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

          <Drawer.Body className="flex-1 p-0">
            <NotificationList
              entries={filtered}
              onRowAction={() => onOpenChange(false)}
              writer={writer}
              emptyVariant="drawer"
            />
          </Drawer.Body>

          {onOpenPreferences ? (
            <Drawer.Footer className="border-border border-t">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => {
                  onOpenChange(false);
                  onOpenPreferences();
                }}
              >
                <Cog6ToothIcon aria-hidden="true" className="size-4" />
                Notification preferences
              </Button>
            </Drawer.Footer>
          ) : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
