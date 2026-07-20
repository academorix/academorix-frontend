/**
 * @file monitoring-manager.test.ts
 * @module @stackra/monitoring/__tests__/unit
 * @description Behavioural tests for `MonitoringManager` — the
 *   `MultipleInstanceManager` semantics (`instance`, `extend`,
 *   `driver` config resolution), fan-out over the configured stack +
 *   ad-hoc providers, throwing-provider isolation, and user binding
 *   propagation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ICaptureContext,
  IMonitoringBreadcrumb,
  IMonitoringProvider,
  IMonitoringUser,
} from '@stackra/contracts';

import { MonitoringManager } from '@/core/services/monitoring-manager.service';
import { mergeConfig } from '@/core/utils/merge-config.util';
import type { IMonitoringModuleOptions } from '@/core/interfaces';

// ════════════════════════════════════════════════════════════════════════════
// Test provider — records every call
// ════════════════════════════════════════════════════════════════════════════

interface IRecordedCall {
  provider: string;
  kind: 'init' | 'captureException' | 'captureMessage' | 'addBreadcrumb' | 'setUser' | 'flush';
  payload?: unknown;
}

class RecordingReporter implements IMonitoringProvider {
  public constructor(
    public readonly name: string,
    private readonly log: IRecordedCall[]
  ) {}

  public init(): void {
    this.log.push({ provider: this.name, kind: 'init' });
  }

  public captureException(error: Error, context?: ICaptureContext): void {
    this.log.push({
      provider: this.name,
      kind: 'captureException',
      payload: { error, context },
    });
  }

  public captureMessage(message: string, context?: ICaptureContext): void {
    this.log.push({
      provider: this.name,
      kind: 'captureMessage',
      payload: { message, context },
    });
  }

  public addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void {
    this.log.push({ provider: this.name, kind: 'addBreadcrumb', payload: breadcrumb });
  }

  public setUser(user: IMonitoringUser | null): void {
    this.log.push({ provider: this.name, kind: 'setUser', payload: user });
  }

  public async flush(): Promise<void> {
    this.log.push({ provider: this.name, kind: 'flush' });
  }
}

/** Build a manager with custom drivers registered via extend(). */
function buildManager(
  options: Partial<IMonitoringModuleOptions>,
  log: IRecordedCall[],
  drivers: Record<string, (config: Record<string, unknown>) => IMonitoringProvider>
): MonitoringManager {
  const config = mergeConfig(options);
  const manager = new MonitoringManager(config);
  for (const [driver, creator] of Object.entries(drivers)) {
    manager.extend(driver, creator);
  }
  return manager;
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe('MonitoringManager — MultipleInstanceManager semantics', () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it('resolves named instances via extend() + instance()', () => {
    const manager = buildManager({ providers: { primary: { driver: 'rec' } } }, log, {
      rec: () => new RecordingReporter('rec', log),
    });

    const resolved = manager.instance('primary');
    expect(resolved.name).toBe('rec');
    // Caching — same instance returned.
    expect(manager.instance('primary')).toBe(resolved);
  });

  it('provider(name) resolves both configured and ad-hoc providers', () => {
    const manager = buildManager({ providers: { primary: { driver: 'rec' } } }, log, {
      rec: () => new RecordingReporter('rec', log),
    });

    const adhoc = new RecordingReporter('adhoc', log);
    manager.register(adhoc);

    expect(manager.provider('primary')?.name).toBe('rec');
    expect(manager.provider('adhoc')).toBe(adhoc);
    expect(manager.provider('unknown')).toBeUndefined();
  });

  it('getDefaultInstance falls back to first configured provider then to "console"', () => {
    const log2: IRecordedCall[] = [];
    const manager = buildManager({ providers: {} }, log2, {});
    // No default, no providers → falls through to `console`.
    expect(manager.getDefaultInstance()).toBe('console');

    manager.setDefaultInstance('override');
    expect(manager.getDefaultInstance()).toBe('override');
  });
});

describe('MonitoringManager — fan-out', () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it('dispatches captureException across every provider in the stack', () => {
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
          b: { driver: 'rec-b' },
        },
      },
      log,
      {
        'rec-a': () => new RecordingReporter('a', log),
        'rec-b': () => new RecordingReporter('b', log),
      }
    );

    const err = new Error('boom');
    manager.captureException(err, { severity: 'error' });

    const captures = log.filter((c) => c.kind === 'captureException');
    expect(captures.map((c) => c.provider).sort()).toEqual(['a', 'b']);
    // Every provider received the same error object and context.
    expect((captures[0]!.payload as { error: Error }).error).toBe(err);
  });

  it('honours the explicit `stack` filter', () => {
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
          b: { driver: 'rec-b' },
        },
        stack: ['a'],
      },
      log,
      {
        'rec-a': () => new RecordingReporter('a', log),
        'rec-b': () => new RecordingReporter('b', log),
      }
    );

    manager.captureException(new Error('boom'));

    const providers = log.filter((c) => c.kind === 'captureException').map((c) => c.provider);
    expect(providers).toEqual(['a']);
  });

  it('captureMessage fans out to every provider that supports it', () => {
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
          b: { driver: 'rec-b' },
        },
      },
      log,
      {
        'rec-a': () => new RecordingReporter('a', log),
        'rec-b': () => new RecordingReporter('b', log),
      }
    );

    manager.captureMessage('warn', { severity: 'warning' });

    const providers = log.filter((c) => c.kind === 'captureMessage').map((c) => c.provider);
    expect(providers.sort()).toEqual(['a', 'b']);
  });

  it('addBreadcrumb fans out', () => {
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
        },
      },
      log,
      { 'rec-a': () => new RecordingReporter('a', log) }
    );

    manager.addBreadcrumb({ message: 'user clicked', category: 'ui.click' });

    const bc = log.filter((c) => c.kind === 'addBreadcrumb');
    expect(bc).toHaveLength(1);
    expect(bc[0]!.payload).toEqual({ message: 'user clicked', category: 'ui.click' });
  });

  it('setUser fans out and enriches subsequent captures', () => {
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
        },
      },
      log,
      { 'rec-a': () => new RecordingReporter('a', log) }
    );

    const user: IMonitoringUser = { id: 'user-1', email: 'x@y.z' };
    manager.setUser(user);

    // captureException without a context — enrich() adds the bound user.
    manager.captureException(new Error('boom'));

    const capture = log.find((c) => c.kind === 'captureException');
    const ctx = (capture!.payload as { context: ICaptureContext }).context;
    expect(ctx.user).toEqual(user);
  });

  it('setUser(null) clears every provider', () => {
    const manager = buildManager(
      {
        providers: { a: { driver: 'rec-a' } },
      },
      log,
      { 'rec-a': () => new RecordingReporter('a', log) }
    );

    manager.setUser({ id: 'user-1' });
    log.length = 0; // reset

    manager.setUser(null);
    const setCalls = log.filter((c) => c.kind === 'setUser');
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0]!.payload).toBeNull();
  });

  it('flush awaits every provider and swallows failures', async () => {
    const manager = buildManager(
      {
        providers: {
          good: { driver: 'rec-good' },
          bad: { driver: 'rec-bad' },
        },
      },
      log,
      {
        'rec-good': () => new RecordingReporter('good', log),
        'rec-bad': () => {
          // A provider whose flush rejects — fan-out is fail-soft.
          return {
            name: 'bad',
            captureException: () => {},
            flush: () => Promise.reject(new Error('flush failed')),
          } satisfies IMonitoringProvider;
        },
      }
    );

    await expect(manager.flush()).resolves.toBeUndefined();
    // The good provider still ran flush().
    expect(log.some((c) => c.kind === 'flush' && c.provider === 'good')).toBe(true);
  });

  it('isolates a throwing provider from captureException fan-out', () => {
    const manager = buildManager(
      {
        providers: {
          good: { driver: 'rec-good' },
          broken: { driver: 'rec-broken' },
        },
      },
      log,
      {
        'rec-good': () => new RecordingReporter('good', log),
        'rec-broken': () =>
          ({
            name: 'broken',
            captureException: () => {
              throw new Error('broken');
            },
          }) satisfies IMonitoringProvider,
      }
    );

    expect(() => manager.captureException(new Error('boom'))).not.toThrow();
    // The good provider still saw the capture.
    const providers = log.filter((c) => c.kind === 'captureException').map((c) => c.provider);
    expect(providers).toEqual(['good']);
  });

  it('captureMessage does not throw when providers omit the method', () => {
    const manager = buildManager(
      {
        providers: { minimal: { driver: 'rec-min' } },
      },
      log,
      {
        // A provider that only implements the required captureException.
        'rec-min': () =>
          ({
            name: 'minimal',
            captureException: () => {
              log.push({ provider: 'minimal', kind: 'captureException' });
            },
          }) satisfies IMonitoringProvider,
      }
    );

    expect(() => manager.captureMessage('info')).not.toThrow();
    expect(log.filter((c) => c.kind === 'captureMessage')).toHaveLength(0);
  });
});

describe('MonitoringManager — ad-hoc register()', () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it('adds a provider to the active set', () => {
    const manager = buildManager({ providers: { a: { driver: 'rec-a' } } }, log, {
      'rec-a': () => new RecordingReporter('a', log),
    });

    manager.register(new RecordingReporter('adhoc', log));
    manager.captureException(new Error('boom'));

    const providers = log.filter((c) => c.kind === 'captureException').map((c) => c.provider);
    expect(providers.sort()).toEqual(['a', 'adhoc']);
  });

  it('is idempotent by provider name', () => {
    const manager = buildManager({ providers: {} }, log, {});
    manager.register(new RecordingReporter('adhoc', log));
    manager.register(new RecordingReporter('adhoc', log));

    manager.captureException(new Error('boom'));
    const providers = log.filter((c) => c.kind === 'captureException').map((c) => c.provider);
    expect(providers).toEqual(['adhoc']);
  });

  it('replays bound user when a new provider is registered mid-flight', async () => {
    const manager = buildManager({ providers: {} }, log, {});
    manager.setUser({ id: 'user-1' });

    const adhoc = new RecordingReporter('adhoc', log);
    manager.register(adhoc);
    // register() schedules init() through Promise.resolve() — wait for the tick.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The provider should have received the bound user before its own init.
    const setCalls = log.filter((c) => c.kind === 'setUser' && c.provider === 'adhoc');
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0]!.payload).toEqual({ id: 'user-1' });
  });

  it('swallows init() failures on ad-hoc providers', async () => {
    const manager = buildManager({ providers: {} }, log, {});
    manager.register({
      name: 'broken-init',
      captureException: () => {},
      init: () => Promise.reject(new Error('boom')),
    } satisfies IMonitoringProvider);

    // Wait a microtask — register()'s init call is dispatched via
    // `Promise.resolve().then(...)`.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Manager did not crash — subsequent capture still works.
    expect(() => manager.captureException(new Error('later'))).not.toThrow();
  });
});

describe('MonitoringManager — bootstrap init', () => {
  it('calls init() on every configured provider', async () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
          b: { driver: 'rec-b' },
        },
      },
      log,
      {
        'rec-a': () => new RecordingReporter('a', log),
        'rec-b': () => new RecordingReporter('b', log),
      }
    );

    await manager.onApplicationBootstrap();

    expect(
      log
        .filter((c) => c.kind === 'init')
        .map((c) => c.provider)
        .sort()
    ).toEqual(['a', 'b']);
  });

  it('swallows init() rejections on configured providers', async () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        providers: {
          good: { driver: 'rec-good' },
          bad: { driver: 'rec-bad' },
        },
      },
      log,
      {
        'rec-good': () => new RecordingReporter('good', log),
        'rec-bad': () =>
          ({
            name: 'bad',
            init: () => Promise.reject(new Error('boom')),
            captureException: () => {},
          }) satisfies IMonitoringProvider,
      }
    );

    await expect(manager.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(log.some((c) => c.kind === 'init' && c.provider === 'good')).toBe(true);
  });
});

describe('MonitoringManager — getProviders()', () => {
  it('returns configured ∪ ad-hoc, deduped by name', () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        providers: {
          a: { driver: 'rec-a' },
          b: { driver: 'rec-b' },
        },
      },
      log,
      {
        'rec-a': () => new RecordingReporter('a', log),
        'rec-b': () => new RecordingReporter('b', log),
      }
    );
    manager.register(new RecordingReporter('adhoc', log));
    // A duplicate — dedupe keeps the configured one.
    manager.register(new RecordingReporter('a', log));

    const names = manager.getProviders().map((p) => p.name);
    expect(names.sort()).toEqual(['a', 'adhoc', 'b']);
  });
});
