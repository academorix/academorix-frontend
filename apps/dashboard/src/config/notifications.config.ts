/**
 * @file notifications.config.ts
 * @module config/notifications.config
 *
 * @description
 * Static configuration for the notifications subsystem. Runtime state
 * (subscriptions, unread queue, permission flag) lives in
 * `src/notifications/*`; this file is only the compile-time knobs.
 *
 * See `NOTIFICATIONS_PLAN.md` for the architecture that this backs.
 *
 * ## What lives here
 *
 *  - Notification category enum + display metadata.
 *  - Category × channel preference defaults.
 *  - Quiet hours defaults.
 *  - VAPID public key + subscribe/unsubscribe endpoint paths.
 *  - Notification priority timeout mapping.
 *
 * ## What does NOT live here
 *
 *  - The service worker push handler (`src/pwa/sw/push-handler.ts` once
 *    we migrate to `injectManifest` per NOTIFICATIONS_PLAN.md Phase 2).
 *  - The Reverb channel subscription code
 *    (`src/notifications/transport/reverb-transport.ts`).
 *  - The React provider + context (`src/notifications/*`).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Notification categories. Drives per-user channel preferences. */
export type NotificationCategory = "operational" | "billing" | "safety" | "marketing" | "system";

/** Channels a notification can be delivered on. */
export type NotificationChannel = "in_app" | "push" | "email" | "digest";

/** Notification priority — drives toast timeout + urgency semantics. */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/** Human display metadata for each category. */
export interface CategoryDescriptor {
  /** i18n key for the display label. */
  labelKey: string;
  /** i18n key for the tooltip / description. */
  descriptionKey: string;
  /**
   * Channels the user is allowed to toggle. Safety is deliberately
   * missing "push" here — see below on the mandatory-push rule.
   */
  toggleableChannels: readonly NotificationChannel[];
  /**
   * Channels that are forced on regardless of user preference. Used
   * only for safety alerts today.
   */
  mandatoryChannels?: readonly NotificationChannel[];
}

// ---------------------------------------------------------------------------
// Category registry
// ---------------------------------------------------------------------------

/**
 * Category display + channel rules. The runtime `Settings →
 * Notifications` page renders one row per key in this map.
 */
export const NOTIFICATION_CATEGORIES: Readonly<Record<NotificationCategory, CategoryDescriptor>> = {
  operational: {
    labelKey: "notifications.category.operational",
    descriptionKey: "notifications.category.operational_desc",
    toggleableChannels: ["in_app", "push", "email", "digest"],
  },
  billing: {
    labelKey: "notifications.category.billing",
    descriptionKey: "notifications.category.billing_desc",
    toggleableChannels: ["in_app", "push", "email"],
  },
  safety: {
    labelKey: "notifications.category.safety",
    descriptionKey: "notifications.category.safety_desc",
    // Push is ALWAYS on for safety — see NOTIFICATIONS_PLAN.md §8.
    toggleableChannels: ["in_app", "email"],
    mandatoryChannels: ["push"],
  },
  marketing: {
    labelKey: "notifications.category.marketing",
    descriptionKey: "notifications.category.marketing_desc",
    toggleableChannels: ["in_app", "email", "digest"],
  },
  system: {
    labelKey: "notifications.category.system",
    descriptionKey: "notifications.category.system_desc",
    toggleableChannels: ["in_app", "push"],
  },
};

// ---------------------------------------------------------------------------
// Priority timeouts (in-app toast display duration, ms)
// ---------------------------------------------------------------------------

/**
 * How long an in-app toast stays visible per priority. `0` means
 * persistent — user must dismiss. Matches HeroUI's `toast(…, { timeout })`
 * option.
 */
export const TOAST_TIMEOUT_MS: Readonly<Record<NotificationPriority, number>> = {
  low: 5_000,
  normal: 6_000,
  high: 12_000,
  urgent: 0, // persist until user dismisses
};

// ---------------------------------------------------------------------------
// Backend endpoints
// ---------------------------------------------------------------------------

/**
 * REST paths for the notification subsystem. Relative to the
 * `VITE_API_URL + VITE_API_PATH` origin. Runtime code should build
 * URLs via these constants, never inline strings.
 */
export const NOTIFICATION_ENDPOINTS = {
  /** `GET /notifications` — paginated list. */
  list: "/notifications",
  /** `POST /notifications/push-subscriptions` — subscribe a browser. */
  subscribe: "/notifications/push-subscriptions",
  /** `DELETE /notifications/push-subscriptions/{id}` */
  unsubscribe: "/notifications/push-subscriptions/:id",
  /** `PATCH /notifications/bulk` — mark read en masse. */
  bulkMark: "/notifications/bulk",
  /** `GET /config/vapid` — public VAPID key. Anonymous. */
  vapidPublicKey: "/config/vapid",
} as const;

// ---------------------------------------------------------------------------
// Reverb channels
// ---------------------------------------------------------------------------

/** Channel-name builders. Consumers pass user/tenant ids. */
export const REVERB_CHANNELS = {
  user: (userId: string): string => `presence-user.${userId}`,
  tenant: (tenantId: string): string => `presence-tenant.${tenantId}`,
} as const;

/** Event names emitted on those channels. */
export const REVERB_EVENTS = {
  notificationCreated: "notifications.created",
  notificationRead: "notifications.read",
  notificationDeleted: "notifications.deleted",
} as const;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Default per-category channel preferences applied on first login,
 * before the user visits `Settings → Notifications`. Mirrors the sane
 * defaults documented in NOTIFICATIONS_PLAN.md §8.
 */
export const DEFAULT_CHANNEL_PREFERENCES: Readonly<
  Record<NotificationCategory, Readonly<Record<NotificationChannel, boolean>>>
> = {
  operational: { in_app: true, push: true, email: false, digest: true },
  billing: { in_app: true, push: true, email: true, digest: false },
  safety: { in_app: true, push: true, email: true, digest: false },
  marketing: { in_app: false, push: false, email: false, digest: true },
  system: { in_app: true, push: false, email: false, digest: false },
};

/**
 * Default quiet hours — 22:00 → 07:00 local. Suppresses `push` on all
 * categories except `safety` (mandatory). Users can override under
 * `Settings → Notifications`.
 */
export const DEFAULT_QUIET_HOURS = {
  enabled: true,
  startHour: 22,
  endHour: 7,
  suppressedChannels: ["push"] as readonly NotificationChannel[],
  /**
   * Categories exempt from quiet hours. Push always goes through for
   * safety alerts regardless of the user's schedule.
   */
  exemptCategories: ["safety"] as readonly NotificationCategory[],
} as const;

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** Bundled notifications config. */
export const notificationsConfig = {
  categories: NOTIFICATION_CATEGORIES,
  toastTimeouts: TOAST_TIMEOUT_MS,
  endpoints: NOTIFICATION_ENDPOINTS,
  reverb: {
    channels: REVERB_CHANNELS,
    events: REVERB_EVENTS,
  },
  defaults: {
    channelPreferences: DEFAULT_CHANNEL_PREFERENCES,
    quietHours: DEFAULT_QUIET_HOURS,
  },
} as const;
