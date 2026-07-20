/**
 * @file expo-push-token-adapter.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for the {@link ExpoPushTokenAdapter}.
 *
 *   The adapter loads `expo-notifications` lazily through a
 *   swappable loader — tests substitute a fake module directly on
 *   `adapter.loader` so no vi.mock is required.
 */

import { describe, expect, it } from 'vitest';

import { ExpoPushTokenAdapter } from '@/native/adapters';

describe('ExpoPushTokenAdapter', () => {
  it('emits "native" kind + carries the returned token', async () => {
    const adapter = new ExpoPushTokenAdapter();
    adapter.loader = async () => ({
      async getExpoPushTokenAsync() {
        return { data: 'ExponentPushToken[unit-test]', type: 'expo' };
      },
      async requestPermissionsAsync() {
        return { status: 'granted', granted: true };
      },
    });
    const result = await adapter.subscribe({ projectId: 'proj-42' });
    expect(result.kind).toBe('native');
    expect((result.value as { token: string }).token).toBe('ExponentPushToken[unit-test]');
  });

  it('caches the subscription so getSubscription returns it', async () => {
    const adapter = new ExpoPushTokenAdapter();
    adapter.loader = async () => ({
      async getExpoPushTokenAsync() {
        return { data: 'ExponentPushToken[cached]' };
      },
      async requestPermissionsAsync() {
        return { status: 'granted', granted: true };
      },
    });
    await adapter.subscribe();
    const cached = await adapter.getSubscription();
    expect(cached?.kind).toBe('native');
  });

  it("throws when the peer isn't installed", async () => {
    const adapter = new ExpoPushTokenAdapter();
    adapter.loader = async () => null;
    await expect(adapter.subscribe()).rejects.toThrow(/expo-notifications/);
  });

  it('unsubscribe clears the cached token', async () => {
    const adapter = new ExpoPushTokenAdapter();
    adapter.loader = async () => ({
      async getExpoPushTokenAsync() {
        return { data: 'ExponentPushToken[x]' };
      },
      async requestPermissionsAsync() {
        return { status: 'granted', granted: true };
      },
    });
    await adapter.subscribe();
    expect(await adapter.unsubscribe()).toBe(true);
    expect(await adapter.getSubscription()).toBeNull();
  });
});
