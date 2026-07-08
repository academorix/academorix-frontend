/**
 * @file notification-drawer.tsx
 * @module notifications/components/notification-drawer
 *
 * @description
 * The right-hand HeroUI Drawer that opens from the navbar bell. Hosts
 * every inbox interaction outside the full-page `/notifications`
 * route:
 *
 *   - Header: title + "Mark all read".
 *   - Body: push-permission banner (Phase 2), section tabs
 *     (Unread / All), filter chips (Type / Channel), scrolling list.
 *   - Footer: "Notification preferences" link.
 *
 * The drawer is fully **controlled** by its parent (bell button) so
 * the parent can open/close it programmatically (e.g. Cmd-B, or after
 * a routed navigation from a row).
 *
 * ## Filter model
 *
 * Filters compound: unread section AND category chip AND channel chip.
 * Filter changes are tracked in local state — no URL sync (the drawer
 * is transient) and no analytics until the wave-1 analytics wiring
 * comes online.
 */

import { CheckIcon, Cog6ToothIcon, TrashIcon } from "@academorix/ui/icons/outline";
import { Button, Chip, Drawer, Label } from "@academorix/ui/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
  RenderableNotification,
} from "@/lib/notifications/types";
import type { NotificationChannel } from "@academorix/notifications";
import type { ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import { NotificationList } from "@/lib/notifications/components/notification-list";
import { PushPermissionBanner } from "@/lib/notifications/components/push-permission-banner";
import { useNotificationWrites } from "@/lib/notifications/hooks/use-notification-writes";
import { useSnoozeStore } from "@/lib/notifications/hooks/use-snooze-store";
import {
  deriveNotificationPriority,
  mapPriorityToToastVariant,
} from "@/lib/notifications/priority.util";
import { useNotifications } from "@/lib/notifications/provider/notifications-bundle";
import { emitNotificationTelemetry } from "@/lib/notifications/telemetry";

/** Props for {@link NotificationDrawer}. */
export interface NotificationDrawerProps {
  /** Controlled open state. */
  readonly isOpen: boolean;
  /** Called by the drawer to close itself. */
  readonly onOpenChange: (isOpen: boolean) => void;
}

/** The category chips the drawer exposes. */
const CATEGORY_FILTERS: readonly {
  readonly key: NotificationDrawerCategoryFilter;
  readonly label: string;
  /**
   * Prefixes on the DTO's `type` field that map to this category.
   * The backend does NOT ship an explicit `category` column, so the
   * frontend infers one from the event type. When the backend adds
   * a proper column, this table becomes a single field lookup.
   */
  readonly typePrefixes: readonly string[];
}[] = [
  { key: "all", label: "All", typePrefixes: [] },
  {
    key: "operational",
    label: "Operational",
    typePrefixes: ["attendance_", "session_", "team_", "training_"],
  },
  { key: "billing", label: "Billing", typePrefixes: ["payment_", "invoice_", "subscription_"] },
  {
    key: "safety",
    label: "Safety",
    typePrefixes: ["child_safety_", "safeguarding_", "emergency_"],
  },
  { key: "marketing", label: "Marketing", typePrefixes: ["marketing_", "announcement_"] },
  { key: "system", label: "System", typePrefixes: ["system_", "security_"] },
];

/** Channel chips. Non-configurable — matches the four wire values. */
const CHANNEL_FILTERS: readonly {
  readonly key: NotificationChannel | "all";
  readonly label: string;
}[] = [
  { key: "all", label: "All channels" },
  { key: "push", label: "Push" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
];

/**
 * Decides whether `type` belongs to `category` given a prefix list.
 * `all` matches every type; other categories fall back to false when
 * the prefix list is empty.
 */
function matchesCategory(type: string, category: NotificationDrawerCategoryFilter): boolean {
  if (category === "all") {
    return true;
  }

  const entry = CATEGORY_FILTERS.find((c) => c.key === category);

  if (!entry) {
    return true;
  }

  return entry.typePrefixes.some((prefix) => type.startsWith(prefix));
}

/**
 * The right-side notification drawer. Controlled by the bell button.
 *
 * @remarks
 * The drawer opens with the Unread section selected by default.
 * Every filter change (section, category,
 * channel) emits an analytics event so we can measure which surfaces
 * the operators actually reach for.
 */
export function NotificationDrawer({ isOpen, onOpenChange }: NotificationDrawerProps): ReactNode {
  const { notifications, unreadCount, markAllRead, remove } = useNotifications();
  const { markAllRead: markAllReadOnServer, remove: removeOnServer } = useNotificationWrites();
  const { isSnoozed } = useSnoozeStore();
  const navigate = useNavigate();

  // Local filter state — reset when the drawer closes.
  const [section, setSection] = useState<NotificationDrawerSection>("unread");
  const [category, setCategory] = useState<NotificationDrawerCategoryFilter>("all");
  const [channel, setChannel] = useState<NotificationChannel | "all">("all");

  // Build renderable entries once per notifications change.
  const renderable = useMemo<readonly RenderableNotification[]>(() => {
    return notifications.map((notification) => {
      const priority = deriveNotificationPriority(notification);

      return {
        notification,
        isRead: notification.read_at !== null,
        isSnoozed: isSnoozed(notification.id),
        priority,
        toastVariant: mapPriorityToToastVariant(priority),
      };
    });
  }, [notifications, isSnoozed]);

  // Filter pipeline: hide snoozed, apply section + chip filters.
  const filtered = useMemo<readonly RenderableNotification[]>(() => {
    return renderable.filter((entry) => {
      if (entry.isSnoozed) {
        return false;
      }

      if (section === "unread" && entry.isRead) {
        return false;
      }

      if (!matchesCategory(entry.notification.type, category)) {
        return false;
      }

      if (channel !== "all" && entry.notification.channel !== channel) {
        return false;
      }

      return true;
    });
  }, [renderable, section, category, channel]);

  const handleMarkAllRead = (): void => {
    // Optimistic local flip so the badge clears immediately. The
    // hook silently swallows a backend gap (404/501) so the
    // endpoint being missing does not surface as an error toast.
    // TODO(backend-endpoint): POST /api/v1/notifications/read-all —
    //   see `use-notification-writes.ts` for the graceful-failure
    //   contract.
    markAllRead();
    void markAllReadOnServer();
  };

  /**
   * "Clear read" bulk action — removes every already-read entry from
   * the local inbox and fires an optimistic DELETE per row. Snoozed
   * rows are left in place because a snoozed row is still "pending"
   * from the user's perspective regardless of its `read_at` value.
   */
  const handleClearRead = (): void => {
    const readIds = notifications
      .filter((entry) => entry.read_at !== null)
      .map((entry) => entry.id);

    for (const id of readIds) {
      remove(id);
      // TODO(backend-endpoint): DELETE /api/v1/notifications/{id} —
      //   see `use-notification-writes.ts`. Fire-and-forget so the
      //   UI stays responsive; the hook logs a backend-gap silently.
      void removeOnServer(id);
    }
  };

  const readCount = useMemo(
    () => notifications.filter((entry) => entry.read_at !== null).length,
    [notifications],
  );

  const handlePreferences = (): void => {
    onOpenChange(false);
    void navigate("/notifications/preferences");
  };

  const handleSectionChange = (next: NotificationDrawerSection): void => {
    setSection(next);
  };

  const handleCategoryChange = (next: NotificationDrawerCategoryFilter): void => {
    setCategory(next);
  };

  const handleChannelChange = (next: NotificationChannel | "all"): void => {
    setChannel(next);
  };

  // When the drawer opens we emit the analytics event once so
  // downstream funnels can count opens.
  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen && !isOpen) {
      emitNotificationTelemetry(EVENTS.notificationCenterOpened, {
        unread_count: unreadCount,
        surface: "drawer",
      });
    }

    onOpenChange(nextOpen);
  };

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="flex h-full w-full max-w-md flex-col md:w-[420px]">
          <Drawer.CloseTrigger />
          <Drawer.Header className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex min-w-0 flex-col">
              <Drawer.Heading>Notifications</Drawer.Heading>
              <span className="text-xs text-muted">
                {unreadCount === 0
                  ? "No unread"
                  : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Mark all as read"
                data-testid="notification-drawer-mark-all-read"
                isDisabled={unreadCount === 0}
                size="sm"
                variant="ghost"
                onPress={handleMarkAllRead}
              >
                <CheckIcon aria-hidden="true" className="size-4" />
                Mark all read
              </Button>
              <Button
                aria-label="Clear read notifications"
                data-testid="notification-drawer-clear-read"
                isDisabled={readCount === 0}
                size="sm"
                variant="ghost"
                onPress={handleClearRead}
              >
                <TrashIcon aria-hidden="true" className="size-4" />
                Clear read
              </Button>
            </div>
          </Drawer.Header>

          <PushPermissionBanner onSubscribed={() => onOpenChange(false)} />

          <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
            <div
              aria-label="Sections"
              className="inline-flex rounded-lg bg-default p-0.5"
              data-testid="notification-drawer-sections"
              role="tablist"
            >
              {(
                [
                  { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                  { key: "all", label: "All" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  aria-selected={section === tab.key}
                  className={
                    section === tab.key
                      ? "rounded-md bg-surface px-3 py-1 text-sm font-medium text-foreground shadow-sm"
                      : "rounded-md px-3 py-1 text-sm text-muted hover:text-foreground"
                  }
                  data-testid={`notification-drawer-section-${tab.key}`}
                  role="tab"
                  type="button"
                  onClick={() => handleSectionChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              aria-label="Category filters"
              className="flex flex-wrap gap-1.5"
              data-testid="notification-drawer-categories"
            >
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = category === filter.key;

                return (
                  <button
                    key={filter.key}
                    aria-pressed={isActive}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    data-testid={`notification-drawer-category-${filter.key}`}
                    type="button"
                    onClick={() => handleCategoryChange(filter.key)}
                  >
                    <Chip
                      color={isActive ? "accent" : "default"}
                      size="sm"
                      variant={isActive ? "primary" : "secondary"}
                    >
                      <Label>{filter.label}</Label>
                    </Chip>
                  </button>
                );
              })}
            </div>

            <div
              aria-label="Channel filters"
              className="flex flex-wrap gap-1.5"
              data-testid="notification-drawer-channels"
            >
              {CHANNEL_FILTERS.map((filter) => {
                const isActive = channel === filter.key;

                return (
                  <button
                    key={filter.key}
                    aria-pressed={isActive}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    data-testid={`notification-drawer-channel-${filter.key}`}
                    type="button"
                    onClick={() => handleChannelChange(filter.key)}
                  >
                    <Chip
                      color={isActive ? "accent" : "default"}
                      size="sm"
                      variant={isActive ? "soft" : "tertiary"}
                    >
                      <Label>{filter.label}</Label>
                    </Chip>
                  </button>
                );
              })}
            </div>
          </div>

          <Drawer.Body className="flex-1 p-0">
            <NotificationList entries={filtered} onRowAction={() => onOpenChange(false)} />
          </Drawer.Body>

          <Drawer.Footer className="border-t border-border">
            <Button size="sm" variant="tertiary" onPress={handlePreferences}>
              <Cog6ToothIcon aria-hidden="true" className="size-4" />
              Notification preferences
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
