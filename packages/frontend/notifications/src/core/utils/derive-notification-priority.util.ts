/**
 * @file derive-notification-priority.util.ts
 * @module @stackra/notifications/core/utils
 * @description Derive a UI priority tier from a notification payload.
 *
 *   Explicit `payload.priority` wins; otherwise the category-based
 *   heuristic applies. Legacy payloads without either field default
 *   to `'normal'`.
 */

import type { INotificationPayload, NotificationPriority } from '../interfaces';

/**
 * Derive a {@link NotificationPriority} from a payload.
 *
 * Order of precedence:
 *  1. Explicit `payload.priority` — caller override.
 *  2. Category → tier mapping:
 *     - `safety` → `'urgent'`
 *     - `system` → `'high'`
 *     - `operational` → `'normal'`
 *     - `billing` → `'normal'`
 *     - `marketing` → `'low'`
 *  3. Default → `'normal'`.
 *
 * @param payload - The notification payload.
 * @returns The derived priority tier.
 */
export function deriveNotificationPriority(payload: INotificationPayload): NotificationPriority {
  if (payload.priority) return payload.priority;
  switch (payload.category) {
    case 'safety':
      return 'urgent';
    case 'system':
      return 'high';
    case 'operational':
    case 'billing':
      return 'normal';
    case 'marketing':
      return 'low';
    default:
      return 'normal';
  }
}
