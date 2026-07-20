/**
 * @file notification-drawer.component.tsx
 * @module @stackra/notifications/native/components
 * @description Native equivalent of the web `NotificationDrawer` —
 *   a HeroUI Native `BottomSheet` that slides up from the bottom
 *   of the screen when the bell is tapped.
 *
 *   Hosts every inbox interaction outside the full-screen inbox
 *   route:
 *
 *     - Header: title + unread count + "Mark all read".
 *     - Push permission banner (auto-hidden when granted / denied).
 *     - Section tabs (Unread / All) via HeroUI Native `Tabs`.
 *     - Category filter chips.
 *     - Scrolling list.
 *     - Footer: optional "Notification preferences" affordance.
 *
 *   Controlled by the parent — the drawer never manages its own
 *   open/close state so a future cross-cutting action (Cmd-K on
 *   web, deep link on native) can drive it.
 */

import { useMemo, useState, type ReactElement } from "react";
import { View, Text } from "react-native";
import { BottomSheet, Button, Chip, PressableFeedback, Separator, Tabs } from "@stackra/ui/native";

import { NOTIFICATION_CATEGORIES } from "@/core/constants";
import type { IRenderableNotification } from "@/core/interfaces";

import { useNotificationWrites, useRenderableNotifications } from "../../hooks";
import { NotificationList } from "../notification-list";
import { PushPermissionBanner } from "../push-permission-banner";
import type {
  NotificationDrawerCategoryFilter,
  NotificationDrawerProps,
  NotificationDrawerSection,
} from "./notification-drawer.interface";

/** Category chips the drawer exposes. */
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
 * The native drawer.
 *
 * @example
 * ```tsx
 * import { NotificationDrawer } from '@stackra/notifications/native';
 *
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

  // Local filter state — reset intentionally when the drawer
  // closes; a saved filter would leak between navigations.
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
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="flex-1">
            {/* Header — title + unread count + mark all */}
            <View className="border-border flex-row items-center justify-between gap-3 border-b px-4 pb-3">
              <View className="flex-1 flex-col">
                <BottomSheet.Title>Notifications</BottomSheet.Title>
                <Text className="text-muted text-xs">
                  {unreadCount === 0
                    ? "No unread"
                    : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
                </Text>
              </View>
              <Button
                accessibilityLabel="Mark all as read"
                isDisabled={unreadCount === 0}
                size="sm"
                variant="ghost"
                onPress={handleMarkAll}
              >
                <Button.Label>Mark all</Button.Label>
              </Button>
            </View>

            <PushPermissionBanner />

            {/* Section tabs — Unread / All via HeroUI Native Tabs. */}
            <View className="border-border gap-3 border-b px-4 py-3">
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

              {/* Category filter chips. */}
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

            {/* Scrolling list. */}
            <View className="flex-1">
              <NotificationList
                emptyVariant="drawer"
                entries={filtered}
                writer={writer}
                onRowAction={() => onOpenChange(false)}
              />
            </View>

            {/* Footer — optional Preferences affordance. */}
            {onOpenPreferences ? (
              <View className="border-border border-t px-4 py-3">
                <Separator />
                <Button
                  className="mt-3"
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    onOpenChange(false);
                    onOpenPreferences();
                  }}
                >
                  <Button.Label>Notification preferences</Button.Label>
                </Button>
              </View>
            ) : null}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
