/**
 * @file index.ts
 * @module @academorix/notifications/preferences
 *
 * @description
 * Public barrel for the preferences model + predicates.
 */

export { isDeliveryAllowed } from "./is-delivery-allowed.util";
export type { IsDeliveryAllowedArgs } from "./is-delivery-allowed.util";
export type {
  CategoryChannelPreferences,
  NotificationPreferences,
  QuietHoursWindow,
} from "./preferences.type";
export { isWithinQuietHours } from "./quiet-hours.util";
