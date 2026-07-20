/**
 * @file broadcast-view-log-record.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single row from a broadcast token's audit-log store.
 *   Events are append-only, per-broadcast, and rendered by the share
 *   dialog's "Activity" section.
 *
 *   `eventType` is the machine value; `eventTypeLabel` is the
 *   human-facing string the backend has already localised. Same pattern
 *   for `denialReason` / `denialReasonLabel`.
 */

/**
 * Audit-log event for a broadcast token.
 */
export interface IBroadcastViewLogRecord {
  /** UUID primary key for the log row. */
  readonly id: string;

  /** FK back to the owning {@link IEmbedTokenRecord.id}. */
  readonly embedTokenId: string;

  /**
   * Session identifier for correlating multiple events from the same
   * viewer flow (unlock → resolve). Absent when the event pre-dates
   * the session-key surface.
   */
  readonly sessionId?: string;

  /**
   * Machine-readable event type. Fixed enum matching the resolver's
   * state transitions.
   */
  readonly eventType:
    "unlock_success" | "unlock_failure" | "resolve_success" | "resolve_denied" | "revoked";

  /** Human-facing event label already localised on the backend. */
  readonly eventTypeLabel: string;

  /**
   * SHA-256 hash of the viewer IP. Truncated to the first 8 chars in
   * the UI so operators spot repeat viewers without being handed a
   * fingerprint.
   */
  readonly viewerIpHash?: string;

  /** SHA-256 hash of the viewer User-Agent. */
  readonly viewerUaHash?: string;

  /** ISO 3166-1 alpha-2 country code inferred from the viewer IP. */
  readonly countryCode?: string;

  /**
   * Viewer email — surfaced only for magic-link flow. Redacted
   * server-side (`a****@example.com`).
   */
  readonly viewerEmail?: string;

  /** Machine reason code for a `resolve_denied` / `unlock_failure`. */
  readonly denialReason?: string;

  /** Human-facing denial reason already localised on the backend. */
  readonly denialReasonLabel?: string;

  /** Referenced dashboard id — useful in present-mode logs. */
  readonly dashboardId?: string;

  /** ISO-8601 event timestamp. */
  readonly occurredAt: string;
}
