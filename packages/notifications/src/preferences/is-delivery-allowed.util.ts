/**
 * @file is-delivery-allowed.util.ts
 * @module @academorix/notifications/preferences/is-delivery-allowed.util
 *
 * @description
 * The compliance-critical predicate: given a category, a channel,
 * a preferences object, and the current time, decide whether the
 * client SHOULD render (in-app) or expect (push) a notification.
 *
 * The BACKEND is the source of truth — it computes the same logic
 * server-side before dispatching. This client-side predicate exists
 * so the UI can preview what a preferences change will affect and
 * so we can filter historical notifications correctly.
 *
 * ## Precedence
 *
 *  1. `mandatoryPush` categories (child safety etc.) ALWAYS deliver
 *     over push, no matter what other flags say.
 *  2. Global `dnd` blocks every non-mandatory channel.
 *  3. `quietHours` blocks every non-mandatory channel during the
 *     window (via {@link isWithinQuietHours}).
 *  4. Per-category channel toggle from `preferences.channels`.
 *  5. Fall back to the category's `defaultChannels` when no toggle
 *     is present.
 */

import { isWithinQuietHours } from "./quiet-hours.util";

import type { NotificationPreferences } from "./preferences.type";
import type { NotificationCategoryConfig } from "../config/categories.type";
import type { NotificationChannel } from "../types/notification.type";

/**
 * Args accepted by {@link isDeliveryAllowed}. Ordered so callers
 * usually pass them in this order at the call site.
 */
export interface IsDeliveryAllowedArgs<TCategory extends string> {
  readonly category: NotificationCategoryConfig<TCategory>;
  readonly channel: NotificationChannel;
  readonly preferences: NotificationPreferences<TCategory>;
  /** Defaults to `new Date()`; overridable for tests + preview UI. */
  readonly now?: Date;
}

/**
 * Returns `true` when the notification MAY be delivered on the given
 * channel under the given preferences.
 */
export function isDeliveryAllowed<TCategory extends string>(
  args: IsDeliveryAllowedArgs<TCategory>,
): boolean {
  const { category, channel, preferences, now = new Date() } = args;

  // 1. Mandatory push always wins.
  if (channel === "push" && category.mandatoryPush) {
    return true;
  }

  // 2. Global DND.
  if (preferences.dnd) {
    return false;
  }

  // 3. Quiet hours.
  if (isWithinQuietHours(preferences.quietHours, now.getHours())) {
    return false;
  }

  // 4. Explicit per-category channel toggle.
  const categoryPrefs = preferences.channels[category.id];

  if (categoryPrefs && channel in categoryPrefs) {
    return categoryPrefs[channel];
  }

  // 5. Fall back to the category default.
  return category.defaultChannels.includes(channel);
}
