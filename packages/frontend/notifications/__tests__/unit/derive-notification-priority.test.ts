/**
 * @file derive-notification-priority.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Tests for {@link deriveNotificationPriority} — the
 *   priority derivation heuristic used by the drawer + toast bridge.
 */

import { describe, expect, it } from 'vitest';

import { deriveNotificationPriority } from '@/core/utils';

describe('deriveNotificationPriority', () => {
  it('honours an explicit payload.priority above every heuristic', () => {
    expect(
      deriveNotificationPriority({
        title: 't',
        category: 'marketing',
        priority: 'urgent',
      })
    ).toBe('urgent');
  });

  it('maps safety → urgent', () => {
    expect(deriveNotificationPriority({ title: 't', category: 'safety' })).toBe('urgent');
  });

  it('maps system → high', () => {
    expect(deriveNotificationPriority({ title: 't', category: 'system' })).toBe('high');
  });

  it('maps operational + billing → normal', () => {
    expect(deriveNotificationPriority({ title: 't', category: 'operational' })).toBe('normal');
    expect(deriveNotificationPriority({ title: 't', category: 'billing' })).toBe('normal');
  });

  it('maps marketing → low', () => {
    expect(deriveNotificationPriority({ title: 't', category: 'marketing' })).toBe('low');
  });

  it('defaults an uncategorised payload to normal', () => {
    expect(deriveNotificationPriority({ title: 't' })).toBe('normal');
  });
});
