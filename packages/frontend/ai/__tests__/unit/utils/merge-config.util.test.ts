/**
 * @file merge-config.util.test.ts
 * @description Unit tests for `mergeConfig()` — confirms defaults are applied
 *   under user options and nested objects (`context`, `retryPolicy`, `speech`)
 *   are deep-merged rather than shallow-clobbered.
 */

import { describe, expect, it } from 'vitest';
import type { IAiCredentials, IAiModuleOptions } from '@stackra/contracts';

import { mergeConfig } from '@/core/utils/merge-config.util';
import { DEFAULT_AI_CONFIG } from '@/core/constants/default-ai-config.constant';

/** Minimal auth-provider stub for typing. */
const authProvider = {
  getCredentials: (): Promise<IAiCredentials> => Promise.resolve({ headers: {} }),
  refresh: (): Promise<IAiCredentials> => Promise.resolve({ headers: {} }),
};

/** Required-fields fixture consumed by every case below. */
const required = { baseUrl: 'https://api.example.com', authProvider };

describe('mergeConfig', () => {
  it('applies every default when only required fields are supplied', () => {
    const resolved = mergeConfig(required);

    expect(resolved.baseUrl).toBe('https://api.example.com');
    expect(resolved.authProvider).toBe(authProvider);
    expect(resolved.context).toEqual(DEFAULT_AI_CONFIG.context);
    expect(resolved.retryPolicy).toEqual(DEFAULT_AI_CONFIG.retryPolicy);
    expect(resolved.speech).toEqual(DEFAULT_AI_CONFIG.speech);
    expect(resolved.personas).toEqual(DEFAULT_AI_CONFIG.personas);
  });

  it('deep-merges the context object, preserving defaults for omitted keys', () => {
    const resolved = mergeConfig({
      ...required,
      context: { debounceMs: 250 },
    });

    expect(resolved.context?.debounceMs).toBe(250);
    // The keys the user did not touch keep their defaults.
    expect(resolved.context?.leaderGated).toBe(DEFAULT_AI_CONFIG.context!.leaderGated);
    expect(resolved.context?.maxFrameBytes).toBe(DEFAULT_AI_CONFIG.context!.maxFrameBytes);
    expect(resolved.context?.maxSnapshotBytes).toBe(DEFAULT_AI_CONFIG.context!.maxSnapshotBytes);
  });

  it('deep-merges the retryPolicy object', () => {
    const resolved = mergeConfig({
      ...required,
      retryPolicy: { maxAttempts: 10 },
    } as Partial<IAiModuleOptions>);

    expect(resolved.retryPolicy?.maxAttempts).toBe(10);
    expect(resolved.retryPolicy?.baseMs).toBe(DEFAULT_AI_CONFIG.retryPolicy!.baseMs);
    expect(resolved.retryPolicy?.capMs).toBe(DEFAULT_AI_CONFIG.retryPolicy!.capMs);
  });

  it('deep-merges the speech object', () => {
    const resolved = mergeConfig({
      ...required,
      speech: { transcribe: true },
    });

    expect(resolved.speech?.transcribe).toBe(true);
    expect(resolved.speech?.tts).toBe(DEFAULT_AI_CONFIG.speech!.tts);
  });

  it('lets user-supplied required fields win over any defaults', () => {
    const otherAuth = { ...authProvider };
    const resolved = mergeConfig({
      baseUrl: 'https://api.other.example',
      authProvider: otherAuth,
    });

    expect(resolved.baseUrl).toBe('https://api.other.example');
    expect(resolved.authProvider).toBe(otherAuth);
  });

  it('accepts no arguments and returns a config with just defaults (typed as partial)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved = mergeConfig() as any;

    expect(resolved.context).toEqual(DEFAULT_AI_CONFIG.context);
    expect(resolved.retryPolicy).toEqual(DEFAULT_AI_CONFIG.retryPolicy);
    expect(resolved.speech).toEqual(DEFAULT_AI_CONFIG.speech);
    expect(resolved.personas).toEqual(DEFAULT_AI_CONFIG.personas);
  });

  it('does not mutate the DEFAULT_AI_CONFIG constant', () => {
    const before = JSON.stringify(DEFAULT_AI_CONFIG);
    mergeConfig({
      ...required,
      context: { debounceMs: 999 },
      retryPolicy: { maxAttempts: 1, baseMs: 1, capMs: 1 },
      speech: { transcribe: true, tts: true },
    });
    expect(JSON.stringify(DEFAULT_AI_CONFIG)).toBe(before);
  });

  it('overrides personas array verbatim (no per-item merge)', () => {
    const personas = [{ slug: 'writer', title: 'Writer' }];
    const resolved = mergeConfig({ ...required, personas });
    expect(resolved.personas).toBe(personas);
  });
});
