/**
 * @file notification.type.ts
 * @module @academorix/notifications/types/notification.type
 *
 * @description
 * The canonical Notification DTO shared by every delivery surface:
 * in-app React lists, Web Push, and native OS (Tauri). Field names
 * and nullability match the Laravel backend's `NotificationData`
 * one-for-one, wire-format snake_case included, so a JSON payload
 * fetched from `GET /notifications` can be cast to `Notification`
 * without an intermediate mapper.
 *
 * ## Source of truth
 *
 * The wire contract is owned by the backend DTO at:
 *
 *   `backend/modules/Communication/src/Data/Notifications/NotificationData.php`
 *
 * That file emits every field via `SnakeCaseMapper` (see the
 * `MapOutputName` attribute), which is why every field here is
 * `snake_case` rather than the workspace's usual camelCase.
 *
 * ## Cross-surface invariants
 *
 *  - `id` is a prefixed opaque id (`notif_*`) minted by the backend
 *    so every surface can dedupe (a push arriving before the
 *    WebSocket broadcast, etc.).
 *  - `channel` is one of the four transports the backend supports
 *    today. See {@link NotificationChannel}.
 *  - `status` is the last-known delivery state. See
 *    {@link NotificationStatus}.
 *  - `data_ref` is a free-form reference bag — small primitives +
 *    ids only. Consumers key off `type` to know the shape.
 *  - Timestamps are ISO-8601 strings on the wire. Downstream
 *    formatters (`@academorix/i18n/format`) turn them into locale-
 *    aware relative-time strings.
 */

/**
 * Delivery channels the backend supports today. The backend decides
 * which channel(s) to send per (recipient, notification,
 * preferences) tuple — the client only observes.
 *
 * @remarks
 * `push` covers both Web Push (browser) and native OS notifications
 * (Tauri) — the transport differs, the DTO does not.
 */
export type NotificationChannel = "push" | "email" | "sms" | "whatsapp";

/**
 * Delivery lifecycle states emitted by the backend.
 *
 *  - `queued` — accepted, not yet dispatched to the channel.
 *  - `sent` — handed off to the provider (SES, FCM, Twilio, ...).
 *  - `delivered` — provider confirmed delivery to the recipient.
 *  - `read` — recipient acknowledged (either via a client mark-read
 *    call or, for email, an open-tracking pixel).
 *  - `bounced` — provider rejected / recipient unreachable. See
 *    `failure_reason` for details.
 */
export type NotificationStatus = "queued" | "sent" | "delivered" | "read" | "bounced";

/**
 * Free-form reference bag emitted alongside every notification. The
 * backend's contract is "small primitives + ids only" — no rich
 * objects, no arrays of records. Interpretation is keyed off
 * {@link Notification.type}: e.g. an `invitation_sent` notification
 * will carry `{ invitation_id: "inv_...", tenant_id: "..." }`.
 *
 * @remarks
 * The optional `action_url` string, when present, drives the click
 * handler in the service worker — see
 * `@academorix/notifications/service-worker`.
 */
export type NotificationDataRef = Record<string, unknown>;

/**
 * The canonical notification payload.
 *
 * @remarks
 * Wire-format matches
 * `backend/modules/Communication/src/Data/Notifications/NotificationData.php`.
 * Do NOT add camelCase aliases — every consumer is expected to speak
 * the backend's snake_case dialect end-to-end.
 */
export interface Notification {
  /**
   * Opaque prefixed id (`notif_*`) minted by the backend. Every
   * delivery surface uses this for dedupe.
   */
  readonly id: string;

  /**
   * Owning tenant id. Null for system-owned rows (a fixture-only
   * case today, but the DTO accepts it).
   */
  readonly tenant_id: string | null;

  /**
   * Addressed user id. Null for tenant-wide broadcasts and system-
   * owned rows.
   */
  readonly user_id: string | null;

  /** Template id used to render the body, if any. */
  readonly template_id: string | null;

  /**
   * Domain event type — e.g. `invitation_sent`, `payment_due`,
   * `child_safety_alert`. Consumers key off this both for rendering
   * and for interpreting {@link Notification.data_ref}.
   */
  readonly type: string;

  /** Delivery channel — see {@link NotificationChannel}. */
  readonly channel: NotificationChannel;

  /**
   * Optional title for channels that support it (push, email).
   * Absent on SMS / WhatsApp deliveries.
   */
  readonly title: string | null;

  /**
   * Rendered preview of the notification body. Consumers show this
   * in inbox lists + system notification banners. Full body (for
   * email specifically) is fetched separately when the user opens
   * the notification.
   */
  readonly body_preview: string | null;

  /** Event-specific reference bag — see {@link NotificationDataRef}. */
  readonly data_ref: NotificationDataRef;

  /** Last-known delivery state — see {@link NotificationStatus}. */
  readonly status: NotificationStatus;

  /** ISO-8601 timestamp — when the backend dispatched to the channel. */
  readonly sent_at: string | null;

  /**
   * ISO-8601 timestamp — when the recipient marked the notification
   * as read (either via `POST /notifications/{id}/read` — TODO:
   * endpoint doesn't exist yet — or via an inbound provider
   * webhook).
   */
  readonly read_at: string | null;

  /**
   * Failure reason for `bounced` deliveries. Free-form provider
   * message: `"SES-bounce"`, `"FCM-invalid-token"`, etc.
   */
  readonly failure_reason: string | null;

  /**
   * Free-text operator notes. Present on a subset of fixture rows;
   * production deliveries usually leave this null.
   */
  readonly notes: string | null;

  /** ISO-8601 creation timestamp. */
  readonly created_at: string | null;

  /** ISO-8601 last-update timestamp. */
  readonly updated_at: string | null;
}
