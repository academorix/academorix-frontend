/**
 * @file monitoring-module.test.ts
 * @module @stackra/monitoring/__tests__/unit
 * @description Structural tests for `MonitoringModule.forRoot()`,
 *   `forRootAsync()`, and `forFeature()`.
 */

import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import type { IMonitoringProvider } from '@stackra/contracts';
import { MONITORING_CONFIG, MONITORING_MANAGER } from '@stackra/contracts';

import { MonitoringModule } from '@/core/monitoring.module';
import { MonitoringManager } from '@/core/services/monitoring-manager.service';
import { MonitoringProviderLoader } from '@/core/services/monitoring-provider-loader.service';

class CustomReporter implements IMonitoringProvider {
  public readonly name = 'custom';
  public captureException(): void {}
}

describe('MonitoringModule.forRoot', () => {
  it('binds config, manager, and loader as global', () => {
    const dyn = MonitoringModule.forRoot();

    expect(dyn.module).toBe(MonitoringModule);
    expect(dyn.global).toBe(true);

    const cfgProvider = dyn.providers!.find((p: any) => p.provide === MONITORING_CONFIG) as {
      useValue: any;
    };
    expect(cfgProvider).toBeDefined();
    expect(cfgProvider.useValue.default).toBe('console');

    expect(dyn.providers).toContain(MonitoringManager);

    const alias = dyn.providers!.find((p: any) => p.provide === MONITORING_MANAGER) as {
      useExisting: unknown;
    };
    expect(alias.useExisting).toBe(MonitoringManager);

    expect(dyn.providers).toContain(MonitoringProviderLoader);
  });

  it('exports the config token, manager token, and manager class', () => {
    const dyn = MonitoringModule.forRoot();
    expect(dyn.exports).toContain(MONITORING_CONFIG);
    expect(dyn.exports).toContain(MONITORING_MANAGER);
    expect(dyn.exports).toContain(MonitoringManager);
  });

  it('respects environment/release overrides', () => {
    const dyn = MonitoringModule.forRoot({ environment: 'prod', release: 'v1' });
    const cfg = dyn.providers!.find((p: any) => p.provide === MONITORING_CONFIG) as {
      useValue: any;
    };
    expect(cfg.useValue.environment).toBe('prod');
    expect(cfg.useValue.release).toBe('v1');
  });
});

describe('MonitoringModule.forRootAsync', () => {
  it('wires an async factory for MONITORING_CONFIG', async () => {
    const dyn = MonitoringModule.forRootAsync({
      useFactory: async () => ({ environment: 'staging' }),
    });

    const cfg = dyn.providers!.find((p: any) => p.provide === MONITORING_CONFIG) as {
      useFactory: (...args: unknown[]) => Promise<any>;
    };
    const merged = await cfg.useFactory();
    expect(merged.environment).toBe('staging');
  });
});

describe('MonitoringModule.forFeature', () => {
  it('registers a single provider via createSeedLoader', () => {
    const dyn = MonitoringModule.forFeature(CustomReporter);

    expect(dyn.providers).toContain(CustomReporter);
    expect(dyn.exports).toEqual([CustomReporter]);

    const factoryProvider = dyn.providers!.find(
      (p: any) => typeof p.provide === 'symbol' && p.useFactory
    ) as { useFactory: Function };
    expect(factoryProvider).toBeDefined();

    // Factory returns a SeedLoader — not a sentinel.
    const registered: IMonitoringProvider[] = [];
    const manager = {
      register: (p: IMonitoringProvider) => registered.push(p),
    } as any;
    const instance = new CustomReporter();
    const loader = factoryProvider.useFactory(manager, instance);
    expect(typeof (loader as any).onApplicationBootstrap).toBe('function');
    (loader as any).onApplicationBootstrap();
    expect(registered).toEqual([instance]);
  });

  it('accepts an array of provider classes', () => {
    class SecondReporter implements IMonitoringProvider {
      public readonly name = 'second';
      public captureException(): void {}
    }
    const dyn = MonitoringModule.forFeature([CustomReporter, SecondReporter]);

    expect(dyn.exports).toEqual([CustomReporter, SecondReporter]);
    const symbolProviders = dyn.providers!.filter((p: any) => typeof p.provide === 'symbol');
    expect(symbolProviders).toHaveLength(2);
  });
});
