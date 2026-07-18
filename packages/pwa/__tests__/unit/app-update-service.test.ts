// @vitest-environment jsdom
/**
 * @file app-update-service.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Behavioural tests for {@link AppUpdateService}.
 *
 *   Exercises the check-fetch flow (with retry + mirror shape) and
 *   the accept/dismiss reducers.  Realtime subscription is covered
 *   by a stub `IRealtimeManager` so we don't drag `@stackra/realtime`
 *   in as a test dep.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  IHttpClient,
  IHttpManager,
  IRealtimeChannel,
  IRealtimeConnection,
  IRealtimeManager,
} from '@stackra/contracts';

import { AppUpdateService } from '@/core';
import type { IPwaModuleOptions } from '@/core/interfaces';

// ══════════════════════════════════════════════════════════════════
// Fakes
// ══════════════════════════════════════════════════════════════════

/** Minimal HTTP client stub that lets tests dictate the response. */
function createFakeHttpClient() {
  return {
    responsePayload: {} as unknown,
    shouldFail: false,
    calls: [] as string[],
    async get<T = unknown>(url: string) {
      this.calls.push(url);
      if (this.shouldFail) throw new Error('network down');
      return {
        data: this.responsePayload as T,
        status: 200,
        statusText: 'OK',
        headers: {},
      };
    },
    async post() {
      throw new Error('not implemented');
    },
    async put() {
      throw new Error('not implemented');
    },
    async patch() {
      throw new Error('not implemented');
    },
    async delete() {
      throw new Error('not implemented');
    },
    async request() {
      throw new Error('not implemented');
    },
    stream() {
      throw new Error('not implemented');
    },
    sse() {
      throw new Error('not implemented');
    },
  };
}

/** HTTP manager returning our stub client on `connection()`. */
function createFakeHttpManager(client: ReturnType<typeof createFakeHttpClient>): IHttpManager {
  return {
    async connection() {
      return client as unknown as IHttpClient;
    },
  } as unknown as IHttpManager;
}

/**
 * Realtime manager stub — records every `channel(...)` call and lets
 * the test synthesise a broadcast by calling the recorded listener
 * directly.
 */
function createFakeRealtime() {
  const listeners: Array<{ event: string; cb: (data: unknown) => void }> = [];
  const channel: IRealtimeChannel = {
    on(event, cb) {
      listeners.push({ event, cb });
      return channel;
    },
    off() {
      return channel;
    },
    whisper() {
      return channel;
    },
  } as unknown as IRealtimeChannel;

  const conn: IRealtimeConnection = {
    channel: () => channel,
    privateChannel: () => channel,
  } as unknown as IRealtimeConnection;

  const manager: IRealtimeManager = {
    async connection() {
      return conn;
    },
  } as unknown as IRealtimeManager;

  return { manager, listeners };
}

// ══════════════════════════════════════════════════════════════════
// Fixtures
// ══════════════════════════════════════════════════════════════════

function withConfig(overrides: Partial<IPwaModuleOptions['appUpdate']> = {}): IPwaModuleOptions {
  return {
    appUpdate: {
      currentVersion: '1.0.0',
      pollingIntervalMs: 0,
      checkOnBoot: false, // opt in per test
      ...overrides,
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

// ══════════════════════════════════════════════════════════════════
// Tests — construction + defaults
// ══════════════════════════════════════════════════════════════════

describe('AppUpdateService construction', () => {
  it('seeds current version from config', () => {
    const service = new AppUpdateService(withConfig());
    expect(service.getState().current).toBe('1.0.0');
    expect(service.getState().hasUpdate).toBe(false);
    expect(service.getState().latest).toBeUndefined();
  });

  it('is a no-op when the HTTP peer is missing', async () => {
    const service = new AppUpdateService(withConfig());
    await service.check();
    // Silent — no state mutation because the service has no client.
    expect(service.getState().isChecking).toBe(false);
    expect(service.getState().latest).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════
// Tests — check() flow
// ══════════════════════════════════════════════════════════════════

describe('AppUpdateService.check', () => {
  let client: ReturnType<typeof createFakeHttpClient>;
  let manager: IHttpManager;

  beforeEach(() => {
    client = createFakeHttpClient();
    manager = createFakeHttpManager(client);
  });

  it('populates state from the version endpoint on success', async () => {
    client.responsePayload = {
      current_version: '1.2.0',
      mandatory: false,
      web_update_url: 'https://example.com/download',
      release_notes_url: 'https://example.com/changelog',
      web_update_available: true,
    };
    const service = new AppUpdateService(withConfig(), manager);
    await service.check();
    const s = service.getState();
    expect(s.hasUpdate).toBe(true);
    expect(s.latest).toBe('1.2.0');
    expect(s.mandatory).toBe(false);
    expect(s.downloadUrl).toBe('https://example.com/download');
    expect(s.releaseNotesUrl).toBe('https://example.com/changelog');
    expect(s.checkedAt).toBeTypeOf('string');
    expect(s.error).toBeNull();
  });

  it('reports hasUpdate=false when the available flag is explicit false', async () => {
    client.responsePayload = {
      current_version: '1.0.0',
      web_update_available: false,
    };
    const service = new AppUpdateService(withConfig(), manager);
    await service.check();
    expect(service.getState().hasUpdate).toBe(false);
  });

  it('falls back to version comparison when the flag is absent', async () => {
    client.responsePayload = { current_version: '2.0.0' };
    const service = new AppUpdateService(withConfig(), manager);
    await service.check();
    expect(service.getState().hasUpdate).toBe(true);
    expect(service.getState().latest).toBe('2.0.0');
  });

  it('sets error state on network failure', async () => {
    client.shouldFail = true;
    const service = new AppUpdateService(withConfig(), manager);
    await service.check();
    const s = service.getState();
    expect(s.isChecking).toBe(false);
    expect(s.error).toBeInstanceOf(Error);
    // hasUpdate stays false — no manifest received.
    expect(s.hasUpdate).toBe(false);
  });

  it('respects the platform config for URL selection', async () => {
    client.responsePayload = {
      current_version: '2.0.0',
      web_update_url: 'https://example.com/web',
      desktop_update_url: 'https://example.com/desktop',
      mobile_update_url: 'https://example.com/mobile',
    };
    const service = new AppUpdateService(withConfig({ platform: 'desktop' }), manager);
    await service.check();
    expect(service.getState().downloadUrl).toBe('https://example.com/desktop');
  });
});

// ══════════════════════════════════════════════════════════════════
// Tests — dismiss / accept
// ══════════════════════════════════════════════════════════════════

describe('AppUpdateService.dismiss', () => {
  it('clears hasUpdate for non-mandatory updates', async () => {
    const client = createFakeHttpClient();
    client.responsePayload = { current_version: '2.0.0', mandatory: false };
    const service = new AppUpdateService(withConfig(), createFakeHttpManager(client));

    await service.check();
    expect(service.getState().hasUpdate).toBe(true);

    service.dismiss();
    expect(service.getState().hasUpdate).toBe(false);
  });

  it('is a no-op for mandatory updates (state stays hasUpdate=true)', async () => {
    const client = createFakeHttpClient();
    client.responsePayload = { current_version: '2.0.0', mandatory: true };
    const service = new AppUpdateService(withConfig(), createFakeHttpManager(client));

    await service.check();
    expect(service.getState().hasUpdate).toBe(true);
    expect(service.getState().mandatory).toBe(true);

    service.dismiss();
    expect(service.getState().hasUpdate).toBe(true); // unchanged
  });
});

// ══════════════════════════════════════════════════════════════════
// Tests — realtime broadcast
// ══════════════════════════════════════════════════════════════════

describe('AppUpdateService realtime subscription', () => {
  it('merges an incoming manifest into state on broadcast', async () => {
    const { manager: realtimeManager, listeners } = createFakeRealtime();
    const service = new AppUpdateService(
      withConfig({ broadcasting: { enabled: true } }),
      undefined,
      realtimeManager
    );

    await service.onApplicationBootstrap();

    // Two listeners bound — for the raw and dot-prefixed event names.
    expect(listeners.length).toBeGreaterThan(0);

    // Simulate a broadcast on either — the merge should happen.
    listeners[0].cb({
      current_version: '3.0.0',
      mandatory: true,
      web_update_url: 'https://example.com/urgent',
    });

    const s = service.getState();
    expect(s.hasUpdate).toBe(true);
    expect(s.latest).toBe('3.0.0');
    expect(s.mandatory).toBe(true);
    expect(s.downloadUrl).toBe('https://example.com/urgent');
  });

  it('does not subscribe when @stackra/realtime is missing', async () => {
    const service = new AppUpdateService(
      withConfig({ broadcasting: { enabled: true } })
      // no realtime manager
    );
    // Should complete without throwing.
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════
// Tests — subscribe + destroy
// ══════════════════════════════════════════════════════════════════

describe('AppUpdateService.subscribe + destroy', () => {
  it('fires the listener on every state change', async () => {
    const client = createFakeHttpClient();
    client.responsePayload = { current_version: '2.0.0' };
    const service = new AppUpdateService(withConfig(), createFakeHttpManager(client));

    const listener = vi.fn();
    service.subscribe(listener);

    await service.check();
    // At least: isChecking:true → response merged → isChecking:false.
    expect(listener).toHaveBeenCalled();
  });

  it('unsubscribes stop firing after destroy', () => {
    const service = new AppUpdateService(withConfig());
    const listener = vi.fn();
    const off = service.subscribe(listener);
    off();
    service.dismiss();
    expect(listener).not.toHaveBeenCalled();
  });

  it('destroy clears the poll interval', async () => {
    vi.useFakeTimers();
    const client = createFakeHttpClient();
    client.responsePayload = { current_version: '1.0.0' };
    const service = new AppUpdateService(
      withConfig({ pollingIntervalMs: 1000, checkOnBoot: false }),
      createFakeHttpManager(client)
    );

    await service.onModuleInit();

    // Advance to fire the poll once.
    await vi.advanceTimersByTimeAsync(1000);
    const beforeDestroy = client.calls.length;

    service.destroy();

    // Advance past another interval — no more calls should happen.
    await vi.advanceTimersByTimeAsync(2000);
    expect(client.calls.length).toBe(beforeDestroy);
  });
});
