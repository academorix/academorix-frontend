/**
 * @file query-module.test.ts
 * @module @stackra/query/__tests__
 * @description Verifies QueryModule wiring and defaults.
 */

import { describe, it, expect } from 'vitest';
import { QueryModule } from '@/core/query.module';
import { QUERY_CONFIG } from '@/core/tokens/query.tokens';

describe('QueryModule', () => {
  it('provides QUERY_CONFIG with defaults', () => {
    const mod = QueryModule.forRoot();
    const provider = mod.providers?.find(
      (p): p is { provide: symbol; useValue: unknown } =>
        typeof p === 'object' && 'provide' in p && p.provide === QUERY_CONFIG
    );
    expect(provider).toBeDefined();
    expect(provider?.useValue).toEqual({
      defaultStaleTime: 0,
      defaultRefetchInterval: 0,
      refetchOnWindowFocus: false,
      defaultMutationMode: 'pessimistic',
      undoableTimeout: 5000,
      defaultLiveMode: 'off',
    });
  });

  it('merges caller options over defaults', () => {
    const mod = QueryModule.forRoot({
      defaultStaleTime: 5000,
      refetchOnWindowFocus: true,
      defaultMutationMode: 'optimistic',
      defaultLiveMode: 'auto',
    });
    const provider = mod.providers?.find(
      (p): p is { provide: symbol; useValue: Record<string, unknown> } =>
        typeof p === 'object' && 'provide' in p && p.provide === QUERY_CONFIG
    );
    expect(provider?.useValue).toEqual({
      defaultStaleTime: 5000,
      defaultRefetchInterval: 0,
      refetchOnWindowFocus: true,
      defaultMutationMode: 'optimistic',
      undoableTimeout: 5000,
      defaultLiveMode: 'auto',
    });
  });

  it('marks the module global', () => {
    expect(QueryModule.forRoot().global).toBe(true);
  });
});
