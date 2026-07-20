/**
 * @file mock-discovery.ts
 * @module @stackra/analytics/__tests__/support
 * @description Hand-rolled `IDiscoveryService` for unit tests.
 *
 *   Wraps a fixed array of `IDiscoveryProvider`-shaped wrappers so
 *   specs can drive `getProvidersByMetadata()` deterministically —
 *   the loader under test only cares about the wrapper's `instance`
 *   field.
 */

import { getMetadata } from "@vivtel/metadata";
import type { IDiscoveryProvider, IDiscoveryService } from "@stackra/contracts";

/**
 * Adds a discoverable class instance to the fake discovery graph.
 *
 * The mock reads the metadata off the class constructor via
 * `getMetadata` — matching the real `DiscoveryService` behaviour so
 * loader specs work against the actual `@AnalyticsProvider()` /
 * `@MonitoringProvider()` / `@Scheduled()` decorators.
 */
export interface IMockProviderInput {
  /** The already-decorated class instance to expose. */
  instance: object;
}

/**
 * In-memory `IDiscoveryService` for tests.
 *
 * `getProviders()` returns every registered instance; `getProvidersByMetadata()`
 * filters to those whose constructor carries the requested key.
 */
export class MockDiscoveryService implements IDiscoveryService {
  private readonly registered: IDiscoveryProvider[] = [];

  public constructor(inputs: IMockProviderInput[] = []) {
    for (const input of inputs) this.register(input);
  }

  /** Add one more provider to the graph. */
  public register(input: IMockProviderInput): this {
    const ctor = input.instance.constructor as Function;
    this.registered.push({
      instance: input.instance,
      metatype: ctor,
      name: ctor.name,
    });
    return this;
  }

  public getProviders(): IDiscoveryProvider[] {
    return [...this.registered];
  }

  public getProvidersByMetadata(key: string | symbol): IDiscoveryProvider[] {
    // Match by the ACTUAL metadata attached to the class — the same
    // filter the real discovery service applies.
    return this.registered.filter((wrapper) => {
      const ctor = wrapper.metatype;
      if (!ctor) return false;
      return getMetadata(key, ctor as object) !== undefined;
    });
  }
}
