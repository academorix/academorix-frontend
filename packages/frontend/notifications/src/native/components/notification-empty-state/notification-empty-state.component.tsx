/**
 * @file notification-empty-state.component.tsx
 * @module @stackra/notifications/native/components
 * @description Native "You're all caught up" empty state.
 *
 *   Uses HeroUI Native Pro's `EmptyState` compound. The bell-slash
 *   glyph is rendered as a plain emoji `Text` so the native
 *   surface doesn't take a hard dependency on `@expo/vector-icons`
 *   — consumers who want the vector icon can pass it via the
 *   `action` slot or subclass the empty state.
 */

import { Text } from 'react-native';
import type { ReactElement } from 'react';
import { EmptyState } from '@stackra/ui/native';

import type { NotificationEmptyStateProps } from './notification-empty-state.interface';

/**
 * Native empty state.
 *
 * @example
 * ```tsx
 * import { NotificationEmptyState } from '@stackra/notifications/native';
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
    <EmptyState
      className={className}
      // HeroUI Native Pro's EmptyState uses a `variant` prop shape
      // that mirrors the web `size`. The exact mapping is checked
      // against the Native Pro MCP — 'default' matches the web
      // `md` and 'large' matches `lg`.
    >
      <EmptyState.Header>
        <EmptyState.Media>
          <Text
            accessibilityElementsHidden
            className={variant === 'page' ? 'text-3xl' : 'text-2xl'}
          >
            🔕
          </Text>
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Header>
      {action ? <EmptyState.Content>{action}</EmptyState.Content> : null}
    </EmptyState>
  );
}
