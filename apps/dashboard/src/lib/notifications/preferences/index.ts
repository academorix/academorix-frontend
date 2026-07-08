/**
 * @file index.ts
 * @module notifications/preferences
 *
 * @description
 * Public barrel for the notification-preferences UI. The page itself
 * is default-exported for lazy loading through the module manifest;
 * this barrel re-exports the atomic pieces (toggle + quiet-hours
 * picker) so tests can render them in isolation.
 */

export { ChannelToggle } from "./channel-toggle";
export type { ChannelToggleProps } from "./channel-toggle";
export { QuietHoursPicker } from "./quiet-hours-picker";
export type { QuietHoursPickerProps } from "./quiet-hours-picker";
export { default as NotificationPreferencesPage } from "./preferences-page";
