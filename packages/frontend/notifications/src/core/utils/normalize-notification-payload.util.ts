/**
 * @file normalize-notification-payload.util.ts
 * @module @stackra/notifications/core/utils
 * @description Normalise a user-provided
 *   {@link INotificationPayload} — stamp a default `timestamp`,
 *   trim whitespace, and copy the object so the manager never
 *   mutates the caller's input.
 */

import { Str } from "@stackra/support";

import type { INotificationPayload } from "../interfaces";

/**
 * Return a fresh normalised copy of `payload`.
 *
 * - `title` is trimmed via `Str.trim(...)` — leading / trailing
 *   whitespace never carries into the OS notification tray.
 * - `body` is trimmed the same way when supplied.
 * - `timestamp` defaults to `Date.now()` when omitted.
 * - Every other field is copied through untouched.
 *
 * @param payload - The caller-supplied payload.
 * @returns A fresh normalised copy.
 */
export function normalizeNotificationPayload(payload: INotificationPayload): INotificationPayload {
  // Copy the payload so the caller's original object is never
  // mutated — the manager persists this object into the in-app
  // centre + storage, so a mutation would silently invalidate the
  // caller's reference.
  return {
    ...payload,
    title: Str.trim(payload.title),
    ...(payload.body !== undefined ? { body: Str.trim(payload.body) } : {}),
    timestamp: payload.timestamp ?? Date.now(),
  };
}
