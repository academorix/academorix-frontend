/**
 * @file snooze-entry.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description One entry in the snooze store — a notification id
 *   paired with a wake-up millisecond timestamp.
 */

/**
 * A single snooze entry.
 *
 * The snooze store is a `Record<string, number>` keyed by
 * notification id; this interface is the flattened row consumers
 * pass to `snooze(...)` / `unsnooze(...)`.
 */
export interface ISnoozeEntry {
  /** Notification id — matches `IInAppNotification.id`. */
  readonly id: string;
  /** Millisecond timestamp when the snooze expires. */
  readonly until: number;
}
