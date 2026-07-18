/**
 * @file should-enable-devtools.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `shouldEnableDevtools`.
 */

// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { shouldEnableDevtools } from '@/core/utils/should-enable-devtools.util';

describe('shouldEnableDevtools', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('honours an explicit `true`', () => {
    expect(shouldEnableDevtools(true)).toBe(true);
  });

  it('honours an explicit `false`', () => {
    expect(shouldEnableDevtools(false)).toBe(false);
  });

  it('falls back to NODE_ENV — dev returns true', () => {
    process.env.NODE_ENV = 'development';
    expect(shouldEnableDevtools()).toBe(true);
  });

  it('falls back to NODE_ENV — production returns false', () => {
    process.env.NODE_ENV = 'production';
    expect(shouldEnableDevtools()).toBe(false);
  });

  it('honours the explicit override even in production', () => {
    process.env.NODE_ENV = 'production';
    expect(shouldEnableDevtools(true)).toBe(true);
  });
});
