/**
 * @file monitoring-provider.decorator.ts
 * @module @stackra/monitoring/core/decorators
 * @description Marks a class as a discoverable monitoring provider.
 */

import { defineMetadata } from "@vivtel/metadata";
import { Injectable } from "@stackra/container";
import { MONITORING_PROVIDER_METADATA_KEY } from "@stackra/contracts";

/** Options accepted by `@MonitoringProvider()`. */
export interface MonitoringProviderOptions {
  /** Unique provider name (matches `IMonitoringProvider.name`). */
  name: string;
}

/**
 * Mark a class as a discoverable {@link IMonitoringProvider}.
 *
 * The `MonitoringProviderLoader` finds every `@MonitoringProvider()` class
 * in the container at bootstrap and registers it with the manager — so a
 * third-party package contributes a provider just by decorating it and
 * listing it as a provider in its own module.
 *
 * @param options - Provider metadata.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @MonitoringProvider({ name: 'datadog' })
 * @Injectable()
 * export class DatadogMonitoringProvider implements IMonitoringProvider { ... }
 * ```
 */
export function MonitoringProvider(options: MonitoringProviderOptions): ClassDecorator {
  return (target: Function) => {
    Injectable()(target);
    defineMetadata(MONITORING_PROVIDER_METADATA_KEY, options, target);
  };
}
