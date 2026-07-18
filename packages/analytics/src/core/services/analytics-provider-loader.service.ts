/**
 * @file analytics-provider-loader.service.ts
 * @module @stackra/analytics/core/services
 * @description Auto-discovery loader for `@AnalyticsProvider()` classes.
 *   Scans the container after all modules have wired and registers every
 *   discovered provider with the `AnalyticsManager`.
 */

import { Inject, Injectable, Optional, OnApplicationBootstrap } from '@stackra/container';
import {
  ANALYTICS_MANAGER,
  ANALYTICS_PROVIDER_METADATA_KEY,
  DISCOVERY_SERVICE,
} from '@stackra/contracts';
import type { IAnalyticsManager, IAnalyticsProvider, IDiscoveryService } from '@stackra/contracts';

/**
 * Discovers `@AnalyticsProvider()`-decorated providers and registers them.
 */
@Injectable()
export class AnalyticsProviderLoader implements OnApplicationBootstrap {
  /**
   * @param manager - The manager to register discovered providers into.
   * @param discovery - Optional discovery service for container scanning.
   */
  public constructor(
    @Inject(ANALYTICS_MANAGER) private readonly manager: IAnalyticsManager,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService
  ) {}

  /** Scan and register after every module has initialised. */
  public onApplicationBootstrap(): void {
    if (!this.discovery) return;

    for (const wrapper of this.discovery.getProvidersByMetadata(ANALYTICS_PROVIDER_METADATA_KEY)) {
      const instance = wrapper.instance as IAnalyticsProvider | undefined;
      if (!instance || typeof instance.track !== 'function') continue;
      this.manager.register(instance);
    }
  }
}
