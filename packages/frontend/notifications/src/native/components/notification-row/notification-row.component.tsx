/**
 * @file notification-row.component.tsx
 * @module @stackra/notifications/native/components
 * @description A single row inside the native
 *   {@link NotificationList}.
 *
 *   Uses HeroUI Native's `Card` for the surface + `Menu` for
 *   the snooze presets — Native's compound API mirror of the
 *   web `Dropdown`. Priority accent lives on a `View` bar so
 *   Uniwind's JIT can pick it up (Uniwind's compiler treats
 *   these class strings the same way Tailwind v4 does on web).
 */

import { useMemo, type ReactElement } from "react";
import { View, Text } from "react-native";
import { Button, Card, Menu, PressableFeedback, Separator } from "@stackra/ui/native";

import type { IRenderableNotification, SnoozePreset } from "@/core/interfaces";

import { useNotificationWrites, useSnoozeStore } from "../../hooks";
import type { NotificationRowProps } from "./notification-row.interface";

/**
 * Priority → Uniwind border-accent class. Explicit strings so
 * the compiler doesn't strip them at build time.
 */
const PRIORITY_ACCENT: Readonly<Record<IRenderableNotification["priority"], string>> = {
  urgent: "border-l-danger",
  high: "border-l-warning",
  normal: "border-l-accent",
  low: "border-l-transparent",
};

/**
 * Priority → screen-reader label — surfaces through
 * `accessibilityHint` so a VoiceOver / TalkBack user hears
 * "urgent notification" alongside the title.
 */
const PRIORITY_A11Y_LABEL: Readonly<Record<IRenderableNotification["priority"], string>> = {
  urgent: "Urgent notification",
  high: "High-priority notification",
  normal: "Notification",
  low: "Low-priority notification",
};

/**
 * Compact "3 min ago" / "2 h ago" formatter using
 * `Intl.RelativeTimeFormat` — mirrors the web row's helper.
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

/** Every snooze preset in a stable render order. */
const SNOOZE_ORDER: readonly SnoozePreset[] = ["hour", "threeHours", "tomorrow", "nextWeek"];

/**
 * Native inbox row.
 *
 * @example
 * ```tsx
 * import { NotificationRow } from '@stackra/notifications/native';
 *
 * <NotificationRow entry={renderable} onAction={() => sheet.close()} />
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

  const handleMarkRead = (): void => {
    void markSeen(notification.id);
  };

  const handleDelete = (): void => {
    void remove(notification.id);
    onAction?.();
  };

  const handleSnooze = (preset: SnoozePreset): void => {
    snooze(notification.id, preset);
    onAction?.();
  };

  return (
    <Card
      accessibilityHint={PRIORITY_A11Y_LABEL[priority]}
      className={`bg-surface flex-row items-start gap-2 rounded-none border-0 border-l-4 py-3 pr-2 pl-3 ${PRIORITY_ACCENT[priority]}`}
    >
      <View className="flex-1 flex-col">
        <View className="flex-row items-center gap-2">
          <Text
            className={
              isRead
                ? "text-foreground flex-1 text-sm font-medium"
                : "text-foreground flex-1 text-sm font-semibold"
            }
            numberOfLines={1}
          >
            {notification.payload.title}
          </Text>
          {!isRead ? (
            <View accessibilityLabel="Unread" className="bg-accent h-1.5 w-1.5 rounded-full" />
          ) : null}
        </View>
        {notification.payload.body ? (
          <Text className="text-muted mt-0.5 text-xs" numberOfLines={2}>
            {notification.payload.body}
          </Text>
        ) : null}
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-muted text-xs">{relative}</Text>
          {notification.payload.category ? (
            <>
              <Text aria-hidden className="text-muted text-xs">
                ·
              </Text>
              <Text className="text-muted text-xs capitalize">{notification.payload.category}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        {!isRead ? (
          <Button
            accessibilityLabel="Mark as read"
            size="sm"
            variant="ghost"
            onPress={handleMarkRead}
          >
            <Button.Label>Read</Button.Label>
          </Button>
        ) : null}
        <Menu>
          <Menu.Trigger asChild>
            <Button accessibilityLabel="Snooze notification" size="sm" variant="ghost">
              <Button.Label>Snooze</Button.Label>
            </Button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Overlay />
            <Menu.Content presentation="popover">
              <Menu.Label>Snooze</Menu.Label>
              <Separator />
              {SNOOZE_ORDER.map((preset) => (
                <Menu.Item key={preset} onPress={() => handleSnooze(preset)}>
                  <Menu.ItemTitle>{SNOOZE_LABELS[preset]}</Menu.ItemTitle>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu>
        <PressableFeedback
          accessibilityLabel="Delete notification"
          accessibilityRole="button"
          className="p-2"
          onPress={handleDelete}
        >
          <Text className="text-danger text-sm">Delete</Text>
        </PressableFeedback>
      </View>
    </Card>
  );
}
