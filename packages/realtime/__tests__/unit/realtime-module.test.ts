/**
 * @file realtime-module.test.ts
 * @module @stackra/realtime/__tests__/unit
 * @description Structural tests for `RealtimeModule.forRoot()`,
 *   `forRootAsync()`, and both `forFeature()` overloads.
 */

import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import type { IRealtimeConnection } from '@stackra/contracts';
import { REALTIME_CONFIG, REALTIME_MANAGER } from '@stackra/contracts';

import { RealtimeModule } from '@/core/realtime.module';
import { RealtimeManager } from '@/core/services/realtime-manager.service';

// A dummy connector class; the actual factory just needs it to be a Function.
class TestConnector {}

describe('RealtimeModule.forRoot', () => {
  it('binds config, manager, and the useExisting alias as global', () => {
    const dyn = RealtimeModule.forRoot({
      default: 'main',
      connections: { main: { driver: 'socketio' } },
    });

    expect(dyn.module).toBe(RealtimeModule);
    expect(dyn.global).toBe(true);

    const cfgProvider = dyn.providers!.find((p: any) => p.provide === REALTIME_CONFIG) as {
      useValue: any;
    };
    expect(cfgProvider.useValue.default).toBe('main');

    expect(dyn.providers).toContain(RealtimeManager);

    const alias = dyn.providers!.find((p: any) => p.provide === REALTIME_MANAGER) as {
      useExisting: unknown;
    };
    expect(alias.useExisting).toBe(RealtimeManager);
  });

  it('exports config token, manager token, and manager class', () => {
    const dyn = RealtimeModule.forRoot({
      default: 'main',
      connections: { main: { driver: 'socketio' } },
    });

    expect(dyn.exports).toContain(REALTIME_CONFIG);
    expect(dyn.exports).toContain(REALTIME_MANAGER);
    expect(dyn.exports).toContain(RealtimeManager);
  });
});

describe('RealtimeModule.forRootAsync', () => {
  it('wires an async factory for REALTIME_CONFIG', async () => {
    const dyn = RealtimeModule.forRootAsync({
      useFactory: async () => ({
        default: 'main',
        connections: { main: { driver: 'socketio' } },
      }),
    });

    const cfg = dyn.providers!.find((p: any) => p.provide === REALTIME_CONFIG) as {
      useFactory: (...args: unknown[]) => Promise<any>;
    };

    const merged = await cfg.useFactory();
    expect(merged.default).toBe('main');
  });
});

describe('RealtimeModule.forFeature — single driver', () => {
  it('registers the connector class and a createSeedLoader factory', () => {
    const dyn = RealtimeModule.forFeature('socketio', TestConnector);

    expect(dyn.providers).toContain(TestConnector);
    expect(dyn.exports).toEqual([TestConnector]);

    const factoryProvider = dyn.providers!.find(
      (p: any) => typeof p.provide === 'symbol' && p.useFactory
    ) as { useFactory: Function };
    expect(factoryProvider).toBeDefined();

    // The factory returns a SeedLoader that calls `manager.registerConnection`.
    let registered: [string, IRealtimeConnection] | null = null;
    const manager = {
      registerConnection: (name: string, conn: IRealtimeConnection) => {
        registered = [name, conn];
      },
    } as any;
    const connection = { disconnect: () => {} } as unknown as IRealtimeConnection;

    const loader = factoryProvider.useFactory(manager, connection);
    expect(typeof (loader as any).onApplicationBootstrap).toBe('function');

    (loader as any).onApplicationBootstrap();
    expect(registered).toEqual(['socketio', connection]);
  });
});

describe('RealtimeModule.forFeature — connectors map', () => {
  class SocketConnector {}
  class PusherConnector {}

  it('accepts a map of drivers → connector classes', () => {
    const dyn = RealtimeModule.forFeature({
      socketio: SocketConnector,
      pusher: PusherConnector,
    });

    expect(dyn.exports).toEqual([SocketConnector, PusherConnector]);
    const symbolProviders = dyn.providers!.filter((p: any) => typeof p.provide === 'symbol');
    expect(symbolProviders).toHaveLength(2);
  });
});
