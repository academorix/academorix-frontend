/**
 * @file built-in-dashboards.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Namespaced UUIDs for the two built-in dashboards. Stable
 *   across users so the router can pin default routes to specific
 *   built-ins without depending on runtime state.
 */

/** UUID of the built-in Overview dashboard. */
export const BUILT_IN_OVERVIEW_ID = "00000000-0000-0000-0000-00000000d1a1";

/** UUID of the built-in Analytics dashboard. */
export const BUILT_IN_ANALYTICS_ID = "00000000-0000-0000-0000-00000000d1a2";
