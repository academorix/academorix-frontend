/**
 * @file resolve-theme-label.test.ts
 * @module @stackra/theming/test
 * @description Unit tests for resolveThemeLabel utility.
 */

import { describe, it, expect } from 'vitest';
import { resolveThemeLabel } from '@/core/utils';

describe('resolveThemeLabel', () => {
  it('should use translated labelKey when translate function returns a value', () => {
    const theme = { id: 'sky', labelKey: 'theming.themes.sky', label: 'Sky', color: '#0EA5E9' };
    const translate = (key: string) => (key === 'theming.themes.sky' ? 'Ciel' : key);
    expect(resolveThemeLabel(theme, translate)).toBe('Ciel');
  });

  it('should fall back to label when labelKey not translated', () => {
    const theme = { id: 'sky', labelKey: 'theming.themes.sky', label: 'Sky', color: '#0EA5E9' };
    const translate = (key: string) => key; // returns key itself = not translated
    expect(resolveThemeLabel(theme, translate)).toBe('Sky');
  });

  it('should fall back to label when no translate function', () => {
    const theme = { id: 'sky', labelKey: 'theming.themes.sky', label: 'Sky', color: '#0EA5E9' };
    expect(resolveThemeLabel(theme)).toBe('Sky');
  });

  it('should fall back to title-cased id when no label', () => {
    const theme = { id: 'netflix', color: '#E50914' };
    expect(resolveThemeLabel(theme)).toBe('Netflix');
  });

  it('should handle id with lowercase first char', () => {
    const theme = { id: 'custom', color: '#000' };
    expect(resolveThemeLabel(theme)).toBe('Custom');
  });
});
