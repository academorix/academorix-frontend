/**
 * @file mock-notification-payload.ts
 * @module @stackra/notifications/testing
 * @description Factory for well-formed test notification payloads.
 *
 *   Kept minimal on purpose — tests that want an exotic shape pass
 *   overrides; every field the manager reads defaults to something
 *   plausible.
 */

import type { INotificationPayload } from '@/core/interfaces';

/**
 * Build a plausible {@link INotificationPayload}, with every
 * field defaulted and any caller-supplied overrides applied last.
 *
 * @example
 * ```ts
 * const payload = mockNotificationPayload({ title: 'Custom title' });
 * ```
 */
export function mockNotificationPayload(
  overrides: Partial<INotificationPayload> = {}
): INotificationPayload {
  return {
    title: 'Test notification',
    body: 'Test body copy — created by mockNotificationPayload.',
    tag: 'stackra:test',
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}
