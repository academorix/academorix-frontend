/**
 * @file monitoring-provider-loader.service.ts
 * @module @stackra/monitoring/core/services
 * @description Auto-discovery loader for `@MonitoringProvider()` classes.
 *
 *   Scans the container after all modules have wired (`onApplicationBootstrap`)
 *   and registers every discovered provider with the `MonitoringManager`.
 */

import { Inject, Injectable, Optional, OnApplicationBootstrap } from '@stackra/container';
import {
  DISCOVERY_SERVICE,
  MONITORING_MANAGER,
  MONITORING_PROVIDER_METADATA_KEY,
} from '@stackra/contracts';
import type {
  IDiscoveryService,
  IMonitoringManager,
  IMonitoringProvider,
} from '@stackra/contracts';

/**
 * Discovers `@MonitoringProvider()`-decorated providers and registers them.
 */
@Injectable()
export class MonitoringProviderLoader implements OnApplicationBootstrap {
  /**
   * @param manager - The manager to register discovered providers into.
   * @param discovery - Optional discovery service for container scanning.
   */
  public constructor(
    @Inject(MONITORING_MANAGER) private readonly manager: IMonitoringManager,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService
  ) {}

  /** Scan and register after every module has initialised. */
  public onApplicationBootstrap(): void {
    if (!this.discovery) return;

    for (const wrapper of this.discovery.getProvidersByMetadata(MONITORING_PROVIDER_METADATA_KEY)) {
      const instance = wrapper.instance as IMonitoringProvider | undefined;
      if (!instance || typeof instance.captureException !== 'function') continue;
      this.manager.register(instance);
    }
  }
}
