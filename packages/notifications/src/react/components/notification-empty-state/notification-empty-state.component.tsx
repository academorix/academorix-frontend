/**
 * @file notification-empty-state.component.tsx
 * @module @stackra/notifications/react/components
 * @description "You're all caught up" empty state — HeroUI Pro's
 *   `EmptyState` compound with a bell icon + optional consumer-
 *   supplied action.
 *
 *   Consumers rarely construct this directly; it's rendered
 *   automatically by {@link NotificationList} when the list is
 *   empty. The `action` slot lets callers surface an "Open
 *   preferences" affordance without a wrapper component.
 */

import type { ReactElement } from 'react';
import { EmptyState } from '@stackra/ui/react';
import { BellSlashIcon } from '@stackra/ui/icons/heroicon/outline';

import type { NotificationEmptyStateProps } from './notification-empty-state.interface';

/**
 * The empty state.
 *
 * @example
 * ```tsx
 * import { NotificationEmptyState } from '@stackra/notifications/react';
 * <NotificationEmptyState variant="drawer" />
 * ```
 */
export function NotificationEmptyState({
  title = "You're all caught up",
  description = 'New notifications will appear here.',
  variant = 'drawer',
  action,
  className,
}: NotificationEmptyStateProps = {}): ReactElement {
  return (
    <EmptyState size={variant === 'page' ? 'lg' : 'md'} className={className}>
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <BellSlashIcon aria-hidden="true" className="size-5" />
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Header>
      {action ? <EmptyState.Content>{action}</EmptyState.Content> : null}
    </EmptyState>
  );
}
