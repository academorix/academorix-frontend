/**
 * @file preferences.type.ts
 * @module @academorix/notifications/preferences/preferences.type
 *
 * @description
 * The user's notification preferences: default channel + event
 * opt-ins across every child, per-athlete overrides, quiet-hours
 * window. Field names + nullability match the Laravel backend's
 * `NotificationPreferenceData` one-for-one, wire-format snake_case
 * included.
 *
 * ## Source of truth
 *
 * The wire contract is owned by:
 *
 *   `backend/modules/Communication/src/Data/NotificationPreferences/NotificationPreferenceData.php`
 *
 * That DTO emits `defaults`, `per_child`, and `quiet_hours` as
 * free-form JSON arrays (`array<string, mixed>` in PHP). We model
 * them here as `Record<string, unknown>` so consumers cast to a
 * narrower shape only where they actually inspect the field.
 */

/**
 * A single quiet-hours window in the user's chosen timezone. The
 * backend stores this as a free-form JSON object; the frontend
 * pins it to `{ start, end, timezone }` for the delivery predicate
 * to interpret.
 *
 * @remarks
 * `start` / `end` are 24-hour wall-clock times formatted as
 * `"HH:mm"` in the given IANA `timezone`. A window with
 * `start > end` (e.g. `"22:00"` .. `"07:00"`) wraps midnight.
 */
export interface QuietHoursWindow {
  /** Inclusive start of the quiet window, ISO time `"HH:mm"`. */
  readonly start: string;
  /** Exclusive end of the quiet window, ISO time `"HH:mm"`. */
  readonly end: string;
  /** IANA timezone id (e.g. `"Europe/London"`, `"UTC"`). */
  readonly timezone: string;
}

/**
 * Default channel + event-type opt-ins. Shape mirrors the backend's
 * free-form JSON: consumers key off either a channel (`"push"`,
 * `"email"`, ...) or an event type (`"invitation_sent"`,
 * `"payment_due"`, ...) and read whatever value the backend stored.
 *
 * @remarks
 * A value of `false` under `defaults[channel]` blocks that channel
 * globally. A value of `false` under `defaults[type]` blocks that
 * event type across every channel. Any other value (undefined,
 * `true`, an object, a string) is treated as "no explicit opt-out".
 */
export type PreferenceDefaults = Record<string, unknown>;

/**
 * Per-athlete preference overrides, keyed by athlete id. Each value
 * shadows the top-level {@link PreferenceDefaults} for that athlete.
 *
 * @example
 * ```json
 * {
 *   "ath_01H...": { "push": false, "attendance_check_in": false },
 *   "ath_02K...": { "email": false }
 * }
 * ```
 */
export type PerChildPreferences = Record<string, PreferenceDefaults>;

/**
 * The full preferences payload for a user.
 *
 * @remarks
 * The `quiet_hours` field is intentionally union-typed:
 *
 *  - `QuietHoursWindow` when the user has configured a window.
 *  - `Record<string, never>` (i.e. `{}`) when the backend serialises
 *    "no quiet hours" as an empty JSON object rather than `null`.
 *
 * See the {@link isWithinQuietHours} predicate for the interpretation
 * used at the call site.
 */
export interface NotificationPreferences {
  /** Opaque prefixed id (`np_*`) minted by the backend. */
  readonly id: string;

  /** Owning tenant id. */
  readonly tenant_id: string | null;

  /** Owning user id. */
  readonly user_id: string | null;

  /** Default channel + event opt-ins for all children. */
  readonly defaults: PreferenceDefaults;

  /** Per-athlete overrides keyed by athlete id. */
  readonly per_child: PerChildPreferences;

  /**
   * Quiet-hours window, or an empty object when the user has not
   * configured one.
   */
  readonly quiet_hours: QuietHoursWindow | Record<string, never>;

  /** ISO-8601 last-update timestamp. */
  readonly updated_at: string | null;
}
