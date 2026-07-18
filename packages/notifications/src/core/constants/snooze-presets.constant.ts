/**
 * @file snooze-presets.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Snooze duration presets in milliseconds.
 *
 *   Keyed by the {@link SnoozePreset} union so consumers can look
 *   up a duration by preset name (`SNOOZE_PRESETS_MS[preset]`)
 *   without a switch statement.
 */

import type { SnoozePreset } from '../interfaces';

/**
 * Snooze durations in milliseconds.
 */
export const SNOOZE_PRESETS_MS: Readonly<Record<SnoozePreset, number>> = {
  hour: 60 * 60 * 1000,
  threeHours: 3 * 60 * 60 * 1000,
  tomorrow: 24 * 60 * 60 * 1000,
  nextWeek: 7 * 24 * 60 * 60 * 1000,
};
