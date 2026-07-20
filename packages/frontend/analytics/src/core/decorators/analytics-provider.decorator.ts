/**
 * @file analytics-provider.decorator.ts
 * @module @stackra/analytics/core/decorators
 * @description Marks a class as a discoverable analytics provider.
 */

import { defineMetadata } from "@vivtel/metadata";
import { Injectable } from "@stackra/container";
import { ANALYTICS_PROVIDER_METADATA_KEY } from "@stackra/contracts";

/** Options accepted by `@AnalyticsProvider()`. */
export interface AnalyticsProviderOptions {
  /** Unique provider name (matches `IAnalyticsProvider.name`). */
  name: string;
}

/**
 * Mark a class as a discoverable {@link IAnalyticsProvider}.
 *
 * The `AnalyticsProviderLoader` finds every `@AnalyticsProvider()` class in
 * the container at bootstrap and registers it with the manager.
 *
 * @param options - Provider metadata.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @AnalyticsProvider({ name: 'amplitude' })
 * @Injectable()
 * export class AmplitudeProvider implements IAnalyticsProvider { ... }
 * ```
 */
export function AnalyticsProvider(options: AnalyticsProviderOptions): ClassDecorator {
  return (target: Function) => {
    Injectable()(target);
    defineMetadata(ANALYTICS_PROVIDER_METADATA_KEY, options, target);
  };
}
