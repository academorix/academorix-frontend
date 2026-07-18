/**
 * @file categories.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Notification category × channel taxonomy.
 *
 *   `NOTIFICATION_CATEGORIES` lists every category the drawer + the
 *   preferences UI expose, plus the `type` prefixes that map an
 *   inbound `payload.type` to a category when the caller didn't
 *   supply one explicitly.
 *
 *   `MANDATORY_ON_MATRIX` marks the (category, channel) pairs a user
 *   cannot toggle off — safety × push is the only current entry.
 */

import type { NotificationCategory } from '../interfaces';

/**
 * Descriptor for one category row in the preferences UI.
 */
export interface INotificationCategoryDescriptor {
  /** Machine-readable id. */
  readonly key: NotificationCategory;
  /** Human-readable label. */
  readonly label: string;
  /** Short description shown under the label. */
  readonly description: string;
  /**
   * Type-name prefixes that map to this category when the caller
   * doesn't set `payload.category` explicitly.
   */
  readonly typePrefixes: readonly string[];
}

/**
 * Canonical category taxonomy.
 *
 * Every entry documents the prefixes the drawer's category filter
 * uses to classify legacy payloads (those without a `category`
 * field). New categories go here first — every downstream UI reads
 * from this table.
 */
export const NOTIFICATION_CATEGORIES: Readonly<
  Record<NotificationCategory, INotificationCategoryDescriptor>
> = {
  operational: {
    key: 'operational',
    label: 'Operational',
    description: 'Day-to-day activity — attendance, sessions, teams.',
    typePrefixes: ['attendance_', 'session_', 'team_', 'training_'],
  },
  billing: {
    key: 'billing',
    label: 'Billing',
    description: 'Invoices, payments, subscription changes.',
    typePrefixes: ['payment_', 'invoice_', 'subscription_'],
  },
  safety: {
    key: 'safety',
    label: 'Safety',
    description: 'Child-safety alerts + emergency notifications.',
    typePrefixes: ['child_safety_', 'safeguarding_', 'emergency_'],
  },
  marketing: {
    key: 'marketing',
    label: 'Marketing',
    description: 'Announcements + optional tenant campaigns.',
    typePrefixes: ['marketing_', 'announcement_'],
  },
  system: {
    key: 'system',
    label: 'System',
    description: 'Auth, security, and maintenance events.',
    typePrefixes: ['system_', 'security_'],
  },
};

/**
 * (category, channel) pairs the user cannot disable.
 *
 * `safety × os-notification` is mandatory because a safeguarding
 * alert MUST reach the user — the UI renders the switch as
 * read-only for these pairs.
 */
export const MANDATORY_ON_MATRIX: Readonly<Record<NotificationCategory, readonly string[]>> = {
  operational: [],
  billing: [],
  safety: ['os-notification'],
  marketing: [],
  system: [],
};
