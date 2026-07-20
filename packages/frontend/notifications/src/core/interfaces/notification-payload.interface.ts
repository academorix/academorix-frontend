/**
 * @file notification-payload.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description The shape of a single notification handed to
 *   {@link NotificationManager.dispatch}.
 *
 *   Structurally close to the browser's `NotificationOptions` so a
 *   payload built for the in-app centre also works verbatim as the
 *   `data` field of a Web Push message from the app's backend.
 *
 *   Two optional fields drive the drawer UI:
 *   - `category` — per-category filter chip + preference matrix key.
 *   - `priority` — visual accent + toast timeout, when the caller
 *     wants to override the category-derived default.
 */

import type { INotificationAction } from './notification-action.interface';
import type { NotificationCategory } from './notification-category.type';
import type { NotificationPriority } from './notification-priority.type';

/**
 * A notification payload dispatched through the manager.
 *
 * Every field is optional except `title`. Consumers extend
 * `data: Record<string, unknown>` with any bespoke shape their app
 * needs — the manager treats it as opaque.
 */
export interface INotificationPayload {
  /** Notification title — displayed in the notification header. */
  readonly title: string;
  /** Notification body — multi-line text below the title. */
  readonly body?: string;
  /** URL of a small icon shown at the top of the notification. */
  readonly icon?: string;
  /** URL of a small badge (Android). */
  readonly badge?: string;
  /** URL of a large hero image (Android + Chromium). */
  readonly image?: string;
  /**
   * Tag used to collapse notifications with the same tag — a new one
   * with the same tag replaces the old one in the OS tray.
   */
  readonly tag?: string;
  /** Opaque payload carried through delivery. */
  readonly data?: Record<string, unknown>;
  /** Interactive actions rendered as buttons. */
  readonly actions?: readonly INotificationAction[];
  /** Vibration pattern (`[on, off, on, off, ...]` millis). */
  readonly vibrate?: readonly number[];
  /** When `true`, dispatch does not play a sound / vibrate. */
  readonly silent?: boolean;
  /** Millisecond timestamp — when omitted, `Date.now()` is used. */
  readonly timestamp?: number;
  /**
   * When `true`, the notification stays visible until the user
   * interacts with it (Chromium desktop).
   */
  readonly requireInteraction?: boolean;
  /** Text direction. */
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  /** BCP-47 language tag for accessibility. */
  readonly lang?: string;
  /**
   * Category taxonomy — feeds the drawer's category filter chip
   * and the preferences matrix. Optional so legacy callers keep
   * working; when absent, the priority derivation falls back to
   * `'normal'`.
   */
  readonly category?: NotificationCategory;
  /**
   * Explicit priority override. When absent the priority is
   * derived from {@link category}.
   */
  readonly priority?: NotificationPriority;
}
