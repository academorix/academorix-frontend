/**
 * @file index.ts
 * @module @academorix/notifications/service-worker
 *
 * @description
 * Public barrel for the service-worker-side push handlers.
 * Imported from an app's SW source, NOT its main bundle.
 */

export { handleNotificationClickEvent, handlePushEvent } from "./push-handler";
