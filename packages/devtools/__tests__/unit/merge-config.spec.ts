/**
 * @file merge-config.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `mergeConfig`.
 */

// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_DEVTOOLS_CONFIG, DEVTOOLS_SIZE_BOUNDS } from '@/core/constants';
import { mergeConfig } from '@/core/utils/merge-config.util';

describe('mergeConfig', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Force a "dev" default so `enabled` resolves to `true` unless
    // the test explicitly overrides it.
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('applies every default when no options are supplied', () => {
    const merged = mergeConfig();
    expect(merged.position).toBe(DEFAULT_DEVTOOLS_CONFIG.position);
    expect(merged.initialSize).toBe(DEFAULT_DEVTOOLS_CONFIG.initialSize);
    expect(merged.shortcut).toEqual(DEFAULT_DEVTOOLS_CONFIG.shortcut);
    expect(merged.enabled).toBe(true);
  });

  it('honours an explicit `enabled: false` override', () => {
    expect(mergeConfig({ enabled: false }).enabled).toBe(false);
  });

  it('honours an explicit `enabled: true` even in production', () => {
    process.env.NODE_ENV = 'production';
    expect(mergeConfig({ enabled: true }).enabled).toBe(true);
  });

  it('resolves `enabled` from Env.isProduction() by default', () => {
    process.env.NODE_ENV = 'production';
    expect(mergeConfig().enabled).toBe(false);
  });

  it('clamps `initialSize` to the workspace bounds', () => {
    const tooSmall = mergeConfig({ initialSize: 10 });
    const tooLarge = mergeConfig({ initialSize: 10_000 });
    expect(tooSmall.initialSize).toBe(DEVTOOLS_SIZE_BOUNDS.MIN);
    expect(tooLarge.initialSize).toBe(DEVTOOLS_SIZE_BOUNDS.MAX);
  });

  it('coerces an unknown `position` to the default', () => {
    const merged = mergeConfig({ position: 'diagonal' as never });
    expect(merged.position).toBe(DEFAULT_DEVTOOLS_CONFIG.position);
  });

  it('preserves `shortcut: false` verbatim', () => {
    expect(mergeConfig({ shortcut: false }).shortcut).toBe(false);
  });

  it('accepts a custom shortcut object', () => {
    const custom = { ctrl: true, key: 'f12' };
    expect(mergeConfig({ shortcut: custom }).shortcut).toEqual(custom);
  });
});
