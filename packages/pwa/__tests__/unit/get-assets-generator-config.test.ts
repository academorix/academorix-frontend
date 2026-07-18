/**
 * @file get-assets-generator-config.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Tests for {@link getAssetsGeneratorConfig}.
 */

import { describe, expect, it } from 'vitest';

import { getAssetsGeneratorConfig } from '@/vite';

describe('getAssetsGeneratorConfig', () => {
  it('defaults preset to "minimal-2023" and outDir to "public/"', () => {
    const cfg = getAssetsGeneratorConfig({ source: './public/logo.svg' });
    expect(cfg['preset']).toBe('minimal-2023');
    expect(cfg['outDir']).toBe('public/');
    expect(cfg['images']).toEqual(['./public/logo.svg']);
  });

  it('honours a custom preset', () => {
    const cfg = getAssetsGeneratorConfig({ source: './a.png', preset: 'minimal' });
    expect(cfg['preset']).toBe('minimal');
  });

  it('honours a custom outDir', () => {
    const cfg = getAssetsGeneratorConfig({ source: './a.png', outDir: 'dist/icons/' });
    expect(cfg['outDir']).toBe('dist/icons/');
  });

  it('omits the extra field when not provided', () => {
    const cfg = getAssetsGeneratorConfig({ source: './a.png' });
    expect('extra' in cfg).toBe(false);
  });

  it('spreads the extra list when provided', () => {
    const extra = [{ src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }] as const;
    const cfg = getAssetsGeneratorConfig({ source: './a.png', extra });
    expect(cfg['extra']).toEqual(extra);
  });

  it('does not share references between the input and the emitted config', () => {
    const extra = [{ src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }] as const;
    const cfg = getAssetsGeneratorConfig({ source: './a.png', extra });
    expect(cfg['extra']).not.toBe(extra);
  });
});
