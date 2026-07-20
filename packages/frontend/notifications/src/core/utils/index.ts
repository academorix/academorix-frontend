/**
 * @file index.ts
 * @module @stackra/notifications/core/utils
 * @description Barrel export for notifications core utilities.
 */

export { defineConfig } from "./define-config.util";
export { mergeConfig } from "./merge-config.util";
export { detectNotificationSupport } from "./detect-notification-support.util";
export { normalizeNotificationPayload } from "./normalize-notification-payload.util";
export { deriveNotificationPriority } from "./derive-notification-priority.util";
export {
  mapPriorityToToastVariant,
  type NotificationToastVariant,
} from "./map-priority-to-toast-variant.util";
export { isQuietHoursWindow } from "./is-quiet-hours-window.util";
