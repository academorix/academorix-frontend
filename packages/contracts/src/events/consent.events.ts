/**
 * @file consent.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by the consent system.
 */

/**
 * Consent lifecycle events.
 *
 * Emitted by `ConsentManager` on the shared event bus. Consumer packages
 * subscribe to react in real time — start/stop tracking, load/unload
 * scripts, adjust behavior.
 */
export const CONSENT_EVENTS = {
  /** Emitted when a single category is granted. Payload: `{ category, timestamp }`. */
  GRANTED: "consent.granted",
  /** Emitted when a single category is revoked. Payload: `{ category, timestamp }`. */
  REVOKED: "consent.revoked",
  /** Emitted on any bulk preference change. Payload: `{ preferences, timestamp }`. */
  PREFERENCES_UPDATED: "consent.preferences_updated",
  /** Emitted when the user makes their first explicit choice. Payload: `{ preferences, timestamp }`. */
  DECIDED: "consent.decided",
} as const;

/** Union type of every emitted consent event name. */
export type ConsentEventName = (typeof CONSENT_EVENTS)[keyof typeof CONSENT_EVENTS];
