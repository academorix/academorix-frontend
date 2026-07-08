/**
 * @file inbox-page.tsx
 * @module notifications/pages/inbox-page
 *
 * @description
 * `/notifications` — the full-page inbox route. Renders the same
 * filter + list machinery the drawer uses, but at page size, so a
 * user with a large backlog has more room to work through it.
 *
 * ## Reuse — but not naive
 *
 * The drawer's filter state is intentionally local (a transient
 * surface). The full-page inbox owns its own copy so the two
 * surfaces don't fight over the same source of truth. If we ever
 * add cross-surface state (e.g. a "saved view"), we lift both surfaces
 * onto a shared hook.
 *
 * ## Access control
 *
 * The route is gated by the `notification.view` permission on the
 * module manifest (see `modules/notifications/notifications.module.tsx`),
 * so this page assumes the guard has already passed.
 */

import { CheckIcon, Cog6ToothIcon } from "@academorix/ui/icons/outline";
import { Button, Chip, Label } from "@academorix/ui/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
  RenderableNotification,
} from "@/notifications/types";
import type { NotificationChannel } from "@academorix/notifications";
import type { ReactNode } from "react";

import { NotificationList } from "@/notifications/components/notification-list";
import { useNotificationWrites } from "@/notifications/hooks/use-notification-writes";
import { useSnoozeStore } from "@/notifications/hooks/use-snooze-store";
import {
  deriveNotificationPriority,
  mapPriorityToToastVariant,
} from "@/notifications/priority.util";
import { useNotifications } from "@/notifications/provider/notifications-bundle";

/**
 * Category filters + type-prefix mapping. Kept identical to the
 * drawer's so both surfaces answer "is this row in category X" the
 * same way. Duplicated deliberately — the drawer is a client of the
 * package barrel, and pulling this list up would create a circular
 * dependency between the drawer and the page.
 */
const CATEGORY_FILTERS: readonly {
  readonly key: NotificationDrawerCategoryFilter;
  readonly label: string;
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
 * The full-page inbox view. Rendered by the notifications module
 * manifest at `/notifications`.
 */
export default function NotificationInboxPage(): ReactNode {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { markAllRead: markAllReadOnServer } = useNotificationWrites();
  const { isSnoozed } = useSnoozeStore();
  const navigate = useNavigate();

  const [section, setSection] = useState<NotificationDrawerSection>("unread");
  const [category, setCategory] = useState<NotificationDrawerCategoryFilter>("all");
  const [channel, setChannel] = useState<NotificationChannel | "all">("all");

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

  return (
    <div className="flex flex-col gap-4 p-6" data-testid="notification-inbox-page">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
          <p className="text-sm text-muted">
            {unreadCount === 0
              ? "You're up to date."
              : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Notification preferences"
            size="sm"
            variant="tertiary"
            onPress={() => {
              void navigate("/notifications/preferences");
            }}
          >
            <Cog6ToothIcon aria-hidden="true" className="size-4" />
            Preferences
          </Button>
          <Button
            aria-label="Mark all as read"
            isDisabled={unreadCount === 0}
            size="sm"
            variant="secondary"
            onPress={() => {
              // Optimistic local flip so the badge clears; the write
              // hook silently swallows the 404/501 backend gap until
              // the endpoint ships.
              // TODO(backend-endpoint): POST /api/v1/notifications/read-all
              //   — see `use-notification-writes.ts`.
              markAllRead();
              void markAllReadOnServer();
            }}
          >
            <CheckIcon aria-hidden="true" className="size-4" />
            Mark all read
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 border-b border-border pb-3">
        <div
          aria-label="Sections"
          className="inline-flex rounded-lg bg-default p-0.5"
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
              role="tab"
              type="button"
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
                aria-pressed={isActive}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                type="button"
                onClick={() => setCategory(filter.key)}
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
        <div aria-label="Channel filters" className="flex flex-wrap gap-1.5">
          {CHANNEL_FILTERS.map((filter) => {
            const isActive = channel === filter.key;

            return (
              <button
                key={filter.key}
                aria-pressed={isActive}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                type="button"
                onClick={() => setChannel(filter.key)}
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

      <div className="min-h-[400px] rounded-xl border border-border bg-surface">
        <NotificationList emptyVariant="page" entries={filtered} />
      </div>
    </div>
  );
}
