/**
 * @file inbox-page.component.tsx
 * @module @stackra/notifications/native/pages
 * @description Full-screen inbox screen — the native counterpart of
 *   the web `InboxPage`.
 *
 *   Renders the same section tabs + category chips + list machinery
 *   the drawer uses, at screen scale. Consumers mount this at
 *   whichever navigation route the app assigns.
 */

import { useMemo, useState, type ReactElement } from "react";
import { View, Text } from "react-native";
import { Button, Chip, PressableFeedback, Tabs } from "@stackra/ui/native";

import { NOTIFICATION_CATEGORIES } from "@/core/constants";
import type { IRenderableNotification } from "@/core/interfaces";

import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerSection,
} from "../../components/notification-drawer";
import { NotificationList } from "../../components/notification-list";
import { useNotificationWrites, useRenderableNotifications } from "../../hooks";
import type { InboxPageProps } from "./inbox-page.interface";

/** Category chips — identical shape to the drawer's. */
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

/** Filter helper — mirrors the drawer's own matcher. */
function matchesCategory(
  entry: IRenderableNotification,
  category: NotificationDrawerCategoryFilter,
): boolean {
  if (category === "all") return true;
  return entry.notification.payload.category === category;
}

/**
 * The native full-screen inbox.
 *
 * @example
 * ```tsx
 * import { InboxPage } from '@stackra/notifications/native';
 * <InboxPage onOpenPreferences={() => navigate('preferences')} />
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
    <View className={`flex-1 gap-4 p-4${className ? ` ${className}` : ""}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-foreground text-xl font-semibold">Inbox</Text>
          <Text className="text-muted text-sm">
            {unreadCount === 0
              ? "You're up to date."
              : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {onOpenPreferences ? (
            <Button
              accessibilityLabel="Notification preferences"
              size="sm"
              variant="tertiary"
              onPress={onOpenPreferences}
            >
              <Button.Label>Prefs</Button.Label>
            </Button>
          ) : null}
          <Button
            accessibilityLabel="Mark all as read"
            isDisabled={unreadCount === 0}
            size="sm"
            variant="secondary"
            onPress={() => {
              void markAllSeen();
            }}
          >
            <Button.Label>Mark all</Button.Label>
          </Button>
        </View>
      </View>

      <View className="border-border gap-3 border-b pb-3">
        <Tabs
          value={section}
          onValueChange={(v: string) => setSection(v === "all" ? "all" : "unread")}
        >
          <Tabs.List>
            <Tabs.Trigger value="unread">
              <Tabs.Label>{`Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="all">
              <Tabs.Label>All</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
        <View accessibilityLabel="Category filters" className="flex-row flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((filter) => {
            const isActive = category === filter.key;
            return (
              <PressableFeedback
                key={filter.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setCategory(filter.key)}
              >
                <Chip
                  color={isActive ? "accent" : "default"}
                  size="sm"
                  variant={isActive ? "primary" : "secondary"}
                >
                  <Chip.Label>{filter.label}</Chip.Label>
                </Chip>
              </PressableFeedback>
            );
          })}
        </View>
      </View>

      <View className="border-border bg-surface flex-1 rounded-xl border">
        <NotificationList emptyVariant="page" entries={filtered} writer={writer} />
      </View>
    </View>
  );
}
