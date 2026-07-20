/**
 * @file use-snooze-store.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for the {@link useSnoozeStore} hook.
 */

import type { SnoozePreset } from '@/core/interfaces';

/**
 * Value returned by {@link useSnoozeStore}.
 */
export interface IUseSnoozeStoreResult {
  /** Whether `id` is currently snoozed. */
  readonly isSnoozed: (id: string) => boolean;
  /** Snooze `id` by a preset duration. */
  readonly snooze: (id: string, preset: SnoozePreset) => void;
  /** Snooze `id` until an arbitrary future timestamp. */
  readonly snoozeUntil: (id: string, until: Date) => void;
  /** Clear the snooze for a single `id`. */
  readonly unsnooze: (id: string) => void;
  /** Wipe every snooze entry — call on logout. */
  readonly clearAll: () => void;
}
