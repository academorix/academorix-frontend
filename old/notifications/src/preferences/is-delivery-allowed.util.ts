/**
 * @file is-delivery-allowed.util.ts
 * @module @academorix/notifications/preferences/is-delivery-allowed.util
 *
 * @description
 * The compliance-critical predicate: given a `(channel, type)`
 * pair, a preferences object, and the current time, decide whether
 * the client SHOULD render (in-app) or expect (push) a notification.
 *
 * The BACKEND is the source of truth — it computes the same logic
 * server-side before dispatching. This client-side predicate exists
 * so the UI can preview what a preferences change will affect and
 * so we can filter historical notifications correctly.
 *
 * ## Precedence
 *
 *  1. Push-channel deliveries for a type in {@link MANDATORY_PUSH_TYPES}
 *     bypass every gate — DND, quiet hours, per-channel opt-outs.
 *     Reserved for child-safety + emergency events. Non-push
 *     channels for the same types still respect the normal gates.
 *  2. Explicit `preferences.defaults[type] === false` blocks the
 *     event globally (per-event opt-out).
 *  3. Explicit `preferences.defaults[channel] === false` blocks the
 *     channel globally (per-channel opt-out).
 *  4. Quiet-hours window (via {@link isWithinQuietHours}) blocks
 *     during the window.
 *  5. Otherwise, allow.
 */

import { isWithinQuietHours } from "./quiet-hours.util";

import type { NotificationPreferences } from "./preferences.type";
import type { NotificationChannel } from "../types/notification.type";

/**
 * Frontend-owned safety allowlist. Notifications with a `type` in
 * this set bypass every preferences gate WHEN DELIVERED OVER PUSH —
 * they represent child-safety + emergency events the user MUST
 * receive regardless of their DND / quiet-hours settings.
 *
 * @remarks
 * This is a frontend contract, not a backend one — the backend does
 * not read this set. Instead, it dispatches these events over push
 * unconditionally, and the frontend refuses to filter them out. If
 * a future event needs the same treatment, add it here AND file the
 * backend follow-up.
 */
export const MANDATORY_PUSH_TYPES: ReadonlySet<string> = new Set([
  "child_safety_alert",
  "emergency_pickup_request",
]);

/**
 * Args accepted by {@link isDeliveryAllowed}. Ordered so callers
 * usually pass them in this order at the call site.
 */
export interface IsDeliveryAllowedArgs {
  /** Delivery channel — the transport the backend picked. */
  readonly channel: NotificationChannel;
  /** Domain event type — the `Notification.type` value. */
  readonly type: string;
  /** The recipient's current preferences. */
  readonly preferences: NotificationPreferences;
  /**
   * Defaults to `new Date()`; overridable for tests + preview UI.
   */
  readonly now?: Date;
}

/**
 * Returns `true` when a `(channel, type)` notification MAY be
 * delivered under the given preferences.
 *
 * @example
 * ```ts
 * const allowed = isDeliveryAllowed({
 *   channel: "push",
 *   type: "payment_due",
 *   preferences: userPreferences,
 * });
 * ```
 *
 * @remarks
 * See the file header for the precedence rules.
 */
export function isDeliveryAllowed(args: IsDeliveryAllowedArgs): boolean {
  const { channel, type, preferences, now = new Date() } = args;

  // 1. Mandatory push bypass — safety-critical types push through
  //    every other gate.
  if (channel === "push" && MANDATORY_PUSH_TYPES.has(type)) {
    return true;
  }

  // 2. Per-event opt-out (globally across every channel).
  if (preferences.defaults[type] === false) {
    return false;
  }

  // 3. Per-channel opt-out.
  if (preferences.defaults[channel] === false) {
    return false;
  }

  // 4. Quiet-hours window.
  if (isWithinQuietHours(preferences.quiet_hours, now)) {
    return false;
  }

  // 5. Default-allow.
  return true;
}
