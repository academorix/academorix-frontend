/**
 * @file notification-list.component.tsx
 * @module @stackra/notifications/native/components
 * @description Scrollable list body inside the native drawer + full
 *   inbox page.
 *
 *   Given an already-filtered array of {@link IRenderableNotification}
 *   entries, renders one {@link NotificationRow} per entry or the
 *   empty state when the list is empty. RN's `ScrollView` handles
 *   the scrolling surface — the drawer's `BottomSheet.Content`
 *   nests this without conflict.
 */

import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";
import { Separator } from "@stackra/ui/native";

import { NotificationEmptyState } from "../notification-empty-state";
import { NotificationRow } from "../notification-row";
import type { NotificationListProps } from "./notification-list.interface";

/**
 * The native list body.
 *
 * @example
 * ```tsx
 * import { NotificationList, useRenderableNotifications } from '@stackra/notifications/native';
 *
 * function Inbox() {
 *   const { entries } = useRenderableNotifications();
 *   return <NotificationList entries={entries} emptyVariant="page" />;
 * }
 * ```
 */
export function NotificationList({
  entries,
  onRowAction,
  emptyVariant = "drawer",
  writer,
  now,
  className,
}: NotificationListProps): ReactElement {
  if (entries.length === 0) {
    return (
      <View className={`flex-1 items-center justify-center p-6${className ? ` ${className}` : ""}`}>
        <NotificationEmptyState variant={emptyVariant} />
      </View>
    );
  }

  return (
    <ScrollView
      accessibilityLabel="Notifications"
      className={className}
      keyboardShouldPersistTaps="handled"
    >
      {entries.map((entry, index) => (
        <View key={entry.notification.id}>
          {index > 0 ? <Separator /> : null}
          <NotificationRow entry={entry} now={now} onAction={onRowAction} writer={writer} />
        </View>
      ))}
    </ScrollView>
  );
}
