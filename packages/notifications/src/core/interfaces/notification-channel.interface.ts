/**
 * @file notification-channel.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Consumer-facing metadata for a notification channel.
 *
 *   Distinct from {@link INotificationChannelDriver} — the driver is
 *   the runtime that delivers the payload; the channel is the
 *   metadata (id, label, importance) consumers show in a settings
 *   screen so users can toggle channels on / off.
 */

/**
 * A single delivery channel.
 *
 * Consumers typically render every channel in a preferences UI so
 * users can opt in or out of specific channels (`in-app`,
 * `web-push`, `email`, etc.).
 */
export interface INotificationChannel {
  /** Machine-readable channel id (`'in-app'`, `'web-push'`, …). */
  readonly id: string;
  /** Human-readable label shown in the preferences UI. */
  readonly label: string;
  /** Optional icon reference (URL / iconify key). */
  readonly icon?: string;
  /**
   * Priority relative to other channels — used by the manager when
   * choosing a fallback if the user has muted the primary channel.
   * `'urgent'` is reserved for auth-critical + safety notifications.
   */
  readonly importance?: 'min' | 'low' | 'default' | 'high' | 'urgent';
  /**
   * Whether the channel is enabled by default. Consumers can mirror
   * this in their own settings store when the user hasn't picked a
   * preference yet.
   *
   * @default true
   */
  readonly enabledByDefault?: boolean;
}
