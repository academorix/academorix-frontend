/**
 * @file define-events.util.ts
 * @module @academorix/analytics/config/define-events.util
 *
 * @description
 * Typed passthrough for an app's analytics event registry. The event
 * REGISTRY stays per-app (dashboard tracks CRUD + workflow; landing
 * tracks conversion + funnel) but the shape and passthrough live in
 * this package so the two apps stay conceptually consistent.
 *
 * The event map is `Record<string, string>` — the KEY is the const's
 * TypeScript identifier (used in code), the VALUE is the wire-level
 * event name sent to adapters. Keeping them separate lets us rename
 * the code identifier without changing what analytics vendors see
 * (which would create a new event in their UI).
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/analytics.config.ts
 * import { defineEvents } from "@academorix/analytics/config";
 *
 * export const EVENTS = defineEvents({
 *   // Session
 *   userLoggedIn:  "user_logged_in",
 *   userLoggedOut: "user_logged_out",
 *
 *   // Athletes CRUD
 *   athleteCreated: "athlete_created",
 *   athleteEdited:  "athlete_edited",
 *   athleteDeleted: "athlete_deleted",
 *
 *   // Command palette
 *   commandOpened: "command_palette_opened",
 * });
 *
 * export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
 * export type AnalyticsEventKey = keyof typeof EVENTS;
 * ```
 */

/**
 * Freeze + type-preserve the event map. Downstream `EVENTS.athleteCreated`
 * gets exact-string autocomplete; the associated types can be derived
 * with `keyof typeof EVENTS` and `(typeof EVENTS)[keyof typeof EVENTS]`.
 */
export function defineEvents<TEvents extends Record<string, string>>(
  events: TEvents,
): Readonly<TEvents> {
  return Object.freeze(events);
}
