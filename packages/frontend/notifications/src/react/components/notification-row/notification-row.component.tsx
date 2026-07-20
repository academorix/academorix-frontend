/**
 * @file notification-row.component.tsx
 * @module @stackra/notifications/react/components
 * @description A single row inside the {@link NotificationList}.
 *
 *   Renders through HeroUI primitives (`Card`-style row + inline
 *   icon `Button`s + `Dropdown` snooze menu). Priority-driven
 *   accent classes are kept explicit (not composed at runtime) so
 *   Tailwind's JIT purge picks them up.
 *
 *   Delegates mark-seen / dismiss / snooze to the shared hooks
 *   ({@link useNotificationWrites}, {@link useSnoozeStore}) so
 *   consumers can drop this row into their own list wrappers.
 */

import { useMemo, type ReactElement } from "react";
import { Button, Dropdown } from "@stackra/ui/react";
import { CheckIcon, ClockIcon, TrashIcon } from "@stackra/ui/icons/heroicon/outline";

import type { IRenderableNotification, SnoozePreset } from "@/core/interfaces";
import { useNotificationWrites } from "../../hooks/use-notification-writes";
import { useSnoozeStore } from "../../hooks/use-snooze-store";
import type { NotificationRowProps } from "./notification-row.interface";

/**
 * Priority → Tailwind border-accent class. The class strings are
 * kept explicit — dynamic composition defeats Tailwind's JIT
 * purge.
 */
const PRIORITY_ACCENT: Readonly<Record<IRenderableNotification["priority"], string>> = {
  urgent: "border-l-danger",
  high: "border-l-warning",
  normal: "border-l-accent/40",
  low: "border-l-transparent",
};

/**
 * Priority → screen-reader label. Feeds `aria-describedby` so a
 * JAWS/NVDA user hears "urgent notification" alongside the title.
 */
const PRIORITY_ARIA_LABEL: Readonly<Record<IRenderableNotification["priority"], string>> = {
  urgent: "Urgent notification",
  high: "High-priority notification",
  normal: "Notification",
  low: "Low-priority notification",
};

/**
 * Compact "3 min ago" / "2 h ago" formatter using
 * `Intl.RelativeTimeFormat` so locale-aware strings drop in without
 * a dependency.
 *
 * @param millis - Unix milliseconds of the item's creation.
 * @param now - "now" reference — parameterised so tests can pin it.
 */
function formatRelative(millis: number, now: Date = new Date()): string {
  const diff = now.getTime() - millis;
  if (!Number.isFinite(diff) || diff < 0) return "";
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return formatter.format(-seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return formatter.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return formatter.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return formatter.format(-days, "day");
  const weeks = Math.round(days / 7);
  return formatter.format(-weeks, "week");
}

/** Every snooze preset's user-facing label. */
const SNOOZE_LABELS: Readonly<Record<SnoozePreset, string>> = {
  hour: "1 hour",
  threeHours: "3 hours",
  tomorrow: "Tomorrow",
  nextWeek: "Next week",
};

/**
 * A single inbox row.
 *
 * @example
 * ```tsx
 * <NotificationRow entry={renderable} onAction={() => setOpen(false)} />
 * ```
 */
export function NotificationRow({
  entry,
  onAction,
  writer,
  now = new Date(),
}: NotificationRowProps): ReactElement {
  const { markSeen, remove } = useNotificationWrites(writer);
  const { snooze } = useSnoozeStore();

  const { notification, isRead, priority } = entry;
  const relative = useMemo(
    () => formatRelative(notification.createdAt, now),
    [notification.createdAt, now],
  );
  const priorityLabelId = `notif-priority-${notification.id}`;

  const handleMarkRead = (): void => {
    void markSeen(notification.id);
  };

  const handleDelete = (): void => {
    void remove(notification.id);
    onAction?.();
  };

  const handleSnoozeAction = (key: unknown): void => {
    // `Dropdown.Menu.onAction` passes a `Key` (string | number)
    // that we treat as a `SnoozePreset` narrowing at the boundary.
    const preset = String(key) as SnoozePreset;
    snooze(notification.id, preset);
    onAction?.();
  };

  return (
    <div
      aria-describedby={priorityLabelId}
      // Priority accent lives in a Tailwind layout class — this is
      // the only place we hand-roll classes, per the ui-components
      // rule which permits layout utilities but forbids bespoke
      // component styling.
      className={`hover:bg-surface-secondary flex items-start gap-2 border-l-4 py-3 pr-2 pl-3 transition-colors ${PRIORITY_ACCENT[priority]}`}
      data-notifications-row=""
      data-notifications-row-priority={priority}
      data-notifications-row-read={isRead ? "true" : "false"}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <span
              className={
                isRead
                  ? "text-foreground truncate text-sm font-medium"
                  : "text-foreground truncate text-sm font-semibold"
              }
            >
              {notification.payload.title}
            </span>
            {!isRead ? (
              <span aria-label="Unread" className="bg-accent size-1.5 shrink-0 rounded-full" />
            ) : null}
          </div>
          {notification.payload.body ? (
            <p className="text-muted mt-0.5 line-clamp-2 text-xs">{notification.payload.body}</p>
          ) : null}
          <div className="text-muted mt-1 flex items-center gap-2 text-xs">
            <span>{relative}</span>
            {notification.payload.category ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{notification.payload.category}</span>
              </>
            ) : null}
            <span className="sr-only" id={priorityLabelId}>
              {PRIORITY_ARIA_LABEL[priority]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {!isRead ? (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Mark as read"
            onPress={handleMarkRead}
          >
            <CheckIcon aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
        <Dropdown>
          <Dropdown.Trigger>
            <Button isIconOnly variant="ghost" size="sm" aria-label="Snooze notification">
              <ClockIcon aria-hidden="true" className="size-4" />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="min-w-[180px]">
            <Dropdown.Menu onAction={handleSnoozeAction}>
              {(Object.keys(SNOOZE_LABELS) as SnoozePreset[]).map((preset) => (
                <Dropdown.Item
                  key={preset}
                  id={preset}
                  textValue={`Snooze ${SNOOZE_LABELS[preset]}`}
                >
                  {SNOOZE_LABELS[preset]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Delete notification"
          onPress={handleDelete}
        >
          <TrashIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
