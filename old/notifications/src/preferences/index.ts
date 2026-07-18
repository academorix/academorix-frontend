/**
 * @file index.ts
 * @module @academorix/notifications/preferences
 *
 * @description
 * Public barrel for the preferences model + delivery predicates.
 */

export { isDeliveryAllowed, MANDATORY_PUSH_TYPES } from "./is-delivery-allowed.util";
export type { IsDeliveryAllowedArgs } from "./is-delivery-allowed.util";
export type {
  NotificationPreferences,
  PerChildPreferences,
  PreferenceDefaults,
  QuietHoursWindow,
} from "./preferences.type";
export { isQuietHoursWindow, isWithinQuietHours } from "./quiet-hours.util";
