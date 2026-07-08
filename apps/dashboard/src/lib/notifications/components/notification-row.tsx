/**
 * @file notification-row.tsx
 * @module notifications/components/notification-row
 *
 * @description
 * A single row rendered inside {@link NotificationList}. Displays the
 * notification's channel icon, title, body preview, timestamp, a
 * priority-driven visual accent, and inline actions (Mark read, Snooze,
 * Delete).
 *
 * ## Data flow
 *
 *   - Row-level state (`isRead`, `isSnoozed`) is projected from the
 *     shared context + snooze store — the row itself never owns
 *     mutable state.
 *   - Mark-read + delete call into the context; the backend PATCH is
 *     TODO'd (see `notifications/hooks/use-notification-inbox-sync.ts`
 *     docblock for the read/mark endpoints).
 *   - Snooze calls into {@link useSnoozeStore}.
 *
 * ## Accessibility
 *
 *   - Every actionable control has an `aria-label`.
 *   - The row itself is a `<button>` (via HeroUI's `PressableFeedback`)
 *     when clicked to navigate — a plain `<div>` when the notification
 *     carries no action URL.
 *   - Priority is reflected both through a coloured left border AND
 *     via `aria-describedby` so screen-reader users know an item is
 *     high or urgent.
 */

import {
  BellIcon,
  CheckIcon,
  ChatBubbleLeftEllipsisIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@academorix/ui/icons/outline";
import { Button, Dropdown, Label } from "@academorix/ui/react";
import { useMemo } from "react";
import { useNavigate } from "react-router";

import type { SnoozePreset } from "@/lib/notifications/hooks";
import type { NotificationRenderPriority, RenderableNotification } from "@/lib/notifications/types";
import type { Notification, NotificationChannel } from "@academorix/notifications";
import type { IconType } from "@academorix/ui/icons";
import type { Key, ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import { useNotificationWrites } from "@/lib/notifications/hooks/use-notification-writes";
import { useSnoozeStore } from "@/lib/notifications/hooks/use-snooze-store";
import { useNotifications } from "@/lib/notifications/provider/notifications-bundle";
import { emitNotificationTelemetry } from "@/lib/notifications/telemetry";

/** Props for {@link NotificationRow}. */
export interface NotificationRowProps {
  /** The row's projected view model. */
  readonly entry: RenderableNotification;
  /**
   * Called after the row's own action (click, snooze, delete). Used
   * by the drawer to close itself after a navigation click.
   */
  readonly onAction?: () => void;
  /** Test hook: override the currentDate so time formatting is stable. */
  readonly now?: Date;
}

/** Channel → glyph. Kept as a lookup table for O(1) resolution. */
const CHANNEL_ICON: Readonly<Record<NotificationChannel, IconType>> = {
  push: BellIcon,
  email: EnvelopeIcon,
  sms: DevicePhoneMobileIcon,
  whatsapp: ChatBubbleLeftEllipsisIcon,
};

/**
 * Priority → Tailwind border accent. The colour class strings are
 * kept explicit (not composed at runtime) so Tailwind's JIT picks
 * them up — dynamic string concatenation defeats purge.
 */
const PRIORITY_ACCENT: Readonly<Record<NotificationRenderPriority, string>> = {
  urgent: "border-l-danger",
  high: "border-l-warning",
  normal: "border-l-accent/40",
  low: "border-l-transparent",
};

/**
 * Priority → screen-reader-visible label. Used through
 * `aria-describedby` so a JAWS/NVDA user hears "high priority" alongside
 * the title.
 */
const PRIORITY_ARIA_LABEL: Readonly<Record<NotificationRenderPriority, string>> = {
  urgent: "Urgent notification",
  high: "High-priority notification",
  normal: "Notification",
  low: "Low-priority notification",
};

/**
 * Compact "3 min ago" / "2 h ago" formatter. Uses `Intl.RelativeTimeFormat`
 * so localised strings drop in without a dependency.
 *
 * @internal exported for testing only.
 */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) {
    return "";
  }

  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;

  if (!Number.isFinite(diff) || diff < 0) {
    return "";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = Math.round(diff / 1000);

  if (seconds < 60) {
    return formatter.format(-seconds, "second");
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return formatter.format(-minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return formatter.format(-hours, "hour");
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return formatter.format(-days, "day");
  }

  const weeks = Math.round(days / 7);

  return formatter.format(-weeks, "week");
}

/** Reads the click-target URL from a DTO's `data_ref`, if present. */
function extractActionUrl(notification: Notification): string | undefined {
  const candidate = notification.data_ref["action_url"];

  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}

/**
 * A single inbox row. Renders as a semantic button when the DTO
 * carries an `action_url`; else as a plain container.
 *
 * @remarks
 * The row does NOT persist a mark-read call to the backend today —
 * the endpoint is a documented backend gap (see the module docblock).
 * Instead, we optimistically flip local state so the badge count
 * updates immediately. The next `GET /notifications` on tab refresh
 * will still show the row as unread — we accept that regression as
 * lower-cost than blocking Phase 1 shipment.
 */
export function NotificationRow({
  entry,
  onAction,
  now = new Date(),
}: NotificationRowProps): ReactNode {
  const { markRead, remove } = useNotifications();
  const { markRead: markReadOnServer, remove: removeOnServer } = useNotificationWrites();
  const { snooze } = useSnoozeStore();
  const navigate = useNavigate();

  const { notification, isRead, priority } = entry;

  const ChannelIcon = CHANNEL_ICON[notification.channel];
  const relative = useMemo(
    () => formatRelative(notification.created_at ?? notification.sent_at, now),
    [notification.created_at, notification.sent_at, now],
  );
  const actionUrl = extractActionUrl(notification);
  const isInteractive = Boolean(actionUrl);

  // Called when the row body is clicked. Marks read + navigates.
  const handlePress = (): void => {
    if (!isRead) {
      // Optimistic local flip so the badge count updates immediately.
      markRead(notification.id);
      // Fire the persistence call; the hook swallows 404/501 silently
      // so the endpoint gap doesn't surface as an error toast.
      // TODO(backend-endpoint): POST /api/v1/notifications/{id}/read —
      //   see `use-notification-writes.ts` for the graceful-failure
      //   contract. Once shipped, no callsite change required.
      void markReadOnServer(notification.id);
    }

    emitNotificationTelemetry(EVENTS.notificationClicked, {
      channel: notification.channel,
      type: notification.type,
      priority,
      surface: "drawer",
    });

    if (actionUrl) {
      onAction?.();

      // Absolute vs relative URL — react-router handles both, but a
      // full URL should escape the SPA (external tenants).
      if (/^https?:\/\//i.test(actionUrl)) {
        window.location.href = actionUrl;
      } else {
        void navigate(actionUrl);
      }
    }
  };

  const handleMarkRead = (): void => {
    // Optimistic local flip first — the write hook silently swallows
    // backend gaps (404/501) so the user never sees a red banner for
    // "read receipt not persisted".
    markRead(notification.id);
    // TODO(backend-endpoint): POST /api/v1/notifications/{id}/read —
    //   see `use-notification-writes.ts`.
    void markReadOnServer(notification.id);
  };

  const handleDelete = (): void => {
    // Optimistic local removal first.
    remove(notification.id);
    emitNotificationTelemetry(EVENTS.notificationDismissed, {
      channel: notification.channel,
      type: notification.type,
      priority,
      surface: "drawer",
    });
    // TODO(backend-endpoint): DELETE /api/v1/notifications/{id} —
    //   see `use-notification-writes.ts`.
    void removeOnServer(notification.id);
  };

  const handleSnoozeAction = (key: Key): void => {
    const preset = key as SnoozePreset;

    snooze(notification.id, preset);
    emitNotificationTelemetry(EVENTS.notificationSnoozed, {
      channel: notification.channel,
      type: notification.type,
      priority,
      preset,
    });
    onAction?.();
  };

  // The row is either an interactive button or a plain container.
  // We render both branches so the semantics survive screen-reader
  // navigation.
  const priorityLabelId = `notif-priority-${notification.id}`;

  const rowBody = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-default text-muted">
        <ChannelIcon aria-hidden="true" className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <div className="flex items-baseline gap-2">
          <span
            className={
              isRead
                ? "truncate text-sm font-medium text-foreground"
                : "truncate text-sm font-semibold text-foreground"
            }
          >
            {notification.title ?? notification.type.replace(/_/g, " ")}
          </span>
          {!isRead ? (
            <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-accent" />
          ) : null}
        </div>
        {notification.body_preview ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notification.body_preview}</p>
        ) : null}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span>{relative}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{notification.channel}</span>
          <span className="sr-only" id={priorityLabelId}>
            {PRIORITY_ARIA_LABEL[priority]}
          </span>
        </div>
      </div>
      {isInteractive ? (
        <ChevronRightIcon aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted" />
      ) : null}
    </div>
  );

  return (
    <div
      aria-describedby={priorityLabelId}
      className={
        "flex items-start gap-2 border-l-4 py-3 pr-2 pl-3 transition-colors hover:bg-default/50 " +
        PRIORITY_ACCENT[priority]
      }
      data-testid={`notification-row-${notification.id}`}
    >
      {isInteractive ? (
        <button
          className="flex flex-1 items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          data-testid={`notification-row-open-${notification.id}`}
          type="button"
          onClick={handlePress}
        >
          {rowBody}
        </button>
      ) : (
        <div className="flex flex-1 items-start gap-3">{rowBody}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {!isRead ? (
          <Button
            isIconOnly
            aria-label="Mark as read"
            data-testid={`notification-row-read-${notification.id}`}
            size="sm"
            variant="ghost"
            onPress={handleMarkRead}
          >
            <CheckIcon aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
        <Dropdown>
          <Button
            isIconOnly
            aria-label="Snooze"
            data-testid={`notification-row-snooze-${notification.id}`}
            size="sm"
            variant="ghost"
          >
            <ClockIcon aria-hidden="true" className="size-4" />
          </Button>
          <Dropdown.Popover className="min-w-[180px]" placement="bottom end">
            <Dropdown.Menu onAction={handleSnoozeAction}>
              <Dropdown.Item id="hour" textValue="Snooze 1 hour">
                <Label>1 hour</Label>
              </Dropdown.Item>
              <Dropdown.Item id="threeHours" textValue="Snooze 3 hours">
                <Label>3 hours</Label>
              </Dropdown.Item>
              <Dropdown.Item id="tomorrow" textValue="Snooze until tomorrow">
                <Label>Tomorrow</Label>
              </Dropdown.Item>
              <Dropdown.Item id="nextWeek" textValue="Snooze until next week">
                <Label>Next week</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <Button
          isIconOnly
          aria-label="Delete notification"
          data-testid={`notification-row-delete-${notification.id}`}
          size="sm"
          variant="ghost"
          onPress={handleDelete}
        >
          <TrashIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
