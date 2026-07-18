// @vitest-environment node
/**
 * @file devtools-frame-state.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `DevtoolsFrameStateService` —
 *   hydration + persistence + fail-soft semantics.
 */

import { describe, expect, it, vi } from 'vitest';
import type { IStorage, IStorageManager } from '@stackra/contracts';

import { DEVTOOLS_FRAME_STATE_KEY } from '@/core/constants';
import { DevtoolsFrameStateService } from '@/core/services/devtools-frame-state.service';
import { mergeConfig } from '@/core/utils/merge-config.util';

/** Build an in-memory `IStorage`. */
function makeStorage(initial: Record<string, unknown> = {}): IStorage & {
  readonly writes: [string, unknown][];
} {
  const map = new Map<string, unknown>(Object.entries(initial));
  const writes: [string, unknown][] = [];
  return {
    writes,
    get: ((k: string) => map.get(k) ?? null) as never,
    set: ((k: string, v: unknown) => {
      writes.push([k, v]);
      map.set(k, v);
    }) as never,
    delete: ((k: string) => map.delete(k)) as never,
    clear: (() => map.clear()) as never,
    has: ((k: string) => map.has(k)) as never,
    keys: (() => Array.from(map.keys())) as never,
  } as unknown as IStorage & { readonly writes: [string, unknown][] };
}

/** Build an `IStorageManager` that returns a preconfigured storage. */
function makeManager(storage: IStorage): IStorageManager {
  return {
    instance: () => storage,
  } as unknown as IStorageManager;
}

describe('DevtoolsFrameStateService', () => {
  it('seeds default state when no storage manager is bound', () => {
    const config = mergeConfig();
    const service = new DevtoolsFrameStateService(config);
    service.onModuleInit();
    const state = service.getSnapshot();
    expect(state.isOpen).toBe(false);
    expect(state.activePanelId).toBeNull();
    expect(state.position).toBe(config.position);
  });

  it('hydrates from IStorageManager when present', () => {
    const stored = JSON.stringify({
      isOpen: true,
      activePanelId: 'my-panel',
      position: 'left',
      size: 320,
      isInspectorEnabled: false,
      searchQuery: '',
    });
    const storage = makeStorage({ [DEVTOOLS_FRAME_STATE_KEY]: stored });
    const service = new DevtoolsFrameStateService(mergeConfig(), makeManager(storage));
    service.onModuleInit();
    const state = service.getSnapshot();
    expect(state.isOpen).toBe(true);
    expect(state.activePanelId).toBe('my-panel');
    expect(state.position).toBe('left');
    expect(state.size).toBe(320);
  });

  it('falls back to defaults when the stored payload is corrupt', () => {
    const storage = makeStorage({ [DEVTOOLS_FRAME_STATE_KEY]: '{not-json' });
    const service = new DevtoolsFrameStateService(mergeConfig(), makeManager(storage));
    service.onModuleInit();
    // Corrupted snapshot → the service must fail soft and keep
    // the config-seeded state.
    expect(service.getSnapshot().isOpen).toBe(false);
  });

  it('persists on update()', () => {
    const storage = makeStorage();
    const service = new DevtoolsFrameStateService(mergeConfig(), makeManager(storage));
    service.onModuleInit();
    service.update({ isOpen: true });
    expect(storage.writes.length).toBeGreaterThan(0);
    const [key, value] = storage.writes[storage.writes.length - 1]!;
    expect(key).toBe(DEVTOOLS_FRAME_STATE_KEY);
    expect(JSON.parse(String(value)).isOpen).toBe(true);
  });

  it('notifies subscribers on state change', () => {
    const service = new DevtoolsFrameStateService(mergeConfig());
    service.onModuleInit();
    const listener = vi.fn();
    service.subscribe(listener);
    service.update({ isOpen: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify subscribers when update is a no-op', () => {
    const service = new DevtoolsFrameStateService(mergeConfig());
    service.onModuleInit();
    const listener = vi.fn();
    service.subscribe(listener);
    // The initial state is `isOpen: false`, so setting it to
    // `false` again is a shallow-equal no-op.
    service.update({ isOpen: false });
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribe returned by subscribe stops further callbacks', () => {
    const service = new DevtoolsFrameStateService(mergeConfig());
    service.onModuleInit();
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.update({ isOpen: true });
    expect(listener).not.toHaveBeenCalled();
  });

  it('fails soft when the manager throws on `.instance(...)`', () => {
    const manager = {
      instance: () => {
        throw new Error('missing instance');
      },
    } as unknown as IStorageManager;
    const service = new DevtoolsFrameStateService(mergeConfig(), manager);
    // Should NOT throw — we swallow and continue with a seeded
    // state.
    expect(() => service.onModuleInit()).not.toThrow();
    expect(service.getSnapshot().isOpen).toBe(false);
  });
});
