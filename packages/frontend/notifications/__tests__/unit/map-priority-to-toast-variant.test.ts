/**
 * @file map-priority-to-toast-variant.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Tests for {@link mapPriorityToToastVariant} —
 *   the priority → HeroUI toast variant mapping.
 */

import { describe, expect, it } from 'vitest';

import { mapPriorityToToastVariant } from '@/core/utils';

describe('mapPriorityToToastVariant', () => {
  it('urgent → danger', () => {
    expect(mapPriorityToToastVariant('urgent')).toBe('danger');
  });
  it('high → warning', () => {
    expect(mapPriorityToToastVariant('high')).toBe('warning');
  });
  it('normal → info', () => {
    expect(mapPriorityToToastVariant('normal')).toBe('info');
  });
  it('low → success', () => {
    expect(mapPriorityToToastVariant('low')).toBe('success');
  });
});
