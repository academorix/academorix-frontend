/**
 * @file notification-list.component.tsx
 * @module @stackra/notifications/react/components
 * @description Scrollable list body inside the drawer + full-page
 *   inbox.
 *
 *   Given an already-filtered array of {@link IRenderableNotification}
 *   entries, renders one {@link NotificationRow} per entry or the
 *   empty state when the list is empty. Semantic `<ul>`/`<li>` so
 *   screen readers announce "list of N notifications".
 */

import type { ReactElement } from 'react';

import { NotificationEmptyState } from '../notification-empty-state';
import { NotificationRow } from '../notification-row';
import type { NotificationListProps } from './notification-list.interface';

/**
 * The list body.
 *
 * @example
 * ```tsx
 * import { NotificationList, useRenderableNotifications } from '@stackra/notifications/react';
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
  emptyVariant = 'drawer',
  writer,
  now,
  className,
}: NotificationListProps): ReactElement {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <NotificationEmptyState variant={emptyVariant} />
      </div>
    );
  }

  return (
    <ul
      aria-label="Notifications"
      className={`divide-y divide-border overflow-y-auto${className ? ` ${className}` : ''}`}
      data-notifications-list=""
    >
      {entries.map((entry) => (
        <li key={entry.notification.id}>
          <NotificationRow entry={entry} onAction={onRowAction} writer={writer} now={now} />
        </li>
      ))}
    </ul>
  );
}
