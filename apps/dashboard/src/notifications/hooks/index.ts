/**
 * @file index.ts
 * @module notifications/hooks
 *
 * @description
 * Public barrel for the module's presence hooks + snooze store. The
 * hooks all read from the shared notifications context and produce no
 * DOM.
 */

export { useNotificationInboxSync } from "./use-notification-inbox-sync";
export type { UseNotificationInboxSyncOptions } from "./use-notification-inbox-sync";

export { toastForNotification, useNotificationToast } from "./use-notification-toast";

export { useNotificationWrites } from "./use-notification-writes";
export type { UseNotificationWritesResult } from "./use-notification-writes";

export { SNOOZE_PRESETS, useSnoozeStore } from "./use-snooze-store";
export type { SnoozePreset, UseSnoozeStoreResult } from "./use-snooze-store";
