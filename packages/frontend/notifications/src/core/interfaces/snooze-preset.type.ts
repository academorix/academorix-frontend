/**
 * @file snooze-preset.type.ts
 * @module @stackra/notifications/core/interfaces
 * @description Snooze duration presets — one-click options in the
 *   row's snooze menu.
 *
 *   Numeric millisecond values live next to the enum in
 *   `SNOOZE_PRESETS_MS`; the tokens exist so keyboard-driven menus
 *   (HeroUI `Dropdown.Item`) can bind stable `id` values.
 */

/**
 * Snooze duration presets — closed union.
 *
 * - `hour` — one hour.
 * - `threeHours` — three hours.
 * - `tomorrow` — 24 hours (next day).
 * - `nextWeek` — 7 days.
 */
export type SnoozePreset = "hour" | "threeHours" | "tomorrow" | "nextWeek";
